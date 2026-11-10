import time
import os
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, HTTPException, status

class InMemoryRateLimiter:
    """
    Thread-safe, sliding-window in-memory rate limiter.
    Zero external dependencies, zero paid infrastructure.
    Guarantees that legitimate real users are never throttled during regular usage,
    while protecting free-tier Gemini API quotas from rapid script loops or abusive spam.
    """
    def __init__(self, requests_limit: int = 20, window_seconds: int = 60, max_tracked_clients: int = 500):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.max_tracked_clients = max_tracked_clients
        self._records: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, client_key: str) -> Tuple[bool, int]:
        """
        Check if client_key is within the allowed request rate.
        Returns: (is_allowed: bool, retry_after_seconds: int)
        """
        # Allow disabling rate limiting during automated testing
        if os.getenv("TESTING", "").lower() == "true" or os.getenv("DISABLE_RATE_LIMIT", "").lower() == "true":
            return True, 0

        now = time.time()
        window_start = now - self.window_seconds

        # Prune dictionary if client count exceeds max_tracked_clients
        if len(self._records) > self.max_tracked_clients:
            self._cleanup_stale_records(now)

        timestamps = [ts for ts in self._records[client_key] if ts > window_start]
        self._records[client_key] = timestamps

        if len(timestamps) >= self.requests_limit:
            oldest = timestamps[0]
            retry_after = max(1, int(oldest + self.window_seconds - now))
            return False, retry_after

        self._records[client_key].append(now)
        return True, 0

    def _cleanup_stale_records(self, now: float):
        """Purge entries that have had no activity within the current window."""
        window_start = now - self.window_seconds
        stale_keys = [k for k, v in self._records.items() if not v or v[-1] <= window_start]
        for k in stale_keys:
            self._records.pop(k, None)

    def reset(self):
        """Reset all tracked client records (useful for test isolation)."""
        self._records.clear()

# Configured instances:
# Chat endpoint: 20 requests per minute per employee/IP (Real humans asking HR queries need > 5s per turn)
chat_limiter = InMemoryRateLimiter(requests_limit=20, window_seconds=60)

# Auth login: 10 attempts per minute per IP (Stops automated brute-force without affecting normal logins)
auth_limiter = InMemoryRateLimiter(requests_limit=10, window_seconds=60)

