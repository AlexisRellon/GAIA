"""
Celery Worker Configuration for GAIA RSS Feed Processing
Module: RSS-08 (Backend Integration)

Handles background RSS feed processing on a schedule:
- Default: Every 5 minutes
- Configurable via RSS_UPDATE_INTERVAL environment variable

Usage:
    celery -A celery_worker worker --loglevel=info --pool=solo
    celery -A celery_worker beat --loglevel=info
"""

import os
import logging
from celery import Celery
from celery.schedules import crontab
from datetime import datetime, timedelta

from backend.python.middleware.audit_integrity import compute_checksum_for_log, GENESIS_HASH

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get configuration from environment
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://redis:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://redis:6379/0')
RSS_UPDATE_INTERVAL_MINUTES = int(os.getenv('RSS_UPDATE_INTERVAL_MINUTES', '5'))

# Initialize Celery application
celery_app = Celery(
    'gaia_rss_worker',
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND
)

# Configure Celery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max per task
    task_soft_time_limit=3000,  # 50 minutes soft limit
    worker_prefetch_multiplier=1,  # Only fetch one task at a time
    worker_max_tasks_per_child=50,  # Restart worker after 50 tasks (prevent memory leaks)
)

# Configure periodic tasks
celery_app.conf.beat_schedule = {
    'process-rss-feeds-periodic': {
        'task': 'celery_worker.process_rss_feeds_task',
        'schedule': crontab(minute=f'*/{RSS_UPDATE_INTERVAL_MINUTES}'),  # Every N minutes
        'options': {
            'expires': RSS_UPDATE_INTERVAL_MINUTES * 60 - 10,  # Expire before next run
        }
    },
    'system-heartbeat-periodic': {
        'task': 'celery_worker.system_heartbeat_task',
        'schedule': crontab(minute=f'*/{RSS_UPDATE_INTERVAL_MINUTES}'),  # Align with RSS cadence
        'options': {
            'expires': RSS_UPDATE_INTERVAL_MINUTES * 60 - 10,
        }
    },
}

logger.info(f"Celery configured: RSS feeds will be processed every {RSS_UPDATE_INTERVAL_MINUTES} minutes")


# ============================================================================
# CELERY TASKS
# ============================================================================


@celery_app.task(name='celery_worker.system_heartbeat_task', bind=True)
def system_heartbeat_task(self):
    """Write a tamper-evident heartbeat entry to audit_logs.

    This keeps the service-health dashboard populated even on days when no
    other system telemetry is generated.
    """
    logger.info(f"Starting system heartbeat (Task ID: {self.request.id})")

    start_time = datetime.utcnow()

    try:
        from backend.python.lib.supabase_client import supabase

        timestamp = datetime.utcnow().isoformat()
        metadata = {
            'task_id': self.request.id,
            'heartbeat_type': 'system',
            'source': 'celery_beat',
            'response_time_ms': 0,
        }

        log_entry = {
            'event_type': 'system_event',
            'severity': 'INFO',
            'action': 'system_heartbeat',
            'action_description': 'Scheduled system heartbeat',
            'resource_type': 'system',
            'resource_id': 'heartbeat',
            'user_id': None,
            'user_email': 'system@agaila.local',
            'user_role': 'system',
            'ip_address': None,
            'user_agent': 'celery-beat',
            'created_at': timestamp,
            'first_occurred_at': timestamp,
            'last_occurred_at': timestamp,
            'occurrence_count': 1,
            'status': 'success',
            'success': True,
            'context': metadata,
            'metadata': metadata,
            'old_values': {},
            'new_values': {},
        }

        previous_log_response = supabase.schema('gaia').from_('audit_logs').select('checksum').order('created_at', desc=True).order('id', desc=True).limit(1).execute()
        previous_hash = previous_log_response.data[0]['checksum'] if previous_log_response.data and previous_log_response.data[0].get('checksum') else GENESIS_HASH

        log_entry['checksum'] = compute_checksum_for_log(
            action=log_entry['action'],
            user_id=log_entry['user_id'],
            user_email=log_entry['user_email'],
            user_role=log_entry['user_role'],
            resource_type=log_entry['resource_type'],
            resource_id=log_entry['resource_id'],
            ip_address=log_entry['ip_address'],
            details=log_entry['metadata'],
            timestamp=timestamp,
            previous_hash=previous_hash,
        )

        response = supabase.schema('gaia').from_('audit_logs').insert(log_entry).execute()
        if not response.data:
            raise RuntimeError('heartbeat insert returned no data')

        duration_ms = round((datetime.utcnow() - start_time).total_seconds() * 1000, 2)
        logger.info(f"System heartbeat logged successfully in {duration_ms} ms")
        return {
            'status': 'success',
            'task_id': self.request.id,
            'duration_ms': duration_ms,
        }
    except Exception as exc:
        logger.error(f"System heartbeat failed: {exc}")
        return {
            'status': 'error',
            'task_id': self.request.id,
            'error': str(exc),
        }

