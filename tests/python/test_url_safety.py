"""
Unit tests for the SSRF-safe URL validator (OWASP A10 / FASTAPI-SSRF-001).

Uses IP-literal cases (no external DNS) plus `localhost` (always resolvable) so
the suite is deterministic and offline-friendly.
"""
import os
import sys

import pytest

PROJECT_ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
BACKEND_PY = os.path.join(PROJECT_ROOT, "backend", "python")
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, BACKEND_PY)

from backend.python.utils.url_safety import is_safe_public_url  # noqa: E402


class TestIsSafePublicUrl:
    @pytest.mark.parametrize(
        "url",
        [
            "https://8.8.8.8",            # public IP literal
            "http://1.1.1.1/feed.xml",    # public IP literal
        ],
    )
    def test_allows_public_urls(self, url):
        assert is_safe_public_url(url) is True

    @pytest.mark.parametrize(
        "url",
        [
            "http://127.0.0.1",                       # loopback
            "http://localhost/api",                   # resolves to loopback
            "http://169.254.169.254/latest/meta-data",  # cloud metadata (link-local)
            "http://10.0.0.5",                        # private
            "http://192.168.1.10",                    # private
            "http://172.16.0.1",                      # private
            "http://[::1]/",                          # IPv6 loopback
            "http://0.0.0.0",                         # unspecified
        ],
    )
    def test_blocks_internal_targets(self, url):
        assert is_safe_public_url(url) is False

    @pytest.mark.parametrize(
        "url",
        [
            "ftp://example.com/x",     # disallowed scheme
            "file:///etc/passwd",      # disallowed scheme
            "javascript:alert(1)",     # disallowed scheme
            "gopher://8.8.8.8",        # disallowed scheme
            "",                        # empty
            "not a url",               # no scheme/host
            "https://" + "a" * 3000,   # over length cap
        ],
    )
    def test_rejects_malformed_or_disallowed(self, url):
        assert is_safe_public_url(url) is False
