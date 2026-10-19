// en-GB gives "19 Oct 2026, 14:32"
const dateTime = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const timeOnly = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDateTime(iso) {
  return dateTime.format(new Date(iso))
}

export function formatTime(iso) {
  return timeOnly.format(new Date(iso))
}
