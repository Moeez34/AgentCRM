"use client";

import { useEffect, useState } from "react";
import { getDashboardData, approveOutreach, mockStripeCheckout } from "@/app/actions";
import Link from "next/link";

export default function DashboardPage() {
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
      <div className="h-[60vh] flex flex-col items-center justify-center text-neutral-500 font-light text-sm tracking-wide">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span>Loading metrics telemetry...</span>
      </div>
    );
  }

  const { stats, org, notifications, audits, pendingApprovals, isDbLive } = data;

  return (
    <div className="space-y-6 pb-6">
      {/* DB Live Reminder Banner */}
      {!isDbLive && (
        <div className="glass-plate-textured p-4 border border-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.05)]">
          <div className="glass-content flex items-center gap-3 text-amber-400 text-xs">
            <span className="text-sm">⚠️</span>
            <p className="leading-relaxed font-light">
              <strong>Offline Sandbox:</strong> Postgres connection is unavailable. Operating under in-memory simulated fallback mode. <strong>Perfect for immediate zero-setup evaluation!</strong>
            </p>
          </div>
        </div>
      )}

      {/* Metrics Header Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="glass-plate-textured p-6 hover:scale-[1.01] transition-transform duration-300">
          <div className="glass-content">
            <div className="flex items-center justify-between text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">
              <span>Total Pipeline Leads</span>
              <span className="text-xs">📂</span>
            </div>
            <p className="font-display text-4xl font-extrabold text-white tracking-tight tabular-nums">
              {stats.totalLeads}
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-plate-textured p-6 hover:scale-[1.01] transition-transform duration-300">
          <div className="glass-content">
            <div className="flex items-center justify-between text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">
              <span>Auto-Researched</span>
              <span className="text-xs">🔍</span>
            </div>
            <p className="font-display text-4xl font-extrabold text-white tracking-tight tabular-nums">
              {stats.researchedLeads}
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-plate-textured p-6 hover:scale-[1.01] transition-transform duration-300">
          <div className="glass-content">
            <div className="flex items-center justify-between text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">
              <span>Average AI Score</span>
              <span className="text-xs">🎯</span>
            </div>
            <p className="font-display text-4xl font-extrabold text-white tracking-tight tabular-nums">
              {stats.scoredAverage > 0 ? `${stats.scoredAverage}` : "N/A"}<span className="text-xs text-neutral-500 font-light">/100</span>
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-plate-textured p-6 hover:scale-[1.01] transition-transform duration-300">
          <div className="glass-content">
            <div className="flex items-center justify-between text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">
              <span>Reply Actions</span>
              <span className="text-xs">✉️</span>
            </div>
            <p className="font-display text-4xl font-extrabold text-white tracking-tight tabular-nums">
              {stats.repliedLeads}
            </p>
          </div>
        </div>
      </div>

      {/* Core Workflow approvals and Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Approvals Column (Left 2/3) */}
        <div className="lg:col-span-2">
          <div className="glass-plate-textured p-6 min-h-[450px] flex flex-col">
            <div className="glass-content flex-1 flex flex-col">
              <h3 className="font-display text-sm font-bold text-neutral-200 tracking-wide uppercase mb-5 flex items-center gap-2">
                <span>✍️</span> Human Approval Sequence Queue
              </h3>
              
              {pendingApprovals.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 border border-dashed border-white/5 rounded-2xl px-6 text-center">
                  <span className="text-2xl mb-2">☕</span>
                  <p className="font-bold text-xs text-neutral-300">Queue is completely clear</p>
                  <p className="text-[11px] text-neutral-500 max-w-xs mt-1 leading-relaxed">
                    AI copywriters are currently resting. Import new sales leads in the Pipeline tab to trigger auto-outreach.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((item: any) => (
                    <div 
                      key={item.id} 
                      className="p-5 rounded-2xl bg-black/40 border border-white/5 shadow-inner bevel-shine-input flex flex-col gap-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Suggested Outreach</span>
                          <h4 className="font-bold text-xs text-neutral-300 mt-0.5">Lead {item.leadId.substring(0, 8)}</h4>
                        </div>
                        <div className="px-2.5 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold tracking-widest uppercase">
                          AI DRAFT
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-black/50 border border-white/2 text-[11px] font-mono text-neutral-400 space-y-2 leading-relaxed bevel-shine-input">
                        <p><strong className="text-neutral-300">Subject:</strong> {item.subject}</p>
                        <p className="whitespace-pre-line text-neutral-455 border-t border-white/5 pt-2.5">{item.body}</p>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-1">
                        <Link 
                          href={`/leads/${item.leadId}`}
                          className="btn-glass px-4 py-2 rounded-xl text-[11px] font-bold text-neutral-400 hover:text-white transition-colors"
                        >
                          Inspect Profile
                        </Link>
                        <button
                          onClick={() => handleApprove(item.id)}
                          disabled={actionLoadingId === item.id}
                          className="px-4 py-2.5 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                        >
                          {actionLoadingId === item.id ? "Delivering..." : "Approve & Deliver"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notifications and Audits Column (Right 1/3) */}
        <div className="space-y-6">
          
          {/* Notifications Log */}
          <div className="glass-plate-textured p-6 max-h-[350px] overflow-y-auto">
            <div className="glass-content">
              <h3 className="font-display text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">
                🔔 System Notifications
              </h3>
              {notifications.length === 0 ? (
                <p className="text-xs text-neutral-500 italic font-light font-sans">No messages generated yet.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((item: any) => (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded-xl border text-[11px] flex gap-2.5 leading-relaxed ${
                        item.type === 'SUCCESS' 
                          ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-450' 
                          : item.type === 'WARNING'
                          ? 'bg-amber-500/5 border-amber-500/10 text-amber-450'
                          : 'bg-black/30 border-white/5 text-neutral-400'
                      }`}
                    >
                      <span className="shrink-0">{item.type === 'SUCCESS' ? '✅' : item.type === 'WARNING' ? '⚠️' : 'ℹ️'}</span>
                      <p>{item.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Audit Logs */}
          <div className="glass-plate-textured p-6 max-h-[350px] overflow-y-auto">
            <div className="glass-content">
              <h3 className="font-display text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">
                📝 Audit Trails
              </h3>
              {audits.length === 0 ? (
                <p className="text-xs text-neutral-500 italic font-light font-sans">No audit records yet.</p>
              ) : (
                <div className="space-y-3 font-mono text-[10px] leading-relaxed">
                  {audits.map((item: any) => (
                    <div key={item.id} className="border-b border-white/5 pb-2 last:border-b-0 text-neutral-400">
                      <span className="text-neutral-500 text-[9px] block mb-0.5 font-sans">
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

      </div>

      {/* Stripe Payment Integration Section - Apple Card aesthetic */}
      <div className="glass-plate-textured p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(99,102,241,0.04)]">
        <div className="glass-content space-y-1 text-center md:text-left">
          <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono tracking-widest text-indigo-400 uppercase font-bold">
            STRIPE BILLING
          </span>
          <h3 className="text-sm font-bold text-neutral-200 mt-2">
            Workspace Limits & Subscription Plan
          </h3>
          <p className="text-[11px] text-neutral-400 max-w-xl font-light leading-relaxed">
            Acme Organization is configured on the <strong className="text-white font-semibold">{org?.plan || "FREE"} Tier</strong>. Stripe Customer ID: <code className="text-indigo-300 font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5 text-[9px]">{org?.stripeCustomerId || "cus_mock_123"}</code>.
          </p>
        </div>
        <div className="glass-content">
          <button
            onClick={handleUpgrade}
            className="btn-glass px-5 py-3 rounded-xl text-xs font-bold text-neutral-200 hover:text-white cursor-pointer"
          >
            💳 Toggle Subscription ({org?.plan === "PRO" ? "Downgrade to Free" : "Upgrade to PRO"})
          </button>
        </div>
      </div>
    </div>
  );
}
