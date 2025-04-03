"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bell,
  Car,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Shield,
  Smartphone,
  Tag,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Notification } from "@/lib/firebase";

interface NotificationDetailProps {
  notification: Notification | null;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function NotificationDetail({
  notification,
  onApprove,
  onReject,
  onDelete,
}: NotificationDetailProps) {
  if (!notification) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <Bell className="h-16 w-16 text-slate-200 dark:text-slate-700 mb-4" />
        <h3 className="text-xl font-medium mb-2">اختر إشعارًا للعرض</h3>
        <p className="text-muted-foreground max-w-md">
          يرجى اختيار إشعار من القائمة الجانبية لعرض التفاصيل الكاملة
        </p>
      </div>
    );
  }

  const getStatusBadge = (paymentStatus?: string) => {
    if (!paymentStatus || paymentStatus === "pending") {
      return (
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-amber-500" />
          <span className="text-amber-600 font-medium">قيد الانتظار</span>
        </div>
      );
    } else if (paymentStatus === "approved") {
      return (
        <div className="flex items-center gap-1.5">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span className="text-emerald-600 font-medium">مقبول</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1.5">
          <XCircle className="h-4 w-4 text-rose-500" />
          <span className="text-rose-600 font-medium">مرفوض</span>
        </div>
      );
    }
  };

  const getPageType = (pagename?: string) => {
    let badge;

    switch (pagename) {
      case "payment":
        badge = (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-0 shadow-sm"
          >
            <CreditCard className="h-3 w-3 mr-1" /> دفع
          </Badge>
        );
        break;
      case "home":
        badge = (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-violet-500 to-violet-600 text-white border-0 shadow-sm"
          >
            <FileText className="h-3 w-3 mr-1" /> تسجيل
          </Badge>
        );
        break;
      case "verify-otp":
        badge = (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-pink-500 to-pink-600 text-white border-0 shadow-sm"
          >
            <Shield className="h-3 w-3 mr-1" /> رمز OTP
          </Badge>
        );
        break;
      case "verify-phone":
        badge = (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-rose-500 to-rose-600 text-white border-0 shadow-sm"
          >
            <Smartphone className="h-3 w-3 mr-1" /> رمز هاتف
          </Badge>
        );
        break;
      case "external-link":
        badge = (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-sm"
          >
            <Tag className="h-3 w-3 mr-1" /> راجحي
          </Badge>
        );
        break;
      case "nafaz":
        badge = (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-teal-500 to-teal-600 text-white border-0 shadow-sm"
          >
            <Shield className="h-3 w-3 mr-1" /> نفاذ
          </Badge>
        );
        break;
      default:
        badge = (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 shadow-sm"
          >
            <Tag className="h-3 w-3 mr-1" /> {pagename || "الرئيسية"}
          </Badge>
        );
    }

    return badge;
  };

  return (
    <div className="h-full">
      <div className="p-4">
        <Card
          className={`border-slate-200 dark:border-slate-700 shadow-md ${
            notification.status === "approved"
              ? "border-t-4 border-t-emerald-500"
              : notification.status === "rejected"
              ? "border-t-4 border-t-rose-500"
              : "border-t-4 border-t-amber-500"
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <User className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {notification.documment_owner_full_name ||
                      notification.document_owner_full_name ||
                      "غير محدد"}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">
                      {notification.phone}
                    </span>
                    {getPageType(notification.pagename)}
                  </div>
                </div>
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">
                  {format(new Date(notification.createdDate), "yyyy/MM/dd")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(notification.createdDate), "HH:mm")}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-0">
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="details">التفاصيل</TabsTrigger>
                {notification.card_number && (
                  <TabsTrigger value="card">بيانات البطاقة</TabsTrigger>
                )}
                {notification.vehicle_type && (
                  <TabsTrigger value="vehicle">بيانات المركبة</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">الاسم الكامل</p>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    <p className="font-medium text-lg">
                      {notification.documment_owner_full_name ||
                        notification.document_owner_full_name ||
                        "غير محدد"}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">رقم الهوية</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    <p className="font-medium text-lg font-mono">
                      {notification.owner_identity_number ||
                        notification.full_name ||
                        "غير محدد"}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-medium text-lg font-mono">
                      {notification.phone}
                    </p>
                  </div>
                </div>

                {notification.phone2 && (
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 flex flex-col gap-1">
                    <p className="text-sm text-muted-foreground">
                      رقم الهاتف 2
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-medium text-lg font-mono">
                        {notification.phone2}
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">نوع الطلب</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-medium">
                      {notification.pagename ||
                        notification.insurance_purpose ||
                        "غير محدد"}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">الحالة</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(notification.status)}
                  </div>
                </div>
              </TabsContent>

              {notification.card_number && (
                <TabsContent value="card" className="space-y-4">
                  <div className="p-5 rounded-lg bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 text-white shadow-lg">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-300 mb-1">
                          حامل البطاقة
                        </span>
                        <span className="font-medium">
                          {notification.document_owner_full_name ||
                            notification.card_Holder_Name ||
                            "غير محدد"}
                        </span>
                      </div>
                      <CreditCard className="h-8 w-8 text-white opacity-80" />
                    </div>

                    <div className="mb-4">
                      <span className="text-xs text-slate-300 mb-1 block">
                        رقم البطاقة
                      </span>
                      <span
                        className="font-mono text-lg tracking-wider"
                        dir="ltr"
                      >
                        {notification.card_number}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <div>
                        <span className="text-xs text-slate-300 block">
                          تاريخ الانتهاء
                        </span>
                        <span className="font-mono">
                          {notification.expiration_date || "غير محدد"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-300 block">
                          رمز الأمان
                        </span>
                        <span className="font-mono">
                          {notification.cvv || "غير محدد"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {notification.pinCode && (
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 flex flex-col gap-1">
                      <p className="text-sm text-muted-foreground">
                        الرقم السري
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-medium text-lg font-mono">
                          {notification.pinCode}
                        </p>
                      </div>
                    </div>
                  )}

                  {notification.otpCode && (
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 flex flex-col gap-1">
                      <p className="text-sm text-muted-foreground">
                        رمز التحقق
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-medium text-lg font-mono">
                          {notification.otpCode}
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              )}

              {notification.vehicle_type && (
                <TabsContent value="vehicle" className="space-y-4">
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 flex flex-col gap-1">
                    <p className="text-sm text-muted-foreground">نوع المركبة</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Car className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      <p className="font-medium text-lg">
                        {notification.vehicle_type}
                      </p>
                    </div>
                  </div>

                  {notification.vehicle_manufacture_number && (
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 flex flex-col gap-1">
                      <p className="text-sm text-muted-foreground">
                        رقم تصنيع المركبة
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-medium text-lg font-mono">
                          {notification.vehicle_manufacture_number}
                        </p>
                      </div>
                    </div>
                  )}

                  {notification.customs_code && (
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 flex flex-col gap-1">
                      <p className="text-sm text-muted-foreground">
                        رمز الجمارك
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-medium text-lg font-mono">
                          {notification.customs_code}
                        </p>
                      </div>
                    </div>
                  )}

                  {notification.seller_identity_number && (
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 flex flex-col gap-1">
                      <p className="text-sm text-muted-foreground">
                        رقم هوية البائع
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Shield className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        <p className="font-medium text-lg font-mono">
                          {notification.seller_identity_number}
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </CardContent>

          <CardFooter className="flex gap-2 mt-6 pt-4 border-t">
            <Button
              onClick={() => onApprove(notification.id)}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-md"
              disabled={notification.status === "approved"}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              قبول
            </Button>
            <Button
              onClick={() => onReject(notification.id)}
              className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white border-0 shadow-md"
              disabled={notification.status === "rejected"}
            >
              <XCircle className="h-4 w-4 mr-2" />
              رفض
            </Button>
            <Button
              onClick={() => onDelete(notification.id)}
              variant="outline"
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              حذف
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
