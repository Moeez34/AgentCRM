"use client";

import { useEffect, useState } from "react";
import { getLeadDetail, approveOutreach, simulateInboundReply } from "@/app/actions";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Simulation form states
  const [replyBody, setReplyBody] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [simulating, setSimulating] = useState(false);

  const fetchLeadDetail = async () => {
    try {
      const detail = await getLeadDetail(leadId);
      setData(detail);
      if (detail?.outreach) {
        setReplySubject(`Re: ${detail.outreach.subject}`);
      } else {
        setReplySubject("Quick question regarding collaboration");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetail();
    const interval = setInterval(fetchLeadDetail, 3000);
    return () => clearInterval(interval);
  }, [leadId]);

  const handleApprove = async () => {
    if (!data?.outreach) return;
    setActionLoading(true);
    try {
      await approveOutreach(data.outreach.id);
      await fetchLeadDetail();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody) return;
    setSimulating(true);
    try {
      await simulateInboundReply(leadId, replySubject, replyBody);
      setReplyBody("");
      await new Promise(resolve => setTimeout(resolve, 2000));
      await fetchLeadDetail();
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-neutral-550 font-light text-sm tracking-wide">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span>Loading lead profile details...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-neutral-500 text-xs font-light">
        <p className="font-bold text-neutral-350">Lead record not found</p>
        <Link href="/leads" className="text-indigo-400 hover:underline mt-2 inline-block">
          &larr; Back to Pipeline
        </Link>
      </div>
    );
  }

  const { lead, research, outreach, emails } = data;

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      NEW: "bg-neutral-800 border-neutral-700 text-neutral-400",
      RESEARCHING: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 animate-pulse",
      RESEARCHED: "bg-blue-500/10 border-blue-500/20 text-blue-400",
      SCORING: "bg-purple-500/10 border-purple-500/20 text-purple-400 animate-pulse",
      SCORED: "bg-purple-500/10 border-purple-500/20 text-purple-400",
      OUTREACH_GENERATED: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      APPROVED: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      EMAIL_SENT: "bg-teal-500/10 border-teal-500/20 text-teal-400",
      REPLIED: "bg-pink-500/10 border-pink-500/20 text-pink-400 font-bold",
      ARCHIVED: "bg-neutral-900 border-neutral-850 text-neutral-600",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-[9px] border font-bold tracking-widest uppercase ${badges[status] || "bg-neutral-800 text-neutral-400"}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-6">
      
      {/* Back button & header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link 
          href="/leads"
          className="text-neutral-400 hover:text-neutral-200 text-xs font-semibold flex items-center gap-1"
        >
          &larr; BACK TO PIPELINE
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">LEAD STATUS</span>
          {getStatusBadge(lead.status)}
        </div>
      </div>

      {/* Grid Layout (Top half: Research & Scoring) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Lead Basic Info & Research (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Core profile */}
          <div className="glass-plate-textured p-6 shadow-md">
            <div className="glass-content">
              <span className="text-[9px] font-mono text-neutral-500 tracking-widest uppercase font-bold">Target Account</span>
              <h2 className="text-2xl font-bold text-neutral-100 tracking-tight mt-1">{lead.companyName}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-neutral-400 mt-4 pt-4 border-t border-white/5 font-light">
                <span className="flex items-center gap-2">👤 CONTACT: <strong className="text-neutral-200">{lead.name}</strong></span>
                <span className="flex items-center gap-2">✉️ EMAIL: <strong className="text-neutral-250 font-mono">{lead.email}</strong></span>
                <span className="flex items-center gap-2">🔗 WEBSITE: 
                  <a href={`https://${lead.website}`} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline font-mono">
                    {lead.website}
                  </a>
                </span>
              </div>
            </div>
          </div>

          {/* AI Research results */}
          <div className="glass-plate-textured p-6 shadow-md min-h-[220px]">
            <div className="glass-content space-y-4">
              <h3 className="font-display text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">
                🔍 AI SCRAPING & RESEARCH TELEMETRY
              </h3>

              {!research ? (
                <div className="flex flex-col items-center justify-center h-[120px] text-neutral-500 text-center">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs">Gathering company intelligence...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block mb-1">Company Summary</span>
                    <p className="text-[12px] text-neutral-300 leading-relaxed font-light">{research.summary}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 pt-2 border-t border-white/5">
                    <div>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block mb-2">Inferred Technologies</span>
                      <div className="flex flex-wrap gap-1.5">
                        {research.technologies?.split(',').map((tech: string) => (
                          <span key={tech} className="px-2 py-0.5 rounded bg-black/40 border border-white/5 text-[9px] text-neutral-300 font-mono">
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block mb-1.5">Employee Headcount</span>
                      <p className="text-sm font-extrabold text-neutral-200 mt-1 font-mono tracking-tight">{research.employeeCount || "N/A"}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5">
                    <details className="cursor-pointer group">
                      <summary className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider hover:text-neutral-300 transition-colors">
                        Raw Scraping JSON Metadata
                      </summary>
                      <pre className="mt-2.5 p-3.5 bg-black/40 border border-white/5 rounded-xl text-[10px] font-mono text-neutral-450 overflow-x-auto select-all max-h-[150px] leading-relaxed">
                        {JSON.stringify(research.rawScrapedData, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Scoring Box (1/3 width) */}
        <div className="space-y-6">
          <div className="glass-plate-textured p-6 shadow-md min-h-[360px] flex flex-col">
            <div className="glass-content flex-1 flex flex-col">
              <h3 className="font-display text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4 text-center">
                🎯 Lead Intent Scoring
              </h3>

              {lead.score === null ? (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 text-center">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs">Evaluating pipeline match...</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                  {/* Glowing Score Ring */}
                  <div className="relative w-36 h-36 rounded-full border-[10px] border-white/5 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.02)]">
                    <div className="text-center">
                      <p className="font-display text-4xl font-extrabold text-white tracking-tight tabular-nums">{lead.score}</p>
                      <p className="text-[8px] text-neutral-550 uppercase tracking-wider font-bold mt-0.5">MATCH RATING</p>
                    </div>
                    {lead.score >= 80 && (
                      <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping opacity-60 pointer-events-none" />
                    )}
                  </div>

                  <div className="border-t border-white/5 pt-4 w-full text-center">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block mb-1">AI Recommendation Reasoning</span>
                    <p className="text-xs text-neutral-400 leading-relaxed font-light mt-1.5">
                      {lead.scoreReasoning}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Outreach Approvals & simulated customer reply */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Action / Outreach Section (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Outreach Draft card */}
          {outreach && (
            <div className="glass-plate-textured p-6 shadow-md">
              <div className="glass-content space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    💬 Personalized Outreach Sequence
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                    outreach.status === 'APPROVED' 
                      ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-450' 
                      : 'bg-amber-500/5 border-amber-500/10 text-amber-450'
                  }`}>
                    {outreach.status}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-neutral-400 space-y-2 leading-relaxed bevel-shine-input">
                  <p><strong className="text-neutral-300">Subject:</strong> {outreach.subject}</p>
                  <p className="whitespace-pre-line text-neutral-450 border-t border-white/5 pt-2.5">{outreach.body}</p>
                </div>

                {outreach.status === 'DRAFT' && (
                  <div className="flex items-center justify-end">
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-650/40 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                    >
                      {actionLoading ? "Delivering..." : "Approve & Deliver Outreach Email"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Email History Logs */}
          <div className="glass-plate-textured p-6 shadow-md min-h-[220px]">
            <div className="glass-content space-y-4">
              <h3 className="font-display text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">
                ✉️ Outbox & Inbound Reply Ledger
              </h3>

              {emails.length === 0 ? (
                <p className="text-xs text-neutral-500 italic font-light font-sans">No email exchanges logged yet.</p>
              ) : (
                <div className="space-y-4">
                  {emails.map((email: any) => {
                    const isOutbound = email.direction === 'OUTBOUND';
                    return (
                      <div 
                        key={email.id} 
                        className={`p-4 rounded-xl border text-[11px] leading-relaxed ${
                          isOutbound 
                            ? 'bg-indigo-500/5 border-indigo-500/10 text-neutral-300 ml-6 shadow-sm' 
                            : 'bg-black/40 border-white/5 text-neutral-300 mr-6 shadow-inner bevel-shine-input'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[9px] text-neutral-550 mb-2 font-mono uppercase tracking-wider font-bold">
                          <span>{isOutbound ? '📤 OUTGOING EMAIL' : '📥 INBOUND REPLY'}</span>
                          <span>{new Date(email.processedAt).toLocaleString()}</span>
                        </div>
                        <h4 className="font-bold mb-1.5 text-neutral-200">{email.subject}</h4>
                        <p className="whitespace-pre-line text-neutral-400 leading-relaxed font-light">{email.body}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer simulation playground (1/3 width) - Pink highlights */}
        <div className="space-y-6">
          <div className="glass-plate-textured p-6 shadow-[0_0_30px_rgba(236,72,153,0.02)] border border-pink-500/10 min-h-[300px]">
            <div className="glass-content">
              <h3 className="font-display text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <span>🎮</span> SIMULATION SANDBOX
              </h3>
              
              <p className="text-[10px] text-neutral-450 leading-relaxed mb-4 font-light">
                Simulate a customer response. When delivered, AI classifies the text sentiment, categorizes action items, and automates CRM status updates in real-time.
              </p>

              <form onSubmit={handleSimulateReply} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold text-neutral-555 uppercase tracking-widest mb-1.5">Subject Line</label>
                  <input
                    type="text"
                    required
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/5 focus:border-pink-500 focus:outline-none text-[11px] text-neutral-350 transition-all font-mono bevel-shine-input"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-neutral-555 uppercase tracking-widest mb-1.5">Email Body Content</label>
                  <textarea
                    required
                    rows={4}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="e.g. 'Hey Jensen, I am interested, let's schedule a call next Tuesday at 3pm.' or 'Unsubscribe.'"
                    className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/5 focus:border-pink-500 focus:outline-none text-[11px] text-neutral-200 transition-all font-light bevel-shine-input leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={simulating || !replyBody}
                  className="w-full py-2.5 bg-gradient-to-r from-pink-500/10 to-indigo-500/10 hover:from-pink-500/20 hover:to-indigo-500/20 border border-pink-500/20 text-pink-450 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {simulating ? "Processing reply..." : "Deliver Simulated Inbound"}
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
