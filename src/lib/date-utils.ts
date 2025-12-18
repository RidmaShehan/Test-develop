export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date'
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date'
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDateRange(startDate: string | Date, endDate?: string | Date): string {
  const start = formatDate(startDate)
  
  if (!endDate) {
    return start
  }
  
  const end = formatDate(endDate)
  return `${start} - ${end}`
}

export function isDateInRange(date: string | Date, startDate: string | Date, endDate?: string | Date): boolean {
  const checkDate = typeof date === 'string' ? new Date(date) : date
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = endDate ? (typeof endDate === 'string' ? new Date(endDate) : endDate) : null
  
  if (isNaN(checkDate.getTime()) || isNaN(start.getTime()) || (end && isNaN(end.getTime()))) {
    return false
  }
  
  if (end) {
    return checkDate >= start && checkDate <= end
  }
  
  return checkDate >= start
}
