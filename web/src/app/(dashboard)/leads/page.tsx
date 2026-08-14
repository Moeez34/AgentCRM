"use client";

import { useEffect, useState } from "react";
import { getLeads, addLead } from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LeadsPage() {
  const router = useRouter();
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
    
    // Auto refresh every 4s to reflect background scraping
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
        // Reload list
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
      REPLIED: "bg-pink-500/10 border-pink-500/20 text-pink-400 font-semibold",
      ARCHIVED: "bg-neutral-900 border-neutral-850 text-neutral-600",
    };

    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] border font-medium ${badges[status] || "bg-neutral-800 text-neutral-400"}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      {/* Add Lead Form (Left Col - 1/4) */}
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-900 shadow-md">
          <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider mb-4">
            ➕ Add Sales Lead
          </h3>

          <form onSubmit={handleAddLead} className="space-y-4">
            {formError && (
              <p className="p-3 text-xs rounded-xl bg-red-500/15 border border-red-500/20 text-red-400">{formError}</p>
            )}

            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Contact Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jensen Huang"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/60 border border-neutral-850 focus:border-indigo-500 focus:outline-none text-xs text-neutral-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jensen@nvidia.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/60 border border-neutral-850 focus:border-indigo-500 focus:outline-none text-xs text-neutral-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Company Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nvidia Corp"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/60 border border-neutral-850 focus:border-indigo-500 focus:outline-none text-xs text-neutral-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Website Domain</label>
              <input
                type="text"
                required
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="nvidia.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/60 border border-neutral-850 focus:border-indigo-500 focus:outline-none text-xs text-neutral-200 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
            >
              {formLoading ? "Ingesting & Enqueuing..." : "Ingest Lead & Research"}
            </button>
          </form>
          
          <p className="text-[10px] text-neutral-500 leading-relaxed mt-4">
            💡 Adding a lead instantly launches the agentic cycle. The worker will scrape their website, score their enterprise alignment, and write a customized outreach draft.
          </p>
        </div>
      </div>

      {/* Leads Table & RAG Search (Right Col - 3/4) */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* RAG Vector search form */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-900 shadow-md">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Semantic RAG Search (e.g. 'companies matching machine learning tech stack' or 'satya')"
                className="w-full pl-4 pr-12 py-3 rounded-xl bg-neutral-950/60 border border-neutral-850 focus:border-indigo-500 focus:outline-none text-xs text-neutral-200 transition-all font-light"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-5 py-3 bg-neutral-800 hover:bg-neutral-850 border border-neutral-850 rounded-xl text-xs font-semibold text-neutral-200 transition-colors cursor-pointer"
            >
              {searching ? "Searching..." : "Vector Search"}
            </button>
          </form>
          {searchQuery && (
            <p className="text-[10px] text-indigo-400 mt-2 font-medium">
              ✨ Vector Similarity RAG Search active. Displaying leads ranked by cosine distance calculations.
            </p>
          )}
        </div>

        {/* Lead Table card */}
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-900 shadow-md min-h-[450px]">
          <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider mb-4">
            Pipeline Leads
          </h3>

          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-neutral-500">
              Loading pipeline...
            </div>
          ) : leadsList.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-neutral-500 text-sm">
              <span>📭</span>
              <p className="mt-2 font-semibold">No leads found</p>
              <p className="text-xs text-neutral-600 mt-1">Try resetting the search query or adding a new lead.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-850 text-neutral-500 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-4">Lead Info</th>
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">AI Score</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850/50">
                  {leadsList.map((lead) => (
                    <tr 
                      key={lead.id}
                      className="hover:bg-neutral-950/40 transition-colors group"
                    >
                      <td className="py-4 px-4">
                        <div className="font-semibold text-neutral-200">{lead.name}</div>
                        <div className="text-neutral-500 text-[11px] mt-0.5">{lead.email}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-neutral-300">{lead.companyName}</div>
                        <a 
                          href={`https://${lead.website}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 text-[10px] mt-0.5 inline-block"
                        >
                          🔗 {lead.website}
                        </a>
                      </td>
                      <td className="py-4 px-4">
                        {lead.score !== null ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-9 h-9 rounded-full bg-neutral-950 border border-neutral-850 flex items-center justify-center font-bold text-neutral-200">
                              {lead.score}
                            </div>
                            {lead.score >= 80 && <span className="text-[10px] text-amber-500" title="Hot lead">🔥</span>}
                          </div>
                        ) : (
                          <span className="text-neutral-600 font-light">Unscored</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(lead.status)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link 
                          href={`/leads/${lead.id}`}
                          className="inline-block px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-850 text-[11px] font-semibold text-neutral-300 group-hover:border-indigo-500/40 hover:text-white transition-all"
                        >
                          Manage &rarr;
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
  );
}
