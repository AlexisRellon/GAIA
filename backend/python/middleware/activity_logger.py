"""
Activity and Audit Logging Utility for GAIA
Centralized logging for all user actions and system events

Module: AC-05 (Session and Activity Logger)
Tables: gaia.activity_logs, gaia.audit_logs
Security: IP tracking, user agent logging, request validation
"""

import logging
from typing import Optional, Dict, Any
from datetime import datetime
from fastapi import Request
from backend.python.lib.supabase_client import supabase
from backend.python.middleware.rbac import UserContext

logger = logging.getLogger(__name__)


class ActivityLogger:
    """
    Centralized activity and audit logging utility.
    
    Usage:
        # Log user activity
        await ActivityLogger.log_activity(
            user_context=user,
            action="LOGIN",
            resource_type="auth",
            details={"method": "email"}
        )
        
        # Log audit event
        await ActivityLogger.log_audit(
            user_context=user,
            action="UPDATE_CONFIG",
            resource="system_config",
            status="success"
        )
    """
    
    @staticmethod
    async def log_activity(
        user_context: UserContext,
        action: str,
        request: Optional[Request] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Log user activity to activity_logs table.
        
        Args:
            user_context: Authenticated user context
            action: Action performed (LOGIN, LOGOUT, VIEW, VALIDATE, etc.)
            request: FastAPI request object (for IP/user agent)
            resource_type: Type of resource accessed (hazard, report, config, etc.)
            resource_id: ID of specific resource
            details: Additional contextual information
            
        Returns:
            bool: True if logged successfully
        """
        try:
            # Extract IP and user agent
            ip_address = None
            user_agent = None
            
            if request:
                forwarded = request.headers.get("X-Forwarded-For")
                ip_address = forwarded.split(",")[0] if forwarded else request.client.host
                user_agent = request.headers.get("User-Agent")
            
            # Build activity log entry
            log_entry = {
                "user_id": user_context.user_id,
                "user_email": user_context.email,
                "user_role": user_context.role.value,
                "action": action,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "details": details or {},
                "ip_address": ip_address,
                "user_agent": user_agent,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Insert into activity_logs table
            response = supabase.schema("gaia").from_("activity_logs").insert(log_entry).execute()
            
            if response.data:
                logger.info(f"Activity logged: {user_context.email} - {action}")
                return True
            else:
                logger.warning(f"Activity log returned no data: {action}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to log activity: {str(e)}")
            return False
    
    @staticmethod
    async def log_audit(
        user_context: Optional[UserContext],
        action: str,
        resource: str,
        status: str,  # success, failure, pending
        event_type: str = "user_action",  # user_action, system_event, security_event
        severity: str = "info",  # info, warning, error, critical
        message: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None
    ) -> bool:
        """
        Log audit event to audit_logs table.
        
        Args:
            user_context: User who performed action (None for system events)
            action: Action performed
            resource: Resource affected
            status: Result status (success, failure, pending)
            event_type: Type of event
            severity: Severity level
            message: Human-readable message
            metadata: Additional structured data
            request: FastAPI request object
            
        Returns:
            bool: True if logged successfully
        """
        try:
            # Extract IP and user agent
            ip_address = None
            
            if request:
                forwarded = request.headers.get("X-Forwarded-For")
                ip_address = forwarded.split(",")[0] if forwarded else request.client.host
            
            # Build audit log entry
            log_entry = {
                "event_type": event_type,
                "severity": severity,
                "user_id": user_context.user_id if user_context else None,
                "user_email": user_context.email if user_context else "system",
                "action": action,
                "resource": resource,
                "status": status,
                "message": message,
                "metadata": metadata or {},
                "ip_address": ip_address,
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Insert into audit_logs table
            response = supabase.schema("gaia").from_("audit_logs").insert(log_entry).execute()
            
            if response.data:
                logger.info(f"Audit logged: {action} - {status}")
                return True
            else:
                logger.warning(f"Audit log returned no data: {action}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to log audit event: {str(e)}")
            return False
    
    @staticmethod
    async def log_rss_processing(
        started_by: UserContext,
        feeds_processed: int,
        hazards_detected: int,
        errors: int,
        processing_time: float
    ) -> bool:
        """
        Log RSS processing completion.
        
        Args:
            started_by: User who initiated processing
            feeds_processed: Number of feeds processed
            hazards_detected: Number of hazards detected
            errors: Number of errors encountered
            processing_time: Processing duration in seconds
            
        Returns:
            bool: True if logged successfully
        """
        return await ActivityLogger.log_activity(
            user_context=started_by,
            action="RSS_PROCESSING_COMPLETE",
            resource_type="rss_feeds",
            details={
                "feeds_processed": feeds_processed,
                "hazards_detected": hazards_detected,
                "errors": errors,
                "processing_time_seconds": processing_time
            }
        )
    
    @staticmethod
    async def log_hazard_validation(
        validator: UserContext,
        hazard_id: str,
        validated: bool,
        confidence_score: float,
        notes: Optional[str] = None
    ) -> bool:
        """
        Log hazard validation action.
        
        Args:
            validator: User who validated the hazard
            hazard_id: ID of hazard validated
            validated: Whether approved or rejected
            confidence_score: Confidence score of hazard
            notes: Validation notes
            
        Returns:
            bool: True if logged successfully
        """
        action = "VALIDATE_HAZARD" if validated else "REJECT_HAZARD"
        
        await ActivityLogger.log_activity(
            user_context=validator,
            action=action,
            resource_type="hazard",
            resource_id=hazard_id,
            details={
                "validated": validated,
                "confidence_score": confidence_score,
                "notes": notes
            }
        )
        
        return await ActivityLogger.log_audit(
            user_context=validator,
            action=action,
            resource=f"hazard:{hazard_id}",
            status="success",
            event_type="user_action",
            severity="info",
            message=f"Hazard {'validated' if validated else 'rejected'} with confidence {confidence_score}",
            metadata={
                "hazard_id": hazard_id,
                "validated": validated,
                "confidence_score": confidence_score
            }
        )
    
    @staticmethod
    async def log_config_change(
        admin: UserContext,
        config_key: str,
        old_value: Any,
        new_value: Any,
        request: Optional[Request] = None
    ) -> bool:
        """
        Log system configuration change.
        
        Args:
            admin: Administrator who made the change
            config_key: Configuration key changed
            old_value: Previous value
            new_value: New value
            request: FastAPI request object
            
        Returns:
            bool: True if logged successfully
        """
        await ActivityLogger.log_activity(
            user_context=admin,
            action="UPDATE_CONFIG",
            request=request,
            resource_type="system_config",
            resource_id=config_key,
            details={
                "config_key": config_key,
                "old_value": str(old_value),
                "new_value": str(new_value)
            }
        )
        
        return await ActivityLogger.log_audit(
            user_context=admin,
            action="UPDATE_CONFIG",
            resource=f"system_config:{config_key}",
            status="success",
            event_type="user_action",
            severity="warning",  # Config changes are important
            message=f"Configuration '{config_key}' changed from {old_value} to {new_value}",
            metadata={
                "config_key": config_key,
                "old_value": str(old_value),
                "new_value": str(new_value)
            },
            request=request
        )
    
    @staticmethod
    async def log_user_auth(
        user_email: str,
        user_id: str,
        action: str,  # LOGIN, LOGOUT, FAILED_LOGIN
        request: Optional[Request] = None,
        reason: Optional[str] = None
    ) -> bool:
        """
        Log authentication events.
        
        Args:
            user_email: User's email
            user_id: User's ID
            action: Auth action (LOGIN, LOGOUT, FAILED_LOGIN)
            request: FastAPI request object
            reason: Failure reason (for failed logins)
            
        Returns:
            bool: True if logged successfully
        """
        try:
            # Extract IP and user agent
            ip_address = None
            user_agent = None
            
            if request:
                forwarded = request.headers.get("X-Forwarded-For")
                ip_address = forwarded.split(",")[0] if forwarded else request.client.host
                user_agent = request.headers.get("User-Agent")
            
            # Determine status and severity
            status = "success" if action != "FAILED_LOGIN" else "failure"
            severity = "info" if status == "success" else "warning"
            
            # Log to audit_logs (auth events are security-relevant)
            log_entry = {
                "event_type": "security_event",
                "severity": severity,
                "user_id": user_id if status == "success" else None,
                "user_email": user_email,
                "action": action,
                "resource": "authentication",
                "status": status,
                "message": f"User {action.lower().replace('_', ' ')}: {user_email}" + (f" - {reason}" if reason else ""),
                "metadata": {
                    "user_email": user_email,
                    "action": action,
                    "reason": reason
                } if reason else {"user_email": user_email, "action": action},
                "ip_address": ip_address,
                "created_at": datetime.utcnow().isoformat()
            }
            
            response = supabase.schema("gaia").from_("audit_logs").insert(log_entry).execute()
            
            if response.data:
                logger.info(f"Auth event logged: {user_email} - {action}")
                return True
            else:
                logger.warning(f"Auth log returned no data: {action}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to log auth event: {str(e)}")
            return False
