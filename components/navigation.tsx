"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { medisynSearchSuggestionId, medisynSearchSuggestions } from "@/lib/search-suggestions"
import {
  loadInAppNotifications,
  markAllInAppNotificationsRead,
  markInAppNotificationRead,
  subscribeToInAppNotifications,
  type InAppNotification,
} from "@/lib/notifications"
import { Activity, LayoutDashboard, Users, Sparkles, Search, Bell, Menu, User, Settings, LogOut, HelpCircle, CreditCard, FileSearch, Handshake } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ProfileSettings } from "@/lib/profile/types"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/treatment-insights", label: "Treatment Insights", icon: Activity },
  { href: "/patient-experiences", label: "Patient Experiences", icon: Users },
  { href: "/connect", label: "Medisyn Connect", icon: Handshake },
  { href: "/report-insights", label: "Report Insights", icon: FileSearch },
  { href: "/ai-insights", label: "AI Insights", icon: Sparkles },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [desktopQuery, setDesktopQuery] = useState("")
  const [mobileQuery, setMobileQuery] = useState("")
  const [navProfile, setNavProfile] = useState<ProfileSettings["profile"] | null>(null)
  const [navSubscriptionPlan, setNavSubscriptionPlan] = useState<ProfileSettings["subscription"]["plan"]>("pro")

  useEffect(() => {
    let isMounted = true

    async function loadNavProfile() {
      try {
        const response = await fetch("/api/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        })

        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as { profile?: ProfileSettings }
        if (!payload.profile || !isMounted) {
          return
        }

        setNavProfile(payload.profile.profile)
        setNavSubscriptionPlan(payload.profile.subscription.plan)
      } catch {
        // Keep navigation fallbacks when profile API is unavailable.
      }
    }

    void loadNavProfile()

    return () => {
      isMounted = false
    }
  }, [pathname])

  const navName = useMemo(() => {
    if (!navProfile) {
      return "Dr. Sarah Chen"
    }

    const fullName = `${navProfile.firstName} ${navProfile.lastName}`.trim()
    return fullName || "Unnamed User"
  }, [navProfile])

  const navEmail = navProfile?.email || "sarah.chen@medisyn.ai"
  const navAvatarSeed = navProfile?.avatarSeed || "medisyn"
  const navInitials = `${navProfile?.firstName?.[0] ?? "S"}${navProfile?.lastName?.[0] ?? "C"}`
  const navPlanLabel = `${navSubscriptionPlan.toUpperCase()} Plan`
  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const unreadNotificationCount = notifications.filter((item) => !item.read).length

  useEffect(() => {
    setNotifications(loadInAppNotifications())

    const unsubscribe = subscribeToInAppNotifications((next) => {
      setNotifications(next)
    })

    return unsubscribe
  }, [])

  function markAllNotificationsRead() {
    setNotifications(markAllInAppNotificationsRead())
  }

  function markNotificationRead(id: string) {
    setNotifications(markInAppNotificationRead(id))
  }

  function submitSearch(query: string) {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      return
    }

    router.push(`/ai-insights?q=${encodeURIComponent(trimmedQuery)}`)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/95 backdrop-blur-md supports-backdrop-filter:bg-card/80">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-11 w-11 rounded-full bg-card shadow-sm overflow-hidden transition-all duration-300 group-hover:shadow-md group-hover:scale-105">
              <Image
                src="/1280x1280-2-1763628781.png"
                alt="Medisyn logo"
                fill
                sizes="36px"
                className="object-contain p-1"
                priority
              />
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">
              <span className="text-emerald-500">Med</span>
              <span className="text-sky-800">isyn</span>
            </span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const isConnect = item.href === "/connect"
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                    isConnect && !isActive && "border border-primary/30 bg-primary/5 text-primary/90 hover:bg-primary/10",
                    isConnect && isActive && "border border-primary/40 bg-primary/20 text-primary shadow-md"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <form
            className="relative hidden md:block"
            onSubmit={(event) => {
              event.preventDefault()
              submitSearch(desktopQuery)
            }}
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              list={medisynSearchSuggestionId}
              placeholder="Search treatments..."
              value={desktopQuery}
              onChange={(event) => setDesktopQuery(event.target.value)}
              className="w-56 lg:w-64 pl-9 pr-10 bg-muted/40 border-0 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/40 transition-all duration-200 focus-visible:w-72"
            />
            <Button type="submit" size="icon" variant="ghost" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg">
              <Sparkles className="h-4 w-4" />
            </Button>
          </form>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative group transition-colors duration-200">
                <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                {unreadNotificationCount > 0 ? (
                  <>
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-warm animate-pulse" />
                    <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] font-semibold text-primary-foreground">
                      {unreadNotificationCount}
                    </span>
                  </>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-2" align="end" sideOffset={8}>
              <DropdownMenuLabel className="flex items-center justify-between px-2 py-2">
                <span>Notifications</span>
                {unreadNotificationCount > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(event) => {
                      event.preventDefault()
                      markAllNotificationsRead()
                    }}
                  >
                    Mark all read
                  </Button>
                ) : null}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="-mx-2" />
              <div className="max-h-80 overflow-y-auto py-1">
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="cursor-pointer items-start gap-3 rounded-lg px-3 py-3"
                    onSelect={() => markNotificationRead(notification.id)}
                  >
                    <span
                      className={cn(
                        "mt-1 h-2 w-2 rounded-full",
                        notification.read ? "bg-muted-foreground/40" : "bg-primary",
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{notification.title}</span>
                      <span className="text-xs text-muted-foreground">{notification.detail}</span>
                      <span className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{notification.time}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
                {notifications.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications</p>
                ) : null}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all duration-200">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(navAvatarSeed)}`} alt={navName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">{navInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-2" align="end" sideOffset={8}>
              <DropdownMenuLabel className="font-normal p-3 -mx-2 -mt-2 mb-1 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 ring-2 ring-primary/20">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(navAvatarSeed)}`} alt={navName} />
                    <AvatarFallback className="bg-primary/10 text-primary">{navInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold text-foreground">{navName}</p>
                    <p className="text-xs text-muted-foreground">{navEmail}</p>
                    <span className="text-[10px] mt-1 px-1.5 py-0.5 rounded-full bg-warm/20 text-warm w-fit font-medium">{navPlanLabel}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="-mx-2" />
              <DropdownMenuGroup>
                <DropdownMenuItem className="gap-3 py-2.5 cursor-pointer rounded-lg" asChild>
                  <Link href="/profile">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm">Profile</span>
                      <span className="text-xs text-muted-foreground">Manage your account</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 py-2.5 cursor-pointer rounded-lg">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm">Billing</span>
                    <span className="text-xs text-muted-foreground">Manage subscription</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 py-2.5 cursor-pointer rounded-lg">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm">Settings</span>
                    <span className="text-xs text-muted-foreground">Preferences & privacy</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 py-2.5 cursor-pointer rounded-lg">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm">Help & Support</span>
                    <span className="text-xs text-muted-foreground">Get assistance</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="-mx-2" />
              <DropdownMenuItem className="gap-3 py-2.5 cursor-pointer rounded-lg text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="ml-1">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <div className="flex flex-col h-full">
                {/* Profile Section in Mobile */}
                <div className="p-5 border-b border-border/40 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(navAvatarSeed)}`} alt={navName} />
                      <AvatarFallback className="bg-primary/10 text-primary">{navInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold text-foreground">{navName}</p>
                      <p className="text-xs text-muted-foreground">{navEmail}</p>
                      <span className="text-[10px] mt-1 px-1.5 py-0.5 rounded-full bg-warm/20 text-warm w-fit font-medium">{navPlanLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-auto">
                  <form
                    className="relative mb-4"
                    onSubmit={(event) => {
                      event.preventDefault()
                      submitSearch(mobileQuery)
                    }}
                  >
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      list={medisynSearchSuggestionId}
                      placeholder="Search..."
                      value={mobileQuery}
                      onChange={(event) => setMobileQuery(event.target.value)}
                      className="w-full pl-9 pr-10 rounded-xl"
                    />
                    <Button type="submit" size="icon" variant="ghost" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg">
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </form>
                  <nav className="flex flex-col gap-1">
                    {navItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      const isConnect = item.href === "/connect"
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                            isActive
                              ? "bg-primary/10 text-primary shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                            isConnect && !isActive && "border border-primary/30 bg-primary/5 text-primary/90 hover:bg-primary/10",
                            isConnect && isActive && "border border-primary/40 bg-primary/20 text-primary shadow-md"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </Link>
                      )
                    })}
                  </nav>

                  <div className="mt-6 pt-6 border-t border-border/40">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-4">Account</p>
                    <nav className="flex flex-col gap-1">
                      <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200">
                        <User className="h-5 w-5" />
                        Profile
                      </Link>
                      <Link href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200">
                        <Settings className="h-5 w-5" />
                        Settings
                      </Link>
                    </nav>
                  </div>
                </div>

                <div className="p-4 border-t border-border/40">
                  <Button variant="outline" className="w-full gap-2 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10">
                    <LogOut className="h-4 w-4" />
                    Log out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <datalist id={medisynSearchSuggestionId}>
        {medisynSearchSuggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
    </header>
  )
}
