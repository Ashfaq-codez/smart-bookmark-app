import dns from 'node:dns/promises';
import net from 'node:net';

/**
 * Checks if an IPv4 or IPv6 address belongs to private, loopback, link-local,
 * carrier-grade NAT, or other non-routable / reserved ranges.
 */
export function isPrivateIpAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true;
    }

    // 0.0.0.0/8 (Current network / default route)
    if (parts[0] === 0) return true;
    // 10.0.0.0/8 (Private-Use)
    if (parts[0] === 10) return true;
    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true;
    // 100.64.0.0/10 (Shared Address / CGNAT)
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
    // 169.254.0.0/16 (Link-Local / Cloud Instance Metadata)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 172.16.0.0/12 (Private-Use)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (parts[0] === 192 && parts[1] === 0 && parts[2] === 0) return true;
    // 192.0.2.0/24 (TEST-NET-1)
    if (parts[0] === 192 && parts[1] === 0 && parts[2] === 2) return true;
    // 192.88.99.0/24 (6to4 Relay Anycast)
    if (parts[0] === 192 && parts[1] === 88 && parts[2] === 99) return true;
    // 192.168.0.0/16 (Private-Use)
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 198.18.0.0/15 (Benchmarking)
    if (parts[0] === 198 && (parts[1] === 18 || parts[1] === 19)) return true;
    // 198.51.100.0/24 (TEST-NET-2)
    if (parts[0] === 198 && parts[1] === 51 && parts[2] === 100) return true;
    // 203.0.113.0/24 (TEST-NET-3)
    if (parts[0] === 203 && parts[1] === 0 && parts[2] === 113) return true;
    // 224.0.0.0/4 (Multicast)
    if (parts[0] >= 224 && parts[0] <= 239) return true;
    // 240.0.0.0/4 (Reserved / Future Use)
    if (parts[0] >= 240) return true;
    // Broadcast
    if (ip === '255.255.255.255') return true;

    return false;
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    // Loopback ::1, Unspecified ::
    if (normalized === '::1' || normalized === '::') return true;

    // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
    if (normalized.startsWith('::ffff:')) {
      const ipv4Part = normalized.substring(7);
      if (net.isIPv4(ipv4Part)) {
        return isPrivateIpAddress(ipv4Part);
      }
      return true;
    }

    // Unique Local Address fc00::/7 (fc00:: - fdff::)
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

    // Link-Local Unicast fe80::/10 (fe80:: - febf::)
    if (
      normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') ||
      normalized.startsWith('fea') ||
      normalized.startsWith('feb')
    ) {
      return true;
    }

    return false;
  }

  return true;
}

/**
 * Validates that a URL uses http/https, does not target internal hostnames,
 * and resolves only to non-private public IP addresses.
 */
export async function isSafeUrl(urlStr: string): Promise<boolean> {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (!hostname) return false;

    // Immediately reject known localhost and local domain patterns
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === '0.0.0.0'
    ) {
      return false;
    }

    // If hostname is directly an IP address
    if (net.isIP(hostname)) {
      return !isPrivateIpAddress(hostname);
    }

    // Resolve DNS to verify all underlying IP addresses (prevents DNS rebinding)
    const lookup = await dns.lookup(hostname, { all: true });
    if (!lookup || lookup.length === 0) {
      return false;
    }

    for (const record of lookup) {
      if (isPrivateIpAddress(record.address)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Performs a network fetch with SSRF protection, manual redirect validation,
 * and automatic resolution of redirect target addresses.
 */
export async function safeFetch(
  url: string,
  options: RequestInit = {},
  maxRedirects = 3
): Promise<Response> {
  let currentUrl = url;

  for (let i = 0; i <= maxRedirects; i++) {
    const isSafe = await isSafeUrl(currentUrl);
    if (!isSafe) {
      throw new Error('Access to restricted address denied (SSRF protection)');
    }

    const response = await fetch(currentUrl, {
      ...options,
      redirect: 'manual',
    });

    // Handle HTTP redirect codes (301, 302, 303, 307, 308)
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) {
        return response;
      }

      // Safely resolve relative redirects against current URL
      currentUrl = new URL(location, currentUrl).href;
      continue;
    }

    return response;
  }

  throw new Error('Too many redirects');
}
