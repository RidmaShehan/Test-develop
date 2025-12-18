import { NextRequest } from 'next/server'

interface LocationData {
  country?: string
  city?: string
  region?: string
  latitude?: number
  longitude?: number
  timezone?: string
  isp?: string
}

interface DeviceInfo {
  browser?: string
  os?: string
  device?: string
  platform?: string
}

export async function getLocationFromIP(ipAddress: string): Promise<LocationData | null> {
  try {
    // Skip localhost and private IPs
    if (isLocalIP(ipAddress)) {
      return {
        country: 'Local',
        city: 'Local Development',
        region: 'Local',
        latitude: 0,
        longitude: 0
      }
    }

    // Use ipapi.co for geolocation (free tier: 1000 requests/day)
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`)
    
    if (!response.ok) {
      console.warn('Failed to fetch location data for IP:', ipAddress)
      return null
    }

    const data = await response.json()
    
    return {
      country: data.country_name,
      city: data.city,
      region: data.region,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      isp: data.org
    }
  } catch (error) {
    console.error('Error fetching location data:', error)
    return null
  }
}

export function parseUserAgent(userAgent: string): DeviceInfo {
  try {
    // Simple user agent parsing (you might want to use a library like 'ua-parser-js' for better parsing)
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isTablet = /iPad|Android(?=.*Tablet)|Windows NT.*Touch/i.test(userAgent)
    
    let browser = 'Unknown'
    let os = 'Unknown'
    let device = 'Desktop'
    
    // Browser detection
    if (userAgent.includes('Chrome')) browser = 'Chrome'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari')) browser = 'Safari'
    else if (userAgent.includes('Edge')) browser = 'Edge'
    else if (userAgent.includes('Opera')) browser = 'Opera'
    
    // OS detection
    if (userAgent.includes('Windows')) os = 'Windows'
    else if (userAgent.includes('Mac')) os = 'macOS'
    else if (userAgent.includes('Linux')) os = 'Linux'
    else if (userAgent.includes('Android')) os = 'Android'
    else if (userAgent.includes('iOS')) os = 'iOS'
    
    // Device type
    if (isMobile) device = 'Mobile'
    else if (isTablet) device = 'Tablet'
    
    return {
      browser,
      os,
      device,
      platform: `${os} ${device}`
    }
  } catch (error) {
    console.error('Error parsing user agent:', error)
    return {
      browser: 'Unknown',
      os: 'Unknown',
      device: 'Unknown'
    }
  }
}

function isLocalIP(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === 'localhost' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.20.') ||
    ip.startsWith('172.21.') ||
    ip.startsWith('172.22.') ||
    ip.startsWith('172.23.') ||
    ip.startsWith('172.24.') ||
    ip.startsWith('172.25.') ||
    ip.startsWith('172.26.') ||
    ip.startsWith('172.27.') ||
    ip.startsWith('172.28.') ||
    ip.startsWith('172.29.') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.')
  )
}

export function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (forwarded) return forwarded.split(',')[0].trim()
  
  // Fallback to localhost
  return '127.0.0.1'
}
