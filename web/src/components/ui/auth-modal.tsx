"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { X, Mail, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Google Icon
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// GitHub Icon (Crisp White fill for dark mode)
const GitHubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      fill="#ffffff"
    />
  </svg>
);

interface AuthModalProps {
  triggerText?: string;
  onLogin?: (provider: string) => void;
  className?: string;
}

function AuthModal({
  triggerText = "Sign up / Sign in",
  onLogin,
  className,
}: AuthModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const container: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
        staggerChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const socialButtons = [
    {
      icon: GoogleIcon,
      label: "Google",
      color: "hover:bg-zinc-800/80",
    },
    {
      icon: GitHubIcon,
      label: "GitHub",
      color: "hover:bg-zinc-800/80",
    },
  ];

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin?.("email");
  };

  return (
    <>
      {/* Apple Liquid Morphism Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "relative group inline-flex h-14 items-center justify-center rounded-full px-10 text-base font-semibold text-white tracking-tight transition-all duration-300 ease-out overflow-hidden cursor-pointer",
          "bg-white/10 hover:bg-white/15 backdrop-blur-2xl border border-white/25 hover:border-white/40",
          "shadow-[0_8px_32px_0_rgba(0,0,0,0.37),inset_0_1px_0_0_rgba(255,255,255,0.5)]",
          "hover:shadow-[0_12px_40px_0_rgba(75,62,203,0.4),inset_0_1px_0_0_rgba(255,255,255,0.7)]",
          "hover:scale-[1.03] active:scale-[0.97]",
          className
        )}
      >
        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
        <span className="relative z-10 flex items-center gap-2">
          {triggerText}
          <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
        </span>
      </button>

      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
              {/* Backdrop Blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />

              {/* Black Glass Dialog Container */}
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                exit="exit"
                className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-zinc-950 p-8 shadow-2xl backdrop-blur-2xl border border-zinc-800/80 ring-1 ring-white/10 text-white"
              >
              {/* Close Button */}
              <div className="absolute right-5 top-5">
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Header with Styled Typography */}
              <motion.div variants={item} className="mb-10 text-center">
                <h2 className="text-3xl font-semibold tracking-tight text-white flex items-center justify-center gap-2">
                  Welcome{" "}
                  <span className="relative font-lobster text-4xl text-white px-2 py-0.5 select-none">
                    back
                    {/* Animated Hand-drawn Underline SVG */}
                    <span className="absolute left-0 right-0 -bottom-2 h-3 pointer-events-none">
                      <svg
                        viewBox="0 0 100 10"
                        className="w-full h-full fill-none stroke-[2.5] stroke-linecap-round"
                        preserveAspectRatio="none"
                      >
                        <motion.path
                          d="M97 2 C 65 8, 35 8, 3 2 C 35 9, 65 9, 95 3"
                          stroke="white"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
                        />
                      </svg>
                    </span>
                  </span>
                </h2>
                <p className="mt-3 text-sm text-zinc-400">
                  Sign in to your account to{" "}
                  <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-purple-400 bg-clip-text text-transparent font-semibold">
                    continue
                  </span>
                </p>
              </motion.div>

              {/* Provider Options */}
              <motion.div
                variants={item}
                className="grid grid-cols-2 gap-4 mb-8"
              >
                {socialButtons.map((btn, i) => (
                  <button
                    key={i}
                    onClick={() => onLogin?.(btn.label)}
                    className={cn(
                      "flex h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/90 font-semibold text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
                      btn.color
                    )}
                    aria-label={`Sign in with ${btn.label}`}
                  >
                    <btn.icon className="h-5 w-5" />
                    <span>{btn.label}</span>
                  </button>
                ))}
              </motion.div>

              {/* Divider */}
              <motion.div variants={item} className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-950 px-3 text-zinc-500 font-mono tracking-widest text-[10px]">
                    Or continue with email
                  </span>
                </div>
              </motion.div>

              {/* Email Form */}
              <motion.div variants={item}>
                <form onSubmit={handleEmailSubmit} className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-900/70 pl-12 pr-14 text-sm text-white placeholder:text-zinc-500 outline-none transition-all focus:border-zinc-700 focus:bg-zinc-900 focus:ring-1 focus:ring-zinc-700"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl h-8 w-8 flex items-center justify-center bg-white text-zinc-950 transition-transform hover:scale-95 active:scale-90 font-bold cursor-pointer"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </motion.div>

              {/* Terms Footer */}
              <motion.div variants={item} className="mt-10 text-center">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  By clicking continue, you agree to our{" "}
                  <a
                    href="#"
                    className="underline hover:text-zinc-300 transition-colors"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="underline hover:text-zinc-300 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </p>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
}

export { AuthModal, type AuthModalProps };
export default AuthModal;
