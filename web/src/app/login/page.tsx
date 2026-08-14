"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@agentcrm.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid credentials. Try admin@agentcrm.com / admin123");
      } else {
        router.refresh();
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center px-4 relative">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-indigo-500/20 mb-3">
            A
          </div>
          <h2 className="text-2xl font-bold text-neutral-100">Welcome to AgentCRM</h2>
          <p className="text-sm text-neutral-400 mt-1">Autonomous Lead Lifecycle Automation</p>
        </div>

        {/* Card */}
        <div className="bg-neutral-900/60 border border-neutral-900 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@agentcrm.com"
                className="w-full px-4 py-3 rounded-xl bg-neutral-950/60 border border-neutral-850 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm text-neutral-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-neutral-950/60 border border-neutral-850 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm text-neutral-200 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white font-semibold text-sm transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              {loading ? "Authenticating..." : "Sign In &rarr;"}
            </button>
          </form>

          {/* Sandbox Credentials Banner */}
          <div className="mt-8 pt-6 border-t border-neutral-850/50 text-center">
            <p className="text-xs text-indigo-400 font-medium mb-1">🎮 FREE Sandbox Testing Mode</p>
            <p className="text-[11px] text-neutral-500 max-w-xs mx-auto leading-relaxed">
              Use login <code className="text-neutral-300 font-mono">admin@agentcrm.com</code> and password <code className="text-neutral-300 font-mono">admin123</code> to access the pre-seeded workspace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
