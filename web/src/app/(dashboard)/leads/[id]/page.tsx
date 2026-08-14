"use client";

import { useEffect, useState } from "react";
import { getLeadDetail, approveOutreach, simulateInboundReply } from "@/app/actions";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

export default function LeadDetailPage() {
  const router = useRouter();
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
    // Auto-refresh every 3s to capture background worker status transitions
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
      // Add simulated delay to let worker run
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
      <div className="h-[60vh] flex items-center justify-center text-neutral-400">
        Loading lead details...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-neutral-400">
        <p className="font-semibold">Lead not found</p>
        <Link href="/leads" className="text-indigo-400 hover:underline mt-2 inline-block">
          &larr; Back to Leads Pipeline
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
      <span className={`px-3 py-1 rounded-full text-xs border font-medium uppercase tracking-wider ${badges[status] || "bg-neutral-800 text-neutral-400"}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Back button & header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link 
          href="/leads"
          className="text-neutral-400 hover:text-neutral-200 text-xs font-semibold flex items-center gap-1"
        >
          &larr; Back to Pipeline
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">Lead Status:</span>
          {getStatusBadge(lead.status)}
        </div>
      </div>

      {/* Grid Layout (Top half: Research & Scoring; Bottom half: Communication logs & Simulation) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Lead Basic Info & Research (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Core profile */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-900 shadow-md">
            <h2 className="text-2xl font-bold text-neutral-100">{lead.companyName}</h2>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-neutral-400 mt-2">
              <span className="flex items-center gap-1">👤 Contact: <strong>{lead.name}</strong></span>
              <span className="flex items-center gap-1">✉️ Email: <strong>{lead.email}</strong></span>
              <span className="flex items-center gap-1">🔗 Website: 
                <a href={`https://${lead.website}`} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                  {lead.website}
                </a>
              </span>
            </div>
          </div>

          {/* AI Research results */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-900 shadow-md min-h-[220px]">
            <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider mb-4">
              🔍 AI SCRAPING & RESEARCH SUMMARY
            </h3>

            {!research ? (
              <div className="flex flex-col items-center justify-center h-[120px] text-neutral-500 text-center">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-xs">Gathering website details in background...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Company Summary</h4>
                  <p className="text-xs text-neutral-300 leading-relaxed font-light">{research.summary}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Inferred Tech Stack</h4>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {research.technologies?.split(',').map((tech: string) => (
                        <span key={tech} className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-850 text-[10px] text-neutral-300 font-mono">
                          {tech.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Employee Count</h4>
                    <p className="text-xs font-semibold text-neutral-300 mt-1">{research.employeeCount || "Unknown"} employees</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-850/50">
                  <details className="cursor-pointer">
                    <summary className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Raw Scraping JSON Metadata</summary>
                    <pre className="mt-2 p-3 bg-neutral-950 rounded-xl text-[10px] font-mono text-neutral-400 overflow-x-auto select-all max-h-[150px]">
                      {JSON.stringify(research.rawScrapedData, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Scoring Box (1/3 width) */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-900 shadow-md min-h-[360px] flex flex-col">
            <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider mb-4 text-center">
              🎯 Lead Scoring
            </h3>

            {lead.score === null ? (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 text-center">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-xs">Evaluating company stack fit...</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                {/* Visual Score Ring */}
                <div className="relative w-32 h-32 rounded-full border-[10px] border-neutral-850 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-extrabold text-neutral-100">{lead.score}</p>
                    <p className="text-[9px] text-neutral-500 uppercase font-semibold">Match Score</p>
                  </div>
                  {/* Glowing halo if high score */}
                  {lead.score >= 80 && (
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping opacity-75" />
                  )}
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1 text-center">AI Evaluation Reasoning</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed font-light text-center">
                    {lead.scoreReasoning}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Row 2: Outreach Approvals & simulated customer reply (Communication center) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Action / Outreach Section (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Outreach Draft card */}
          {outreach && (
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-900 shadow-md">
              <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>💬 Personalization Outreach Seq</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  outreach.status === 'APPROVED' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                  {outreach.status}
                </span>
              </h3>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-850 text-xs font-mono text-neutral-400 space-y-2">
                  <p><strong>Subject:</strong> {outreach.subject}</p>
                  <p className="whitespace-pre-line text-neutral-400/80 leading-relaxed border-t border-neutral-900 pt-2">{outreach.body}</p>
                </div>

                {outreach.status === 'DRAFT' && (
                  <div className="flex items-center justify-end">
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      {actionLoading ? "Sending outreach..." : "Approve and Send Outreach Email"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Communication/Email Log logs */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-900 shadow-md min-h-[200px]">
            <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider mb-4">
              ✉️ Outgoing & Inbound Email History
            </h3>

            {emails.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">No email exchange logs yet.</p>
            ) : (
              <div className="space-y-4">
                {emails.map((email: any) => {
                  const isOutbound = email.direction === 'OUTBOUND';
                  return (
                    <div 
                      key={email.id} 
                      className={`p-4 rounded-xl border text-xs leading-relaxed ${
                        isOutbound 
                          ? 'bg-indigo-500/5 border-indigo-500/10 text-neutral-300 ml-6' 
                          : 'bg-neutral-950 border-neutral-850 text-neutral-300 mr-6'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-2 font-mono">
                        <span className="font-semibold">{isOutbound ? '📤 SENT OUTBOUND' : '📥 RECEIVED INBOUND'}</span>
                        <span>{new Date(email.processedAt).toLocaleString()}</span>
                      </div>
                      <h4 className="font-bold mb-1">{email.subject}</h4>
                      <p className="whitespace-pre-line text-neutral-400/90 font-light">{email.body}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Customer simulation playground (1/3 width) */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-neutral-900 to-pink-950/10 border border-neutral-900 shadow-md min-h-[300px]">
            <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span>🎮</span> Inbound Simulation Sandbox
            </h3>
            
            <p className="text-[11px] text-neutral-400 leading-relaxed mb-4">
              Simulate receiving a reply email from this lead. Hit send and watch the AI agent analyze the email text and automatically flag interest or archive the CRM state!
            </p>

            <form onSubmit={handleSimulateReply} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Subject Line</label>
                <input
                  type="text"
                  required
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950/60 border border-neutral-850 focus:border-pink-500 focus:outline-none text-xs text-neutral-350 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Email Body</label>
                <textarea
                  required
                  rows={4}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Examples:\n1) 'Hey! This sounds interesting, let's chat next Wednesday at 3pm.'\n2) 'Please stop emailing me, remove me from your list.'"
                  className="w-full px-3 py-2.5 rounded-lg bg-neutral-950/60 border border-neutral-850 focus:border-pink-500 focus:outline-none text-xs text-neutral-200 transition-all font-light"
                />
              </div>

              <button
                type="submit"
                disabled={simulating || !replyBody}
                className="w-full py-2.5 bg-gradient-to-r from-pink-500/20 to-indigo-500/20 hover:from-pink-500/30 hover:to-indigo-500/30 border border-pink-500/30 text-pink-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {simulating ? "Processing reply..." : "Deliver Inbound Reply Simulated"}
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