@celery_app.task(name='celery_worker.process_rss_feeds_task', bind=True)
def process_rss_feeds_task(self):
    """
    Background task to process RSS feeds.
    Runs on schedule (default: every 5 minutes).
    
    Returns:
        dict: Processing results and statistics
    """
    logger.info(f"Starting RSS feed processing (Task ID: {self.request.id})")
    
    try:
        # Import here to avoid circular dependencies
        from backend.python.lib.supabase_client import supabase
        from backend.python.pipeline.rss_processor_enhanced import rss_processor_enhanced
        import asyncio

        # Respect persisted canonical schedule in system_config
        try:
            key = 'rss.next_run_time'
            cfg = supabase.schema('gaia').from_('system_config').select('config_value').eq('config_key', key).execute()
            if cfg.data and len(cfg.data) > 0 and cfg.data[0].get('config_value'):
                stored_iso = cfg.data[0]['config_value']
                try:
                    # Handle 'Z' suffix for UTC timestamps (Python <3.11 compatibility)
                    stored_dt = datetime.fromisoformat(stored_iso.replace('Z', '+00:00'))
                    now = datetime.utcnow()
                    # Make comparison timezone-aware if stored_dt has tzinfo
                    if stored_dt.tzinfo is not None:
                        from datetime import timezone
                        now = datetime.now(timezone.utc)
                    if now < stored_dt:
                        # Sanity check: don't skip if scheduled time is too far in future
                        max_skip_minutes = RSS_UPDATE_INTERVAL_MINUTES * 3
                        if (stored_dt - now).total_seconds() > max_skip_minutes * 60:
                            logger.warning(f"next_run_time {stored_iso} is too far in future, ignoring and continuing processing")
                            # Continue processing instead of skipping
                        else:
                            logger.info(f"Skipping auto-run: next_run_time in DB is {stored_iso} (UTC)")
                            return {
                                'status': 'skipped',
                                'message': 'Scheduled for future',
                                'scheduled_for': stored_iso,
                                'processed_at': datetime.utcnow().isoformat()
                            }
                except Exception:
                    # If parsing fails, warn but continue with processing
                    logger.warning(f"Invalid rss.next_run_time format in system_config: {stored_iso}")
        except Exception as cfg_err:
            logger.warning(f"Could not read persisted rss.next_run_time: {cfg_err}")
        
        # Find or create job record for this task
        job_id = None
        try:
            # Try to find existing job with this task_id
            jobs = supabase.schema('gaia').table('rss_processing_jobs') \
                .select('*') \
                .eq('status', 'running') \
                .order('started_at', desc=True) \
                .limit(1) \
                .execute()
            
            if jobs.data:
                job_id = jobs.data[0]['id']
                logger.info(f"Found existing job record: {job_id}")
            else:
                # No existing job found - create one for auto-processing (Celery Beat)
                # This happens when task is triggered automatically, not via API
                logger.info("No existing job record found - creating new job for auto-processing")
                job_data = {
                    'started_by': '00000000-0000-0000-0000-000000000000',  # System user UUID
                    'started_by_email': 'system@agaila.local',
                    'status': 'running',
                    'total_feeds': 0,  # Will be updated when feeds are fetched
                    'processed_feeds': 0,
                    'hazards_detected': 0,
                    'errors_encountered': 0,
                    'processing_details': {
                        'task_id': self.request.id,
                        'triggered_by': 'celery_beat_auto'
                    }
                }
                job_result = supabase.schema('gaia').table('rss_processing_jobs').insert(job_data).execute()
                if job_result.data:
                    job_id = job_result.data[0]['id']
                    logger.info(f"Created new job record: {job_id}")
        except Exception as job_err:
            logger.warning(f"Could not find or create job record: {job_err}")
        
        # Get active feeds from database
        feeds_result = supabase.schema('gaia').table('rss_feeds') \
            .select('*') \
            .eq('is_active', True) \
            .order('priority', desc=False) \
            .execute()
        
        if not feeds_result.data:
            logger.warning("No active RSS feeds found in database")
            # Update job status if exists
            if job_id:
                supabase.schema('gaia').table('rss_processing_jobs') \
                    .update({
                        'status': 'completed',
                        'completed_at': datetime.utcnow().isoformat(),
                        'error_message': 'No active feeds configured'
                    }) \
                    .eq('id', job_id) \
                    .execute()
            return {
                'status': 'skipped',
                'message': 'No active feeds configured',
                'processed_at': datetime.utcnow().isoformat()
            }
        
        feeds = feeds_result.data
        total_feeds = len(feeds)
        logger.info(f"Processing {total_feeds} active RSS feeds...")
        
        # Update job with total feeds
        if job_id:
            supabase.schema('gaia').table('rss_processing_jobs') \
                .update({'total_feeds': total_feeds}) \
                .eq('id', job_id) \
                .execute()
        
        # Extract feed URLs
        feed_urls = [feed['feed_url'] for feed in feeds]
        
        # Process feeds using enhanced processor (run async function in sync context)
        rss_processor_enhanced.set_feeds(feed_urls)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        results = loop.run_until_complete(rss_processor_enhanced.process_all_feeds())
        loop.close()
        
        # Calculate statistics
        total_hazards = 0
        total_errors = 0
        processed_count = 0
        
        # Save processing logs to database
        for result in results:
            processed_count += 1
            items_added = result.get('items_added', 0)
            total_hazards += items_added
            
            if result['status'] == 'error':
                total_errors += 1
            
            log_data = {
                'feed_url': result['feed_url'],
                'status': result['status'],
                'items_processed': result.get('items_processed', 0),
                'items_added': items_added,
                'duplicates_detected': result.get('duplicates_detected', 0),
                'errors_count': 1 if result['status'] == 'error' else 0,
                'processing_time_seconds': result.get('processing_time', 0),
                'error_message': result.get('error_message'),
                'hazard_ids': [h['id'] for h in result.get('hazards_saved', [])],
                'processed_by': 'celery'
            }
            
            # Insert log (trigger will update feed stats)
            supabase.schema('gaia').table('rss_processing_logs').insert(log_data).execute()
            
            # Update job progress
            if job_id:
                supabase.schema('gaia').table('rss_processing_jobs') \
                    .update({
                        'processed_feeds': processed_count,
                        'hazards_detected': total_hazards,
                        'errors_encountered': total_errors
                    }) \
                    .eq('id', job_id) \
                    .execute()
        
        # Get statistics
        stats = rss_processor_enhanced.get_statistics()
        
        logger.info(f"RSS processing complete: {stats['total_stored']} hazards saved, "
                   f"{stats['duplicates_detected']} duplicates detected")
        
        # Update job as completed
        if job_id:
            supabase.schema('gaia').table('rss_processing_jobs') \
                .update({
                    'status': 'completed',
                    'completed_at': datetime.utcnow().isoformat(),
                    'processed_feeds': processed_count,
                    'hazards_detected': total_hazards,
                    'errors_encountered': total_errors,
                    'processing_details': {
                        'statistics': stats,
                        'task_id': self.request.id
                    }
                }) \
                .eq('id', job_id) \
                .execute()

        # Update system_config with next scheduled run time so frontend can sync
        try:
            next_run = (datetime.utcnow() + timedelta(minutes=RSS_UPDATE_INTERVAL_MINUTES)).isoformat()
            key = 'rss.next_run_time'
            now_iso = datetime.utcnow().isoformat()
            # Use separate update/insert to preserve original created_at timestamp
            # Try update first
            update_response = supabase.schema('gaia').from_('system_config').update({
                'config_value': next_run,
                'modified_at': now_iso
            }).eq('config_key', key).execute()
            
            # If no rows updated, insert new record with created_at
            if not update_response.data or len(update_response.data) == 0:
                supabase.schema('gaia').from_('system_config').insert({
                    'config_key': key,
                    'config_value': next_run,
                    'value_type': 'string',
                    'created_at': now_iso,
                    'modified_at': now_iso
                }).execute()
            # Invalidate the system config cache so readers pick up the new value immediately
            try:
                # Import here to avoid circular import during Celery initialization
                import asyncio
                from backend.python.lib.config_manager import ConfigManager
                try:
                    asyncio.run(ConfigManager.invalidate_cache('rss.next_run_time'))
                except Exception:
                    # Best-effort: log but do not fail the task
                    logger.warning('Failed to invalidate config cache after updating rss.next_run_time')
            except Exception as inv_err:
                logger.debug(f"Could not run cache invalidation: {inv_err}")
        except Exception as cfg_err:
            logger.warning(f"Failed to update RSS next_run_time in system_config: {cfg_err}")
        
        return {
            'status': 'completed',
            'feeds_processed': len(results),
            'hazards_detected': total_hazards,
            'statistics': stats,
            'processed_at': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in RSS processing task: {str(e)}", exc_info=True)
        
        # Update job as failed
        try:
            from backend.python.lib.supabase_client import supabase
            jobs = supabase.schema('gaia').table('rss_processing_jobs') \
                .select('id') \
                .eq('status', 'running') \
                .order('started_at', desc=True) \
                .limit(1) \
                .execute()
            
            if jobs.data:
                supabase.schema('gaia').table('rss_processing_jobs') \
                    .update({
                        'status': 'failed',
                        'completed_at': datetime.utcnow().isoformat(),
                        'error_message': str(e)
                    }) \
                    .eq('id', jobs.data[0]['id']) \
                    .execute()
        except Exception as update_err:
            logger.error(f"Failed to update job status: {update_err}")
        
        # Retry task up to 3 times with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries), max_retries=3)


@celery_app.task(name='celery_worker.process_single_feed_task', bind=True)
def process_single_feed_task(self, feed_id: str):
    """
    Process a single RSS feed by ID.
    Used for manual/on-demand processing.
    
    Args:
        feed_id: UUID of the feed to process
        
    Returns:
        dict: Processing results
    """
    logger.info(f"Processing single feed: {feed_id} (Task ID: {self.request.id})")
    
    try:
        from backend.python.lib.supabase_client import supabase
        from backend.python.pipeline.rss_processor_enhanced import rss_processor_enhanced
        import asyncio
        
        # Get feed from database
        feed_result = supabase.schema('gaia').table('rss_feeds').select('*').eq('id', feed_id).execute()
        
        if not feed_result.data:
            logger.error(f"Feed not found: {feed_id}")
            return {
                'status': 'error',
                'message': f'Feed not found: {feed_id}'
            }
        
        feed = feed_result.data[0]
        feed_url = feed['feed_url']
        
        logger.info(f"Processing feed: {feed['feed_name']} ({feed_url})")
        
        # Process feed
        rss_processor_enhanced.set_feeds([feed_url])
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        results = loop.run_until_complete(rss_processor_enhanced.process_all_feeds())
        loop.close()
        
        # Save processing log
        if results:
            result = results[0]
            log_data = {
                'feed_url': result['feed_url'],
                'status': result['status'],
                'items_processed': result.get('items_processed', 0),
                'items_added': result.get('items_added', 0),
                'duplicates_detected': result.get('duplicates_detected', 0),
                'errors_count': 1 if result['status'] == 'error' else 0,
                'processing_time_seconds': result.get('processing_time', 0),
                'error_message': result.get('error_message'),
                'hazard_ids': [h['id'] for h in result.get('hazards_saved', [])],
                'processed_by': f'manual_{feed_id}'
            }
            
            supabase.schema('gaia').table('rss_processing_logs').insert(log_data).execute()
            
            return result
        else:
            return {
                'status': 'error',
                'message': 'No results returned'
            }
        
    except Exception as e:
        logger.error(f"Error processing single feed: {str(e)}", exc_info=True)
        raise self.retry(exc=e, countdown=30, max_retries=2)


# ============================================================================
# SMS NOTIFICATION TASK (CR-06)
# ============================================================================

@celery_app.task(name='celery_worker.send_sms_notification', bind=True, max_retries=2)
def send_sms_notification(self, report_id: str, status: str, tracking_number: str, phone_number: str):
    """
    Send SMS notification to citizen reporter about report status (CR-06 SMS Notifications).
    
    Triggered when admin validates/rejects a citizen report.
    Uses AWS SNS for SMS delivery to Philippine phone numbers.
    
    Args:
        report_id: UUID of the citizen report
        status: Report status ('ACCEPTED' or 'REJECTED')
        tracking_number: Report tracking number for user reference
        phone_number: Recipient's phone number (encrypted in database, decrypted here)
    
    Returns:
        dict: SMS delivery result with message_id or error
        
    Raises:
        Retry: On delivery failure, retries up to max_retries with exponential backoff
    """
    from backend.python.lib.sms_service import SMSService
    from backend.python.utils.field_encryption import decrypt_field
    
    try:
        # Decrypt phone number for delivery (stored encrypted in DB)
        phone_number_decrypted = decrypt_field(phone_number) if phone_number else None
        
        if not phone_number_decrypted:
            logger.warning(f"No phone number available for report {report_id}, skipping SMS")
            return {
                'status': 'skipped',
                'reason': 'No phone number provided',
                'report_id': report_id
            }
        
        # Initialize SMS service
        sms_service = SMSService()
        
        # Build SMS message based on status (must be ≤160 chars for SMS)
        track_url = f"https://agaila.me/track?id={tracking_number}"
        if status == 'ACCEPTED':
            message = f"[AGAILA] Report #{tracking_number} ACCEPTED. View: {track_url}"
        elif status == 'REJECTED':
            message = f"[AGAILA] Report #{tracking_number} not verified. View: {track_url}"
        else:
            message = f"[AGAILA] Report #{tracking_number}: {status}. View: {track_url}"
        
        logger.info(f"Sending SMS notification for report {report_id} (status: {status})")
        
        # Send SMS via AWS SNS
        result = sms_service.send_sms(phone_number_decrypted, message)
        
        if result.get('status') == 'success':
            logger.info(
                f"SMS sent successfully for report {report_id} "
                f"(MessageId: {result.get('message_id')})"
            )
            
            # Log delivery success to audit trail
            try:
                from backend.python.lib.supabase_client import supabase
                supabase.schema('gaia').from_('audit_logs').insert({
                    'event_type': 'system_notification',
                    'severity': 'info',
                    'action': 'sms_notification_sent',
                    'resource': 'citizen_report',
                    'status': 'success',
                    'message': f'SMS sent to citizen report {report_id}',
                    'metadata': {
                        'message_id': result.get('message_id'),
                        'report_status': status,
                        'tracking_number': tracking_number
                    }
                }).execute()
            except Exception as audit_err:
                logger.warning(f"Failed to log SMS delivery to audit: {audit_err}")
            
            return result
        else:
            # SMS delivery failed, will retry
            error_msg = result.get('error', 'Unknown error')
            logger.error(f"SMS delivery failed for report {report_id}: {error_msg}")
            
            # Retry with exponential backoff: 30s (retry 1), 60s (retry 2)
            retry_countdown = 30 * (2 ** self.request.retries)
            raise self.retry(
                exc=Exception(f"SMS delivery failed: {error_msg}"),
                countdown=retry_countdown,
                max_retries=2
            )
        
    except Exception as e:
        logger.error(
            f"Error sending SMS notification for report {report_id}: {str(e)}",
            exc_info=True
        )
        
        # Log delivery failure to audit trail
        try:
            from backend.python.lib.supabase_client import supabase
            supabase.schema('gaia').from_('audit_logs').insert({
                'event_type': 'system_notification',
                'severity': 'error',
                'action': 'sms_notification_failed',
                'resource': 'citizen_report',
                'status': 'failure',
                'message': f'SMS delivery failed for citizen report {report_id}',
                'metadata': {
                    'error': str(e),
                    'retry_count': self.request.retries
                }
            }).execute()
        except Exception as audit_err:
            logger.warning(f"Failed to log SMS failure to audit: {audit_err}")
        
        # Retry up to 2 times before giving up
        if self.request.retries < 2:
            retry_countdown = 30 * (2 ** self.request.retries)
            raise self.retry(exc=e, countdown=retry_countdown)
        else:
            # Max retries exceeded, log final failure
            logger.error(f"SMS delivery permanently failed for report {report_id} after 2 retries")
            return {
                'status': 'failed',
                'error': str(e),
                'report_id': report_id,
                'retries_exhausted': True
            }


# ============================================================================
# CELERY EVENTS
# ============================================================================

@celery_app.task(name='celery_worker.test_celery_connection')
def test_celery_connection():
    """
    Test task to verify Celery is working.
    
    Returns:
        dict: Test result with timestamp
    """
    logger.info("Celery connection test task executed")
    return {
        'status': 'success',
        'message': 'Celery worker is operational',
        'timestamp': datetime.utcnow().isoformat()
    }


if __name__ == '__main__':
    # Run worker directly (for development)
    # In production, use: celery -A celery_worker worker --loglevel=info
    logger.info("Starting Celery worker...")
    celery_app.worker_main([
        'worker',
        '--loglevel=info',
        '--concurrency=2',
        '--pool=solo',  # Use solo pool for Windows compatibility
    ])
