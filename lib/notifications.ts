export type InAppNotification = {
  id: string
  title: string
  detail: string
  time: string
  createdAt: string
  read: boolean
}

type NewNotificationInput = {
  title: string
  detail: string
}

const STORAGE_KEY = "medisyn.notifications.v1"
const UPDATE_EVENT = "medisyn:notifications-updated"

const defaultNotifications: InAppNotification[] = [
  {
    id: "notif-data-refresh",
    title: "Data refreshed",
    detail: "Latest treatment discussions are available.",
    time: "12m ago",
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    read: false,
  },
]

function isBrowser() {
  return typeof window !== "undefined"
}

function relativeTime(iso: string) {
  const value = new Date(iso).getTime()
  if (!Number.isFinite(value)) {
    return "now"
  }

  const diffMs = Date.now() - value
  const seconds = Math.max(0, Math.floor(diffMs / 1000))

  if (seconds < 60) {
    return "now"
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function withFreshTime(items: InAppNotification[]) {
  return items.map((item) => ({
    ...item,
    time: relativeTime(item.createdAt),
  }))
}

function readStoredNotifications() {
  if (!isBrowser()) {
    return [] as InAppNotification[]
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return [] as InAppNotification[]
    }

    const parsed = JSON.parse(raw) as InAppNotification[]
    if (!Array.isArray(parsed)) {
      return [] as InAppNotification[]
    }

    return parsed.filter(
      (item) =>
        Boolean(item) &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.detail === "string" &&
        typeof item.createdAt === "string" &&
        typeof item.read === "boolean",
    )
  } catch {
    return [] as InAppNotification[]
  }
}

function persistNotifications(items: InAppNotification[]) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT))
}

export function loadInAppNotifications() {
  const stored = readStoredNotifications()

  if (stored.length === 0) {
    persistNotifications(defaultNotifications)
    return withFreshTime(defaultNotifications)
  }

  return withFreshTime(stored)
}

export function addInAppNotification(input: NewNotificationInput) {
  const existing = readStoredNotifications()
  const now = new Date().toISOString()
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  const next: InAppNotification[] = [
    {
      id,
      title: input.title.trim() || "New notification",
      detail: input.detail.trim() || "",
      createdAt: now,
      time: "now",
      read: false,
    },
    ...existing,
  ].slice(0, 40)

  persistNotifications(next)
  return withFreshTime(next)
}

export function markInAppNotificationRead(id: string) {
  const next = readStoredNotifications().map((item) =>
    item.id === id
      ? {
          ...item,
          read: true,
        }
      : item,
  )

  persistNotifications(next)
  return withFreshTime(next)
}

export function markAllInAppNotificationsRead() {
  const next = readStoredNotifications().map((item) => ({
    ...item,
    read: true,
  }))

  persistNotifications(next)
  return withFreshTime(next)
}

export function subscribeToInAppNotifications(onChange: (notifications: InAppNotification[]) => void) {
  if (!isBrowser()) {
    return () => undefined
  }

  const listener = () => {
    onChange(withFreshTime(readStoredNotifications()))
  }

  window.addEventListener(UPDATE_EVENT, listener)
  window.addEventListener("storage", listener)

  return () => {
    window.removeEventListener(UPDATE_EVENT, listener)
    window.removeEventListener("storage", listener)
  }
}
