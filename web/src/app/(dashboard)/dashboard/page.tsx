"use client";

import { useEffect, useState } from "react";
import { getDashboardData, approveOutreach, mockStripeCheckout } from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const dbData = await getDashboardData();
      setData(dbData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Refresh every 5s for demo updates if WebSocket fails
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (msgId: string) => {
    setActionLoadingId(msgId);
    try {
      await approveOutreach(msgId);
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await mockStripeCheckout();
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-neutral-400">
        Loading metrics telemetry...
      </div>
    );
  }

  const { stats, org, notifications, audits, pendingApprovals, isDbLive } = data;

  return (
    <div className="space-y-8">
      {/* DB Live Reminder Banner */}
      {!isDbLive && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-3 shadow-md shadow-amber-500/5">
          <span>⚠️</span>
          <p className="leading-relaxed">
            <strong>Running in Offline Sandbox Mode:</strong> Next.js could not connect to PostgreSQL. Lead pipelines, AI research scoring, and outreach copy generators will run using local in-memory mock simulations. <strong>No setup required!</strong>
          </p>
        </div>
      )}

      {/* Metrics Header Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-900 shadow-md">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Leads</span>
            <span>📂</span>
          </div>
          <p className="text-3xl font-extrabold text-neutral-100">{stats.totalLeads}</p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-900 shadow-md">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Scraped & Researched</span>
            <span>🔍</span>
          </div>
          <p className="text-3xl font-extrabold text-neutral-100">{stats.researchedLeads}</p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-900 shadow-md">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Average AI Score</span>
            <span>🎯</span>
          </div>
          <p className="text-3xl font-extrabold text-neutral-100">
            {stats.scoredAverage > 0 ? `${stats.scoredAverage}/100` : "N/A"}
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-900 shadow-md">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Reply Action Triggers</span>
            <span>✉️</span>
          </div>
          <p className="text-3xl font-extrabold text-neutral-100">{stats.repliedLeads}</p>
        </div>
      </div>

      {/* Core Workflow approvals and Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Approvals Column (Left 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-900 min-h-[400px]">
            <h2 className="text-lg font-bold text-neutral-200 mb-4 flex items-center gap-2">
              <span>✍️</span> Human Approval Queue
            </h2>
            
            {pendingApprovals.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-neutral-500 border border-dashed border-neutral-850 rounded-xl px-4 text-center">
                <span className="text-3xl mb-2">☕</span>
                <p className="font-semibold text-sm">Inbox is completely clear</p>
                <p className="text-xs text-neutral-600 max-w-xs mt-1">
                  AI outreach copy generators are idle. Import or add new leads to kickstart the auto-research cycle!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map((item: any) => (
                  <div 
                    key={item.id} 
                    className="p-5 rounded-xl bg-neutral-950/60 border border-neutral-850 hover:border-neutral-800 transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-neutral-500">Suggested outreach for:</span>
                        <h4 className="font-bold text-sm text-neutral-200 mt-0.5">Lead {item.leadId.substring(0, 8)}...</h4>
                      </div>
                      <div className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-semibold uppercase">
                        AI Draft
                      </div>
                    </div>
                    
                    <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-900/50 text-xs font-mono text-neutral-400 space-y-2">
                      <p><strong>Subject:</strong> {item.subject}</p>
                      <p className="whitespace-pre-line text-neutral-400/80 leading-relaxed border-t border-neutral-900 pt-2">{item.body}</p>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-1 border-t border-neutral-900/50">
                      <Link 
                        href={`/leads/${item.leadId}`}
                        className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-neutral-200 transition-colors"
                      >
                        Inspect Lead Detail
                      </Link>
                      <button
                        onClick={() => handleApprove(item.id)}
                        disabled={actionLoadingId === item.id}
                        className="px-4 py-2 text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors cursor-pointer"
                      >
                        {actionLoadingId === item.id ? "Delivering..." : "Approve & Deliver Email"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notifications and Audits Column (Right 1/3) */}
        <div className="space-y-6">
          {/* Notifications logs */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-900 max-h-[350px] overflow-y-auto">
            <h2 className="text-sm font-bold text-neutral-300 uppercase tracking-wider mb-4">
              🔔 Notifications Log
            </h2>
            {notifications.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">No notifications generated yet.</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((item: any) => (
                  <div 
                    key={item.id} 
                    className={`p-3 rounded-xl border text-xs flex gap-2 ${
                      item.type === 'SUCCESS' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : item.type === 'WARNING'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : 'bg-neutral-950/60 border-neutral-850 text-neutral-400'
                    }`}
                  >
                    <span>{item.type === 'SUCCESS' ? '✅' : item.type === 'WARNING' ? '⚠️' : 'ℹ️'}</span>
                    <p className="leading-relaxed">{item.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Logs */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-900 max-h-[350px] overflow-y-auto">
            <h2 className="text-sm font-bold text-neutral-300 uppercase tracking-wider mb-4">
              📝 CRM Activity Logs
            </h2>
            {audits.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">No audit trail generated yet.</p>
            ) : (
              <div className="space-y-3 font-mono text-[11px]">
                {audits.map((item: any) => (
                  <div key={item.id} className="border-b border-neutral-850 pb-2 last:border-b-0 text-neutral-400">
                    <span className="text-neutral-500 text-[10px] block mb-0.5">
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </span>
                    <p className="break-all">{item.action}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Stripe Payment Integration Section */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-neutral-900 to-indigo-950/20 border border-neutral-900 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-indigo-500/5">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-base font-bold text-neutral-200">
            Billing Management & Organization Stack
          </h3>
          <p className="text-xs text-neutral-400 max-w-xl">
            Currently subscribed to the <strong className="text-indigo-400 font-semibold">{org?.plan || "FREE"} Plan</strong>. Stripe Customer: <code className="text-neutral-300 bg-neutral-950 px-1.5 py-0.5 rounded text-[10px]">{org?.stripeCustomerId || "cus_mock_123"}</code>.
          </p>
        </div>
        <button
          onClick={handleUpgrade}
          className="px-5 py-3 bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
        >
          💳 Toggle Stripe plan ({org?.plan === "PRO" ? "Downgrade to Free" : "Upgrade to PRO"})
        </button>
      </div>
    </div>
  );
}
