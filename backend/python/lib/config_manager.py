"""
System Configuration Manager with Redis Caching

Provides centralized configuration management with automatic caching and TTL-based expiration.
Ensures configuration changes are picked up by running services within the cache TTL.

Features:
- Redis-backed caching with 30-second TTL
- Single-config and bulk-config retrieval
- Cache invalidation on updates
- Fallback to database on cache miss
- Thread-safe operations

Usage:
    from backend.python.lib.config_manager import ConfigManager
    
    # Get single config value
    threshold = await ConfigManager.get_config('confidence_threshold_rss', default=0.70)
    
    # Get multiple configs
    thresholds = await ConfigManager.get_configs([
        'confidence_threshold_rss',
        'confidence_threshold_citizen'
    ])
    
    # Invalidate cache after update
    await ConfigManager.invalidate_cache('confidence_threshold_rss')
"""

import logging
import os
from typing import Optional, Dict, Any, List
from datetime import datetime
import json

# Try to import async Redis, but fallback gracefully
try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    aioredis = None

# Import Supabase client
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib.supabase_client import supabase

logger = logging.getLogger(__name__)

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/2")
CACHE_PREFIX = "gaia:config"
CONFIG_CACHE_TTL = 30  # 30-second TTL for config values

import asyncio
import threading

# Module-level lock to protect asyncio.Lock creation in ConfigManager._get_init_lock
_init_lock_creation_lock = threading.Lock()

