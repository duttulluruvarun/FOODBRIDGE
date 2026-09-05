"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, HeartHandshake, FileText, Link2,
  Users, Store, Bell, BarChart2, FileBarChart, Settings, Leaf, LogOut, Heart
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUnreadNotificationCount } from "@/app/actions/dashboard";
import { getCurrentUser } from "@/app/actions/auth";
import { toast } from "sonner";
import { useAppStore, type UserRole } from "@/store/useAppStore";

const adminNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Donations", href: "/dashboard/donations", icon: HeartHandshake },
  { name: "Requests", href: "/dashboard/requests", icon: FileText },
  { name: "Matches", href: "/dashboard/matches", icon: Link2 },
  { name: "Recipients", href: "/dashboard/recipients", icon: Users },
  { name: "Donors", href: "/dashboard/donors", icon: Store },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
  { name: "Reports", href: "/dashboard/reports", icon: FileBarChart },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const donorNavItems = [
  { name: "My Impact", href: "/dashboard", icon: Heart },
  { name: "My Donations", href: "/dashboard/donations", icon: HeartHandshake },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const ngoNavItems = [
  { name: "Food Network", href: "/dashboard", icon: Users },
  { name: "My Requests", href: "/dashboard/requests", icon: FileText },
  { name: "Available Food", href: "/dashboard/donations", icon: HeartHandshake },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

function navItemsForRole(role: UserRole) {
  if (role === "donor") return donorNavItems;
  if (role === "ngo") return ngoNavItems;
  return adminNavItems;
}

function roleLabel(role: UserRole) {
  if (role === "guest") return "Admin";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const avatar = useAppStore((s) => s.avatar);
  const notificationCount = useAppStore((s) => s.notificationCount);
  const setNotificationCount = useAppStore((s) => s.setNotificationCount);
  const role = useAppStore((s) => s.role);
  const setRole = useAppStore((s) => s.setRole);
  const name = useAppStore((s) => s.name);
  const setName = useAppStore((s) => s.setName);
  const navItems = navItemsForRole(role);
  const initials = name.split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "NK";
  const lastSeenDate = useRef<number>(0);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    async function fetchUser() {
      const user = await getCurrentUser();
      if (user) {
        setRole((user.role as UserRole) || "admin");
        setName(user.name);
      }
    }
    fetchUser();
  }, [setRole, setName]);

  useEffect(() => {
    if (lastSeenDate.current === 0) {
      lastSeenDate.current = Date.now();
    }
    async function fetchNotifications() {
      const res = await getUnreadNotificationCount();
      if (res.success && res.count !== undefined) {
        setNotificationCount(res.count);

        if (res.latest && res.latest.length > 0) {
          const newestNotification = res.latest[0];
          const newestTime = new Date(newestNotification.createdAt).getTime();

          if (!isFirstLoad.current && newestTime > lastSeenDate.current) {
            // New notification arrived! Show toast
            toast.info("New Notification", {
              description: newestNotification.message,
            });
          }

          if (isFirstLoad.current || newestTime > lastSeenDate.current) {
            lastSeenDate.current = newestTime;
            isFirstLoad.current = false;
          }
        }
      }
    }

    // Initial fetch
    fetchNotifications();

    // Poll every 15 seconds to keep it real-time
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden print:h-auto print:overflow-visible">
      {/* Sidebar */}
      <aside className="w-64 bg-[#05321B] text-white flex flex-col shadow-2xl z-20 print:hidden">
        <Link href="/dashboard" className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
          <div className="bg-white/20 p-2 rounded-lg">
            <Leaf size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">FoodBridge</span>
        </Link>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                        ? "bg-white/10 text-white font-medium"
                        : "text-emerald-100/70 hover:bg-white/5 hover:text-white"
                      }`}
                  >
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    <span>{item.name}</span>

                    {item.name === "Notifications" && notificationCount > 0 ? (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                        {notificationCount > 99 ? '99+' : notificationCount}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-emerald-800">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition outline-none">
                <Avatar>
                  <AvatarImage src={avatar} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-emerald-300">{roleLabel(role)}</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2 rounded-xl" align="start">
              <DropdownMenuGroup>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/dashboard/settings">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <Link href="/auth">
                <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 print:h-auto print:overflow-visible">
        <div className="flex-1 overflow-y-auto p-8 print:overflow-visible print:p-0">
          {children}
        </div>
      </main>
    </div>
  );
}
