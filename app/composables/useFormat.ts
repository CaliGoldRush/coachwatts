export const useFormat = () => {
  const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions) => {
    return new Date(date).toLocaleDateString('en-US', options || {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatShortDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const formatRelativeTime = (date: string | Date) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return formatShortDate(d)
  }

  return {
    formatDate,
    formatShortDate,
    formatDateTime,
    formatRelativeTime
  }
}
