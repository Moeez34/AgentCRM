import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-indigo-900/10 blur-[120px]" />
        <div className="absolute top-[60%] -right-[20%] w-[70%] h-[70%] rounded-full bg-purple-900/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-neutral-900/50 bg-neutral-950/80 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-500/20">
            A
          </div>
          <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-neutral-50 to-neutral-300 bg-clip-text text-transparent">
            AgentCRM
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-neutral-400 hover:text-neutral-200 transition-colors">
            Sign In
          </Link>
          <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 hover:text-white transition-all shadow-md">
            Go to Dashboard &rarr;
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-5xl mx-auto text-center py-20 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6 shadow-sm shadow-indigo-500/5">
          🚀 Next-Generation AI-Native CRM
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-transparent leading-[1.15]">
          Supercharge Your Sales Pipeline with Autonomous AI Agents
        </h1>

        <p className="text-lg md:text-xl text-neutral-400 mb-10 max-w-2xl font-light leading-relaxed">
          Autonomously research leads, calculate intent scoring, write hyper-personalized outreach sequences, and analyze incoming replies to trigger database automation.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
          <Link
            href="/login"
            className="w-full sm:w-auto text-center px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold transition-all shadow-lg shadow-indigo-500/20 hover:scale-[1.02]"
          >
            Launch Free Sandbox
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto text-center px-8 py-4 rounded-xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-855 text-neutral-300 font-medium transition-all"
          >
            See System Architecture
          </a>
        </div>

        {/* Feature grid */}
        <section id="features" className="w-full pt-32 pb-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-900 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 font-bold">
              🔍
            </div>
            <h3 className="font-semibold text-lg text-neutral-100 mb-2">Automated Research</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Instantly scrapes website structures and extracts tech stacks, sizes, and summaries.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-900 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 font-bold">
              🎯
            </div>
            <h3 className="font-semibold text-lg text-neutral-100 mb-2">AI Score & RAG Search</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Uses pgvector to enable natural language semantic search across lead profiles.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-900 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-4 font-bold">
              💬
            </div>
            <h3 className="font-semibold text-lg text-neutral-100 mb-2">Human-in-the-Loop</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              AI drafts emails but waits for your approval before delivery. Replies trigger automated follow-ups.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900/50 bg-neutral-950 py-8 px-6 text-center text-sm text-neutral-500">
        <p>&copy; {new Date().getFullYear()} AgentCRM. Flagship Agentic CRM Project. Made with Gemini.</p>
      </footer>
    </div>
  );
}
