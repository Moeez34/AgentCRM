"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getDashboardData, clearNotifications } from "@/app/actions";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [dbLive, setDbLive] = useState<boolean | null>(null);
  const [notifCount, setNotifCount] = useState(0);
  const [socketStatus, setSocketStatus] = useState("disconnected");

  useEffect(() => {
    getDashboardData().then((data) => {
      setDbLive(data.isDbLive);
      setNotifCount(data.notifications.filter(n => !n.isRead).length);
    });

    const socketUrl = process.env.NEXT_PUBLIC_WORKER_SOCKET_URL || "http://localhost:3001";
    const socket = io(socketUrl, {
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    socket.on("connect", () => {
      setSocketStatus("connected");
      socket.emit("join-org", "org-acme-123");
    });

    socket.on("connect_error", () => {
      setSocketStatus("offline");
    });

    socket.on("lead-updated", () => {
      router.refresh();
    });

    socket.on("notification", () => {
      setNotifCount(prev => prev + 1);
      router.refresh();
    });

    return () => {
      socket.disconnect();
    };
  }, [router]);

  const handleClearNotif = async () => {
    await clearNotifications();
    setNotifCount(0);
    router.refresh();
  };

  const navItems = [
    { name: "Dashboard Overview", href: "/dashboard", icon: "📊" },
    { name: "Leads Pipeline", href: "/leads", icon: "👥" },
    { name: "Agent Playground", href: "/agent-config", icon: "🤖" },
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#020203] flex items-center justify-center text-neutral-500 font-light text-sm tracking-wide">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Synchronizing security credentials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020203] text-neutral-200 flex flex-col md:flex-row p-3 md:p-4 gap-4">
      {/* Sidebar - Floating frosted plate */}
      <aside className="glass-plate-textured w-full md:w-64 flex flex-col shrink-0">
        <div className="glass-content flex-1 flex flex-col">
          {/* Logo Header */}
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-indigo-500/10">
              A
            </div>
            <span className="font-display font-extrabold text-md tracking-tight bg-gradient-to-r from-neutral-50 to-neutral-400 bg-clip-text text-transparent">
              AgentCRM
            </span>
          </div>

          {/* Sidebar Nav */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all ${
                    isActive
                      ? "bg-white/5 border border-white/10 text-white shadow-inner bevel-shine-input"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-white/2 border border-transparent"
                  }`}
                >
                  <span className="text-sm leading-none">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer User Info */}
          <div className="p-4 border-t border-white/5 space-y-4">
            {/* System Status Metrics */}
            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-black/40 border border-white/5 text-[10px] text-neutral-400 font-mono leading-relaxed">
              <div className="flex items-center justify-between">
                <span>DATABASE</span>
                {dbLive === null ? (
                  <span className="text-neutral-500">CHECKING...</span>
                ) : dbLive ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> POSTGRES
                  </span>
                ) : (
                  <span className="text-amber-500 flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> SANDBOX
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span>TELEMETRY</span>
                {socketStatus === "connected" ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> STREAMING
                  </span>
                ) : (
                  <span className="text-neutral-500">OFFLINE</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-neutral-200 truncate">{session?.user?.name || "CRM Admin"}</p>
                <p className="text-[10px] text-neutral-500 font-mono truncate mt-0.5">{session?.user?.email || "admin@agentcrm.com"}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="btn-glass p-2.5 rounded-xl text-neutral-400 hover:text-neutral-200 text-xs font-bold shrink-0 cursor-pointer"
                title="Sign Out"
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 gap-4">
        {/* Top Header - Floating glass plate */}
        <header className="glass-plate-textured h-16 px-6 flex items-center justify-between shrink-0">
          <div className="glass-content flex-1 flex items-center justify-between">
            <h2 className="font-display font-bold text-sm tracking-wide text-neutral-200">
              {pathname === "/dashboard" 
                ? "WORKSPACE METRICS" 
                : pathname.startsWith("/leads") 
                ? "SALES LEAD PIPELINE" 
                : "SAAS WORKSPACE"}
            </h2>

            <div className="flex items-center gap-3">
              {/* Notification bell */}
              <div className="relative">
                <button 
                  onClick={handleClearNotif}
                  className="btn-glass p-2.5 rounded-xl text-xs flex items-center justify-center relative cursor-pointer"
                  title="Clear Notifications"
                >
                  🔔
                  {notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-rose-500 to-indigo-500 text-[9px] font-bold text-white flex items-center justify-center border border-[#020203]">
                      {notifCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
