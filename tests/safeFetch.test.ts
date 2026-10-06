import { describe, it, expect } from 'vitest'
import { isPrivateIpAddress, isSafeUrl } from '@/utils/safeFetch'

// This is the protection that stops the server from being tricked into reading private addresses.
describe('isPrivateIpAddress', () => {
  it('blocks private, local and special IPv4 ranges', () => {
    const blocked = [
      '0.0.0.0', '10.1.2.3', '127.0.0.1', '100.64.0.1', '169.254.169.254',
      '172.16.0.1', '172.31.255.255', '192.168.1.1', '198.18.0.1', '224.0.0.1', '255.255.255.255',
    ]
    for (const ip of blocked) expect(isPrivateIpAddress(ip)).toBe(true)
  })

  it('allows normal public IPv4 addresses', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '172.15.0.1', '172.32.0.1', '100.63.0.1']) {
      expect(isPrivateIpAddress(ip)).toBe(false)
    }
  })

  it('blocks private and local IPv6 addresses, including IPv4 hidden inside IPv6', () => {
    for (const ip of ['::1', '::', 'fc00::1', 'fd12:3456::1', 'fe80::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1']) {
      expect(isPrivateIpAddress(ip)).toBe(true)
    }
  })

  it('allows a normal public IPv6 address', () => {
    expect(isPrivateIpAddress('2001:4860:4860::8888')).toBe(false)
  })

  it('treats anything that is not an IP as unsafe', () => {
    expect(isPrivateIpAddress('not-an-ip')).toBe(true)
  })
})

describe('isSafeUrl (checks that need no internet)', () => {
  it('only allows http and https', async () => {
    expect(await isSafeUrl('ftp://example.com/file')).toBe(false)
    expect(await isSafeUrl('file:///etc/passwd')).toBe(false)
    expect(await isSafeUrl('javascript:alert(1)')).toBe(false)
  })

  it('blocks local-looking host names', async () => {
    for (const url of ['http://localhost:3000', 'http://app.localhost', 'http://printer.local', 'http://db.internal', 'http://0.0.0.0']) {
      expect(await isSafeUrl(url)).toBe(false)
    }
  })

  it('blocks private IP addresses, including the cloud metadata address', async () => {
    for (const url of ['http://127.0.0.1', 'http://10.0.0.5/admin', 'http://169.254.169.254/latest/meta-data', 'http://192.168.0.1']) {
      expect(await isSafeUrl(url)).toBe(false)
    }
  })

  it('allows a public IP address', async () => {
    expect(await isSafeUrl('http://8.8.8.8/')).toBe(true)
  })

  it('rejects text that is not an address', async () => {
    expect(await isSafeUrl('not a url')).toBe(false)
  })
})
