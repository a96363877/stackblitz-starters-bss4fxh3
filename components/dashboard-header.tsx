"use client"

import { Search, LogOut, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DashboardHeaderProps {
  searchTerm: string
  onSearch: (term: string) => void
  activeFilter: string | null
  onFilter: (filter: string | null) => void
  notificationsCount: number
}

export default function DashboardHeader({
  searchTerm,
  onSearch,
  activeFilter,
  onFilter,
  notificationsCount,
}: DashboardHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("حدث خطأ أثناء تسجيل الخروج")
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">
          لوحة البيانات
        </h1>
        <span className="ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-sm">{notificationsCount}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عام..."
            className="pr-10 w-full"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onFilter(activeFilter === "pending" ? null : "pending")}
                  className={activeFilter === "pending" ? "bg-yellow-100 border-yellow-300 text-yellow-700" : ""}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>تصفية حسب الحالة</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>تسجيل الخروج</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}

