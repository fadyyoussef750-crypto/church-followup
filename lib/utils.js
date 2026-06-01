// بتحسب لو الديدلاين فات ولا لسه
export function isDeadlinePassed(deadline) {
  if (!deadline) return false
  return new Date() > new Date(deadline)
}

// بتفرمت الوقت بالعربي
export function formatDeadline(deadline) {
  if (!deadline) return null
  return new Date(deadline).toLocaleString('ar-EG', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

// بترجع لون وكلام الـ status
export function getStatusStyle(status) {
  switch (status) {
    case 'visited':
      return {
        label: 'افتقد',
        bg: 'bg-green-50 dark:bg-green-900/20',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800',
        dot: 'bg-green-500',
      }
    case 'no_answer':
      return {
        label: 'ما ردش',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
      }
    default:
      return {
        label: 'لم يُفتقد',
        bg: 'bg-gray-50 dark:bg-gray-800',
        text: 'text-gray-500 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-700',
        dot: 'bg-gray-300',
      }
  }
}
