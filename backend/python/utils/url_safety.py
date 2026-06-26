"""
SSRF-safe URL validation (OWASP A10 / FASTAPI-SSRF-001).

Treats any user-supplied URL as untrusted. A URL is only considered safe to
fetch server-side if:
  * its scheme is http/https, and
  * EVERY DNS-resolved address is a global/public IP — i.e. not loopback,
    private (RFC1918), link-local (incl. 169.254.169.254 cloud metadata),
    reserved, multicast, or unspecified.

Resolving and checking the IPs (rather than string-matching the hostname)
defeats tricks like `http://0x7f.0.0.1`, decimal IPs, and names that resolve to
internal addresses.

Residual caveat: DNS rebinding (the address can change between this check and
the actual fetch). For full protection, pin the validated IP for the connection.
This guard is a strong baseline that blocks the common SSRF targets.
"""
import ipaddress
import socket
from urllib.parse import urlparse

_ALLOWED_SCHEMES = {"http", "https"}
_MAX_URL_LEN = 2048


def _ip_is_blocked(ip_str: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip_str)
    except ValueError:
        return True  # not a parseable IP -> reject
    return not addr.is_global or addr.is_multicast


def is_safe_public_url(url: str) -> bool:
    """Return True only if `url` is an http(s) URL that resolves to public IP(s)."""
    if not url or not isinstance(url, str) or len(url) > _MAX_URL_LEN:
        return False

    try:
        parsed = urlparse(url.strip())
    except Exception:
        return False

    if parsed.scheme.lower() not in _ALLOWED_SCHEMES:
        return False

    host = parsed.hostname
    if not host:
        return False

    try:
        port = parsed.port or (443 if parsed.scheme.lower() == "https" else 80)
        if not (1 <= port <= 65535):
            return False
    except ValueError:
        return False

    # An IP literal must itself be public.
    try:
        ipaddress.ip_address(host)
        return not _ip_is_blocked(host)
    except ValueError:
        pass  # hostname, resolve below

    try:
        infos = socket.getaddrinfo(host, port, proto=socket.IPPROTO_TCP)
    except Exception:
        return False  # unresolvable -> reject

    if not infos:
        return False
    for info in infos:
        ip_str = info[4][0]
        if _ip_is_blocked(ip_str):
            return False
    return True