class ConfigManager:
    """
    Centralized system configuration manager with Redis caching.
    
    Caches system_config database values to improve performance and ensure
    that configuration changes are picked up by running services within 30 seconds.
    """
    
    _redis_client: Optional['aioredis.Redis'] = None
    _cache_initialized = False
    _init_lock: asyncio.Lock = None

    @classmethod
    def _get_init_lock(cls) -> asyncio.Lock:
        """
        Get or create the asyncio.Lock for initialization, protected by module-level threading lock.
        This prevents race conditions when multiple coroutines try to create the lock simultaneously.
        """
        if cls._init_lock is None:
            with _init_lock_creation_lock:
                # Double-check after acquiring the lock
                if cls._init_lock is None:
                    cls._init_lock = asyncio.Lock()
        return cls._init_lock
    
    @classmethod
    async def _get_redis(cls) -> Optional['aioredis.Redis']:
        """
        Lazy initialize Redis connection.
        
        Returns:
            Redis client or None if Redis unavailable
        """
        if not REDIS_AVAILABLE:
            return None
            
        if cls._redis_client is None:
            async with cls._get_init_lock():
                if cls._redis_client is None:  # Double-check after acquiring lock
                    try:
                        cls._redis_client = aioredis.from_url(
                            REDIS_URL,
                            decode_responses=True,
                            socket_connect_timeout=5,
                            socket_timeout=5,
                            retry_on_timeout=True
                        )
                        await cls._redis_client.ping()
                        logger.info("✓ Config manager Redis connected successfully")
                    except Exception as e:
                        logger.warning(f"Redis connection failed for config manager: {str(e)} - will use database-only mode")
                        cls._redis_client = None
        
        return cls._redis_client
    
    @classmethod
    def _make_cache_key(cls, config_key: str) -> str:
        """Generate cache key for a configuration."""
        return f"{CACHE_PREFIX}:{config_key}"
    
    @classmethod
    async def get_config(
        cls,
        config_key: str,
        default: Optional[Any] = None
    ) -> Optional[Any]:
        """
        Fetch a single configuration value with caching.
        
        Args:
            config_key: Configuration key to fetch
            default: Default value if not found
            
        Returns:
            Configuration value from cache or database, or default
        """
        try:
            # Try Redis cache first
            redis = await cls._get_redis()
            cache_key = cls._make_cache_key(config_key)
            
            if redis:
                try:
                    cached_value = await redis.get(cache_key)
                    if cached_value is not None:
                        logger.debug(f"Config cache hit: {config_key}")
                        return json.loads(cached_value)
                except Exception as e:
                    logger.warning(f"Redis get failed for {config_key}: {str(e)}")
            
            # Cache miss or Redis unavailable - fetch from database
            logger.debug(f"Config cache miss: {config_key}")
            # Avoid using .single() because PostgREST returns an error when 0 rows are found
            response = supabase.schema('gaia').from_('system_config').select(
                'config_value'
            ).eq('config_key', config_key).execute()

            # Supabase client returns response.data as a list when using select()
            if getattr(response, 'data', None):
                # Take the first row if present
                row = response.data[0]
                value = row.get('config_value')

                # Store in cache for future hits
                if redis:
                    try:
                        await redis.setex(
                            cache_key,
                            CONFIG_CACHE_TTL,
                            json.dumps(value)
                        )
                        logger.debug(f"Config cached: {config_key} (TTL: {CONFIG_CACHE_TTL}s)")
                    except Exception as e:
                        logger.warning(f"Redis set failed for {config_key}: {str(e)}")

                return value

            # No row found - return default
            return default
            
        except Exception as e:
            logger.error(f"Error fetching config '{config_key}': {str(e)}")
            return default
    
    @classmethod
    async def get_configs(
        cls,
        config_keys: List[str]
    ) -> Dict[str, Any]:
        """
        Fetch multiple configuration values with caching.
        
        Args:
            config_keys: List of configuration keys to fetch
            
        Returns:
            Dictionary of {config_key: config_value}
        """
        try:
            result = {}
            redis = await cls._get_redis()
            cache_keys = {config_key: cls._make_cache_key(config_key) for config_key in config_keys}
            
            # Try to get all from cache first (if Redis available)
            cached_values = {}
            keys_to_fetch = set(config_keys)
            
            if redis:
                try:
                    for config_key, cache_key in cache_keys.items():
                        cached_value = await redis.get(cache_key)
                        if cached_value is not None:
                            cached_values[config_key] = json.loads(cached_value)
                            keys_to_fetch.discard(config_key)
                    
                    if cached_values:
                        logger.debug(f"Config cache hits: {len(cached_values)} keys")
                except Exception as e:
                    logger.warning(f"Redis mget failed: {str(e)}")
            
            # Fetch remaining from database
            if keys_to_fetch:
                logger.debug(f"Config cache misses: {len(keys_to_fetch)} keys")
                response = supabase.schema('gaia').from_('system_config').select(
                    'config_key, config_value'
                ).in_('config_key', list(keys_to_fetch)).execute()
                
                if response.data:
                    # Store fetched values in cache
                    for config in response.data:
                        config_key = config['config_key']
                        value = config['config_value']
                        cached_values[config_key] = value
                        
                        # Cache each value
                        if redis:
                            try:
                                cache_key = cache_keys[config_key]
                                await redis.setex(
                                    cache_key,
                                    CONFIG_CACHE_TTL,
                                    json.dumps(value)
                                )
                            except Exception as e:
                                logger.warning(f"Redis set failed for {config_key}: {str(e)}")
            
            return cached_values
            
        except Exception as e:
            logger.error(f"Error fetching multiple configs: {str(e)}")
            return {}
    
    @classmethod
    async def get_all_configs(cls) -> Dict[str, Any]:
        """
        Fetch all system configuration values.
        
        Returns:
            Dictionary of all {config_key: config_value}
        """
        try:
            redis = await cls._get_redis()
            
            # Try to get all from cache (using pattern scan)
            if redis:
                try:
                    cursor = 0
                    all_configs = {}

                    # Scan for all config keys
                    while True:
                        cursor, keys = await redis.scan(
                            cursor,
                            match=f"{CACHE_PREFIX}:*",
                            count=100
                        )

                        MARKER_KEY = f"{CACHE_PREFIX}:__ALL_MARKER__"

                        for key in keys:
                            # Extract config_key from cache_key
                            config_key = key.removeprefix(f"{CACHE_PREFIX}:")
                            if config_key == "__ALL_MARKER__":
                                continue  # Skip the marker key
                            value = await redis.get(key)
                            if value:
                                all_configs[config_key] = json.loads(value)

                        if cursor == 0:
                            break

                    if all_configs:
                        # Verify completeness: prefer an explicit full-snapshot marker or compare counts
                        marker_key = MARKER_KEY
                        try:
                            marker = await redis.get(marker_key)
                        except Exception:
                            marker = None

                        if marker:
                            logger.debug(f"Config cache full-snapshot marker present, returning {len(all_configs)} items")
                            return all_configs
                        # Otherwise check DB authoritative count
                        try:
                            resp = supabase.schema('gaia').from_('system_config').select('config_key', count='exact').execute()
                            db_count = resp.count or 0
                        except Exception:
                            db_count = None

                        if db_count is not None and db_count == len(all_configs):
                            # Optionally write a short-lived full snapshot marker to speed future reads
                            try:
                                await redis.setex(marker_key, CONFIG_CACHE_TTL, '1')
                            except Exception:
                                pass
                            logger.debug(f"Config cache appears complete (count {db_count}), returning items")
                            return all_configs

                        # Partial cache detected - fall back to DB
                        logger.debug("Config cache appears partial or marker missing; falling back to DB")
                except Exception as e:
                    logger.warning(f"Redis scan failed: {str(e)}")
            
            # Cache miss or Redis unavailable - fetch from database
            logger.debug("Config cache miss for all configs")
            response = supabase.schema('gaia').from_('system_config').select(
                'config_key, config_value'
            ).execute()
            
            if response.data:
                result = {}
                for config in response.data:
                    config_key = config['config_key']
                    value = config['config_value']
                    result[config_key] = value
                    
                    # Cache each value individually
                    if redis:
                        try:
                            cache_key = cls._make_cache_key(config_key)
                            await redis.setex(
                                cache_key,
                                CONFIG_CACHE_TTL,
                                json.dumps(value)
                            )
                        except Exception as e:
                            logger.debug(f"Redis set failed for {config_key}: {str(e)}")
                
                return result
            
            return {}
            
        except Exception as e:
            logger.error(f"Error fetching all configs: {str(e)}")
            return {}
    
    @classmethod
    async def invalidate_cache(cls, config_key: Optional[str] = None) -> bool:
        """
        Invalidate configuration cache.
        
        Args:
            config_key: Specific key to invalidate, or None to invalidate all
            
        Returns:
            True if invalidated, False if Redis unavailable
        """
        # Let callers observe failures instead of swallowing exceptions.
        redis = await cls._get_redis()
        if not redis:
            logger.debug("Redis unavailable - cache invalidation skipped")
            return False

        if config_key:
            # Invalidate specific key
            cache_key = cls._make_cache_key(config_key)
            deleted = await redis.delete(cache_key)
            logger.info(f"Config cache invalidated: {config_key} ({deleted} keys deleted)")
        else:
            # Invalidate all config keys
            cursor = 0
            total_deleted = 0

            while True:
                cursor, keys = await redis.scan(
                    cursor,
                    match=f"{CACHE_PREFIX}:*",
                    count=100
                )

                if keys:
                    deleted = await redis.delete(*keys)
                    total_deleted += deleted

                if cursor == 0:
                    break

            logger.info(f"Config cache invalidated: all keys ({total_deleted} keys deleted)")

        return True
    
    @classmethod
    async def get_cache_info(cls) -> Dict[str, Any]:
        """
        Get diagnostic information about config cache.
        
        Returns:
            Dictionary with cache status and statistics
        """
        try:
            redis = await cls._get_redis()
            
            if not redis:
                return {
                    "redis_available": False,
                    "cache_mode": "database-only",
                    "message": "Redis not available"
                }
            
            # Count cached config keys
            cursor = 0
            count = 0
            
            while True:
                cursor, keys = await redis.scan(
                    cursor,
                    match=f"{CACHE_PREFIX}:*",
                    count=100
                )
                count += len(keys)
                if cursor == 0:
                    break
            
            return {
                "redis_available": True,
                "cache_mode": "redis-backed",
                "cached_configs": count,
                "ttl_seconds": CONFIG_CACHE_TTL,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting cache info: {str(e)}")
            return {"error": str(e)}
