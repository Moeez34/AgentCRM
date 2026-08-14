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
    // Check DB status on load
    getDashboardData().then((data) => {
      setDbLive(data.isDbLive);
      setNotifCount(data.notifications.filter(n => !n.isRead).length);
    });

    // Connect to WebSocket server running in our worker process
    const socketUrl = process.env.NEXT_PUBLIC_WORKER_SOCKET_URL || "http://localhost:3001";
    console.log(`[Socket Client] Connecting to: ${socketUrl}`);
    const socket = io(socketUrl, {
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    socket.on("connect", () => {
      setSocketStatus("connected");
      console.log("[Socket Client] Connected!");
      socket.emit("join-org", "org-acme-123");
    });

    socket.on("connect_error", () => {
      setSocketStatus("offline");
    });

    socket.on("lead-updated", () => {
      // Revalidate/refresh UI data
      router.refresh();
    });

    socket.on("notification", (data) => {
      setNotifCount(prev => prev + 1);
      // Optional: push to list
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
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Leads Pipeline", href: "/leads", icon: "👥" },
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-400">
        Loading workspace session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-neutral-900 border-r border-neutral-900 flex flex-col shrink-0">
        {/* Logo Header */}
        <div className="p-6 border-b border-neutral-850/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-base text-white shadow-md shadow-indigo-500/10">
            A
          </div>
          <span className="font-bold text-md tracking-tight bg-gradient-to-r from-neutral-50 to-neutral-200 bg-clip-text text-transparent">
            AgentCRM
          </span>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850/30 border border-transparent"
                }`}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer User Info */}
        <div className="p-4 border-t border-neutral-850/50 space-y-4">
          {/* Socket & DB Indicators */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-neutral-950/60 border border-neutral-850/40 text-[11px] text-neutral-400">
            <div className="flex items-center justify-between">
              <span>Database Status</span>
              {dbLive === null ? (
                <span className="text-neutral-500">Checking...</span>
              ) : dbLive ? (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Postgres Live
                </span>
              ) : (
                <span className="text-amber-500 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Offline Sandbox
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>WebSocket Stream</span>
              {socketStatus === "connected" ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                </span>
              ) : (
                <span className="text-neutral-500">Simulated</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-200 truncate">{session?.user?.name || "CRM Admin"}</p>
              <p className="text-xs text-neutral-500 truncate">{session?.user?.email || "admin@agentcrm.com"}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors text-xs font-semibold shrink-0 cursor-pointer"
              title="Sign Out"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 border-b border-neutral-900 bg-neutral-950 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-md font-semibold text-neutral-200">
              {pathname === "/dashboard" ? "Dashboard Overview" : pathname.startsWith("/leads") ? "Leads pipeline" : "Agentic CRM"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <div className="relative">
              <button 
                onClick={handleClearNotif}
                className="p-2 rounded-xl hover:bg-neutral-900 border border-neutral-900 hover:border-neutral-850 transition-all text-neutral-400 hover:text-neutral-200 relative cursor-pointer"
                title="Mark all notifications as read"
              >
                🔔
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-indigo-500 text-[10px] font-bold text-white flex items-center justify-center border border-neutral-950">
                    {notifCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic page wrapper */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
