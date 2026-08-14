"use client";

import { useState } from "react";

export default function AgentConfigPage() {
  // Agent Config State
  const [agentName, setAgentName] = useState("SalesNavigator-V1");
  const [avatar, setAvatar] = useState("🤖");
  const [creativity, setCreativity] = useState(70);
  const [tone, setTone] = useState("DIRECT");
  const [maxLength, setMaxLength] = useState(150);
  const [icpRules, setIcpRules] = useState(
    "1. Target enterprise software, SaaS, or tech infrastructure companies.\n2. Prioritize leads using modern stacks (React, Next.js, Postgres, AWS).\n3. Focus outreach on team efficiency, custom integration capabilities, and automation ROI.\n4. Do not contact direct competitors."
  );

  // Playground State
  const [selectedLead, setSelectedLead] = useState("nvidia");
  const [logs, setLogs] = useState<string[]>([]);
  const [outputDraft, setOutputDraft] = useState<{ subject: string; body: string } | null>(null);
  const [simulating, setSimulating] = useState(false);

  const leadsOptions = {
    nvidia: { name: "Jensen Huang", company: "Nvidia Corp", website: "nvidia.com" },
    microsoft: { name: "Satya Nadella", company: "Microsoft Corp", website: "microsoft.com" },
    openai: { name: "Sam Altman", company: "OpenAI Inc", website: "openai.com" }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    setLogs([]);
    setOutputDraft(null);

    const targetLead = leadsOptions[selectedLead as keyof typeof leadsOptions];

    const steps = [
      `[Agent] Booting sequence for ${targetLead.company}...`,
      `[Agent] Crawling domain: https://${targetLead.website}`,
      `[Agent] Crawl successful. Tech detected: React, WebGL, C++, CUDA.`,
      `[Agent] Applying ICP constraint alignment check...`,
      `[Agent] ICP Match: 94%. Reasons: Uses target cloud tools, company size fit.`,
      `[Agent] Scoring lead priority based on intent parameters...`,
      `[Agent] Match Score Calculated: ${creativity > 80 ? 92 : 88}/100`,
      `[Agent] Initializing email generator (Model: GPT-4o-mini)...`,
      `[Agent] Injecting persona parameters: Tone = ${tone}, Length Limit = ${maxLength} words.`,
      `[Agent] Composing customized email outreach copy...`
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      setLogs((prev) => [...prev, steps[i]]);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Dynamic output content matching selected configuration
    let subject = "";
    let body = "";

    if (tone === "DIRECT") {
      subject = `CRM Pipeline Automation for ${targetLead.company}`;
      body = `Hi ${targetLead.name},\n\nI noticed ${targetLead.company} is scaling your tech infrastructure rapidly.\n\nWe build AgentCRM, an AI-native workspace that automates lead research, scoring, and follow-ups. Given your technical stack, we can streamline your sales pipeline operations directly.\n\nDo you have 10 minutes next Tuesday at 2 PM for a quick sandbox demo?\n\nBest,\n${agentName}`;
    } else if (tone === "CASUAL") {
      subject = `Quick ideas for ${targetLead.company}`;
      body = `Hey ${targetLead.name},\n\nHope you're having a good week. Was browsing ${targetLead.company}'s website and saw the recent scaling updates you guys pushed.\n\nWanted to reach out because we built a tool called AgentCRM that does automated research and email drafting for sales teams. Thought it might save your reps a few hours of manual prospecting every day.\n\nLet me know if you'd be open to checking out a quick mock setup sometime next week.\n\nCheers,\n${agentName}`;
    } else if (tone === "CREATIVE") {
      subject = `What if ${targetLead.company}'s pipeline ran itself?`;
      body = `Hello ${targetLead.name},\n\nImagine a scenario where a new lead enters your system, and within 30 seconds, an AI researches their website, scores their fit, and drafts a personalized email for your team to approve with one click.\n\nThat's exactly what we've built at AgentCRM. I was reviewing ${targetLead.company}'s engineering structure and believe our automated triggers align perfectly with your scaling goals.\n\nWould you be open to a 10-minute brainstorming chat next week to see how this fits your workflow?\n\nBest regards,\n${agentName}`;
    } else {
      subject = `Evaluating Sales Automation Feasibility for ${targetLead.company}`;
      body = `Dear ${targetLead.name},\n\nI am writing to initiate a technical discussion regarding the optimization of ${targetLead.company}'s sales pipelines. Our analysis indicates a potential integration surface between your core tech stack and our automated lead scoring models.\n\nAgentCRM provides structured background processing to automate outbound outreach copy based on target company attributes. We would welcome the opportunity to present a feasibility demonstration.\n\nCould you indicate your availability for a brief call next week?\n\nSincerely,\n${agentName}`;
    }

    setOutputDraft({ subject, body });
    setSimulating(false);
  };

  const avatars = ["🤖", "🦁", "🦉", "🦊", "🦅", "💡"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 pb-6 select-none">
      
      {/* Configuration Pane (Left 3 columns) */}
      <div className="lg:col-span-3 space-y-6">
        <div className="glass-plate-textured p-6 shadow-xl">
          <div className="glass-content space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-bold">AGENT SETUP</span>
                <h2 className="font-display font-extrabold text-lg text-white mt-1">Sequence Writer Persona</h2>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shadow-inner bevel-shine-input">
                {avatar}
              </div>
            </div>

            {/* Agent Identity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Agent Identifier</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/5 focus:border-indigo-500 focus:outline-none text-[11px] text-neutral-200 transition-all font-mono bevel-shine-input"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Mascot Avatar</label>
                <div className="flex gap-1.5">
                  {avatars.map((av) => (
                    <button
                      key={av}
                      onClick={() => setAvatar(av)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all cursor-pointer ${
                        avatar === av 
                          ? "bg-white/10 border border-white/20 text-white shadow-inner bevel-shine-input" 
                          : "bg-black/20 border border-white/5 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Persona Params Slider Section */}
            <div className="space-y-5 pt-4 border-t border-white/5">
              
              {/* Creativity */}
              <div>
                <div className="flex items-center justify-between text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-2.5">
                  <span>Creativity Temperature</span>
                  <span className="font-mono text-indigo-400">{creativity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={creativity}
                  onChange={(e) => setCreativity(Number(e.target.value))}
                  className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Word Count */}
              <div>
                <div className="flex items-center justify-between text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-2.5">
                  <span>Max Word Constraints</span>
                  <span className="font-mono text-indigo-400">{maxLength} words</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="250"
                  step="10"
                  value={maxLength}
                  onChange={(e) => setMaxLength(Number(e.target.value))}
                  className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Tone Selection Chips */}
              <div>
                <label className="block text-[9px] font-bold text-neutral-550 uppercase tracking-widest mb-2.5">Email Outreach Tone</label>
                <div className="grid grid-cols-4 gap-2">
                  {["DIRECT", "CASUAL", "CREATIVE", "ACADEMIC"].map((t) => {
                    const isActive = tone === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`py-2 rounded-xl text-[9px] font-bold tracking-wider transition-all cursor-pointer ${
                          isActive 
                            ? "bg-white/10 border border-white/20 text-white shadow-inner bevel-shine-input" 
                            : "bg-black/20 border border-white/5 text-neutral-450 hover:text-neutral-200"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* ICP System Instruction Box */}
            <div className="pt-4 border-t border-white/5">
              <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-2.5">
                Target ICP Scraper Filters & Rules
              </label>
              <textarea
                rows={5}
                value={icpRules}
                onChange={(e) => setIcpRules(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl bg-black/40 border border-white/5 focus:border-indigo-500 focus:outline-none text-[11px] text-neutral-300 transition-all font-light leading-relaxed bevel-shine-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Agent Console Playground (Right 2 columns) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Testing Console Frame */}
        <div className="glass-plate-textured p-6 shadow-xl flex flex-col min-h-[480px]">
          <div className="glass-content flex-1 flex flex-col space-y-4">
            
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[10px] font-bold text-pink-400 uppercase tracking-widest">
                ⚙️ Agent Brain Simulator
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-mono text-neutral-500 font-bold uppercase tracking-wider">Playground Active</span>
              </div>
            </div>

            {/* Lead selector form */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold tracking-wider shrink-0">Test Target:</span>
              <select
                value={selectedLead}
                onChange={(e) => setSelectedLead(e.target.value)}
                className="flex-1 bg-transparent border-0 text-xs font-bold text-neutral-200 focus:outline-none cursor-pointer"
              >
                <option value="nvidia" className="bg-[#020203]">Jensen Huang (Nvidia)</option>
                <option value="microsoft" className="bg-[#020203]">Satya Nadella (Microsoft)</option>
                <option value="openai" className="bg-[#020203]">Sam Altman (OpenAI)</option>
              </select>
            </div>

            {/* Interactive button */}
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="w-full py-3 bg-gradient-to-r from-pink-500/10 to-indigo-500/10 hover:from-pink-500/20 hover:to-indigo-500/20 border border-pink-500/25 text-pink-400 hover:text-pink-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-pink-500/5 uppercase tracking-wider"
            >
              {simulating ? "Processing Scrapes..." : "🚀 Execute Agent Cycle Dry-Run"}
            </button>

            {/* Terminal console logs */}
            <div className="flex-1 p-4 bg-black/55 border border-white/2 rounded-xl font-mono text-[10px] text-neutral-450 overflow-y-auto max-h-[170px] space-y-1.5 leading-normal shadow-inner bevel-shine-input scrollbar-thin">
              {logs.length === 0 ? (
                <p className="text-neutral-600 italic">Console output is empty. Run simulation to observe step-by-step reasoning logs.</p>
              ) : (
                logs.map((log, idx) => (
                  <p key={idx} className={log.includes("Match Score") ? "text-indigo-400 font-bold" : ""}>
                    {log}
                  </p>
                ))
              )}
            </div>

            {/* Generated output glass bubble */}
            {outputDraft && (
              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-2 animate-fadeIn">
                <span className="text-[9px] font-mono text-indigo-400 tracking-widest uppercase font-bold">Generated Outreach</span>
                <div className="text-[11px] leading-relaxed text-neutral-350">
                  <p className="font-bold border-b border-white/5 pb-1 text-neutral-250"><span className="text-neutral-500">Subject:</span> {outputDraft.subject}</p>
                  <p className="whitespace-pre-line pt-2 font-light leading-relaxed font-sans">{outputDraft.body}</p>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
