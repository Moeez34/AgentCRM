"use client";

import { useEffect, useState } from "react";
import { getLeads, addLead } from "@/app/actions";
import Link from "next/link";

export default function LeadsPage() {
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchLeads = async (query?: string) => {
    setSearching(true);
    try {
      const results = await getLeads(query);
      setLeadsList(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(() => {
      if (!searchQuery) {
        fetchLeads();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    fetchLeads("");
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    if (!name || !email || !companyName || !website) {
      setFormError("All fields are required.");
      setFormLoading(false);
      return;
    }

    try {
      const res = await addLead(name, email, companyName, website);
      if (res.success) {
        setName("");
        setEmail("");
        setCompanyName("");
        setWebsite("");
        await fetchLeads();
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to add lead.");
    } finally {
      setFormLoading(false);
    }
  };

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
      <span className={`px-2 py-0.5 rounded-full text-[9px] border font-bold tracking-wider ${badges[status] || "bg-neutral-800 text-neutral-400"}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pb-6">
      
      {/* Add Lead Form (Left Col - 1/4) */}
      <div className="space-y-6">
        <div className="glass-plate-textured p-6 shadow-lg">
          <div className="glass-content">
            <h3 className="font-display text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">
              ➕ INGEST SALES LEAD
            </h3>

            <form onSubmit={handleAddLead} className="space-y-4">
              {formError && (
                <p className="p-3 text-[11px] rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 leading-normal">{formError}</p>
              )}

              <div>
                <label className="block text-[9px] font-bold text-neutral-550 uppercase tracking-widest mb-1.5">Contact Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jensen Huang"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/5 focus:border-indigo-500 focus:outline-none text-[11px] text-neutral-200 transition-all font-light bevel-shine-input"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-neutral-555 uppercase tracking-widest mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jensen@nvidia.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/5 focus:border-indigo-500 focus:outline-none text-[11px] text-neutral-200 transition-all font-light bevel-shine-input"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-neutral-555 uppercase tracking-widest mb-1.5">Company Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nvidia Corp"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/5 focus:border-indigo-500 focus:outline-none text-[11px] text-neutral-200 transition-all font-light bevel-shine-input"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-neutral-555 uppercase tracking-widest mb-1.5">Website Domain</label>
                <input
                  type="text"
                  required
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="nvidia.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/5 focus:border-indigo-500 focus:outline-none text-[11px] text-neutral-200 transition-all font-light bevel-shine-input"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-650/40 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
              >
                {formLoading ? "Ingesting..." : "Ingest & Research Lead"}
              </button>
            </form>
            
            <p className="text-[10px] text-neutral-550 leading-relaxed mt-4 font-light">
              💡 Triggering research scrapes website targets, calculates intent matching, and generates outreach drafts.
            </p>
          </div>
        </div>
      </div>

      {/* Leads Table & RAG Search (Right Col - 3/4) */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* RAG Vector search form */}
        <div className="glass-plate-textured p-4 shadow-md">
          <div className="glass-content">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Semantic RAG Search (e.g. 'companies matching machine learning tech stack' or 'satya')"
                  className="w-full pl-4 pr-10 py-3.5 rounded-xl bg-black/40 border border-white/5 focus:border-indigo-500 focus:outline-none text-[11px] text-neutral-200 transition-all font-light bevel-shine-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={searching}
                className="btn-glass px-5 py-3 rounded-xl text-xs font-bold text-neutral-200 hover:text-white cursor-pointer"
              >
                {searching ? "Searching..." : "Vector Search"}
              </button>
            </form>
            {searchQuery && (
              <p className="text-[10px] text-indigo-400 mt-2 font-medium tracking-wide">
                ✨ Cosine Similarity active. Ranking database records using pgvector distance values.
              </p>
            )}
          </div>
        </div>

        {/* Lead Table card */}
        <div className="glass-plate-textured p-6 shadow-lg min-h-[450px]">
          <div className="glass-content">
            <h3 className="font-display text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">
              WORKSPACE LEAD PIPELINE
            </h3>

            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-neutral-500 text-xs font-light tracking-wide">
                Loading database pipeline...
              </div>
            ) : leadsList.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-neutral-500 text-center px-4">
                <span className="text-2xl mb-2">📭</span>
                <p className="font-bold text-xs text-neutral-300">No matching leads found</p>
                <p className="text-[10px] text-neutral-600 mt-1 font-light">Try refining the search term or creating new pipeline records.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-neutral-500 uppercase tracking-widest text-[9px] font-bold">
                      <th className="py-3 px-4 font-bold">Lead Details</th>
                      <th className="py-3 px-4 font-bold">Company Profile</th>
                      <th className="py-3 px-4 font-bold">AI Match Score</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 text-right font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/2">
                    {leadsList.map((lead) => (
                      <tr 
                        key={lead.id}
                        className="hover:bg-white/1 transition-colors group"
                      >
                        <td className="py-4 px-4">
                          <div className="font-bold text-neutral-200 text-xs">{lead.name}</div>
                          <div className="text-neutral-500 text-[10px] font-mono mt-0.5">{lead.email}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-neutral-300 text-xs font-medium">{lead.companyName}</div>
                          <a 
                            href={`https://${lead.website}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 text-[10px] mt-0.5 inline-block font-mono"
                          >
                            {lead.website}
                          </a>
                        </td>
                        <td className="py-4 px-4">
                          {lead.score !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-black/40 border border-white/5 flex items-center justify-center font-bold text-neutral-200 font-mono text-xs shadow-inner tabular-nums">
                                {lead.score}
                              </div>
                              {lead.score >= 80 && <span className="text-[10px]" title="Hot lead">🔥</span>}
                            </div>
                          ) : (
                            <span className="text-neutral-600 font-light text-[11px] italic">Scoring...</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(lead.status)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link 
                            href={`/leads/${lead.id}`}
                            className="btn-glass px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-neutral-300 hover:text-white"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
