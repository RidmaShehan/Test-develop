import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parse JSON from a Response object.
 * Handles cases where the server returns HTML error pages instead of JSON.
 */
export async function safeJsonParse<T = any>(response: Response): Promise<T> {
  // Clone the response so we can read it multiple times if needed
  const contentType = response.headers.get('content-type') || ''
  const text = await response.text()
  
  // Check if response is actually JSON
  if (!contentType.includes('application/json')) {
    // If it's HTML, it's likely an error page
    if (contentType.includes('text/html') || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<!doctype')) {
      // Try to extract error message from HTML if possible
      const errorMatch = text.match(/<title>(.*?)<\/title>/i) || text.match(/<h1>(.*?)<\/h1>/i)
      const errorMessage = errorMatch ? errorMatch[1] : `Server returned HTML instead of JSON (Status: ${response.status})`
      
      throw new Error(errorMessage)
    }
    
    // For other content types, throw a descriptive error
    throw new Error(`Expected JSON but received ${contentType} (Status: ${response.status})`)
  }
  
  // Try to parse as JSON
  try {
    if (!text.trim()) {
      return {} as T
    }
    return JSON.parse(text) as T
  } catch (error) {
    // If JSON parsing fails, it might be HTML or other content
    // Check if it starts with HTML tags
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<!doctype') || text.trim().startsWith('<html')) {
      const errorMatch = text.match(/<title>(.*?)<\/title>/i) || text.match(/<h1>(.*?)<\/h1>/i)
      const errorMessage = errorMatch ? errorMatch[1] : `Server returned HTML instead of JSON (Status: ${response.status})`
      throw new Error(errorMessage)
    }
    
    throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}