"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AuthModal from "@/components/ui/auth-modal";
import AppleHelloSvg from "@/components/ui/apple-hello-svg";
import { playWindowsStartup } from "@/lib/windows-startup";

export default function LoginPage() {
  const [showHello, setShowHello] = useState(true);
  const router = useRouter();
  const soundPlayed = useRef(false);
  // Hold a pre-unlocked AudioContext so it's ready by the time the hello finishes
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Try to pre-create & resume AudioContext immediately on mount.
    // Modern Chrome/Edge often allow this; if suspended, the first gesture will resume it.
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx && !audioCtxRef.current) {
      try {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        if (ctx.state === "suspended") ctx.resume();
      } catch {
        // Will retry on first gesture
      }
    }

    // Pre-unlock the AudioContext on the very first user gesture so that the
    // scheduled Windows startup sound at ~3.5s can play automatically.
    const unlockAudio = () => {
      if (!audioCtxRef.current) {
        if (AudioCtx) {
          try {
            const ctx = new AudioCtx();
            audioCtxRef.current = ctx;
            if (ctx.state === "suspended") ctx.resume();
          } catch { /* ignore */ }
        }
      } else if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };

    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);

    // Play Windows startup sound exactly when hello finishes writing:
    // delay 0.3s + h draw 1.0s + ello draw 2.2s = 3.5s
    const soundTimer = setTimeout(() => {
      if (!soundPlayed.current) {
        soundPlayed.current = true;
        // Pass the pre-unlocked context so the sound bypasses autoplay block
        playWindowsStartup(audioCtxRef.current ?? undefined);
      }
    }, 3500);

    // Transition to sign-in page after 6.0 seconds (3.5s animation + 2.5s hold)
    const timer = setTimeout(() => setShowHello(false), 6000);

    return () => {
      clearTimeout(timer);
      clearTimeout(soundTimer);
      cleanup();
    };
  }, []);


  const handleDemoLogin = async () => {
    try {
      const res = await signIn("credentials", {
        email: "admin@agentcrm.com",
        password: "admin123",
        redirect: false,
      });
      if (!res?.error) {
        router.refresh();
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden text-white select-none">

      {/* ── BACKGROUND ── */}
      {/* Hello phase: pure black like reference image */}
      {/* Auth phase: Pryzm gradient */}
      <AnimatePresence>
        {showHello ? (
          <motion.div
            key="bg-black"
            className="fixed inset-0 z-0 bg-black"
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        ) : (
          <motion.div
            key="bg-gradient"
            className="fixed inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          >
            {/* SVG Filter for Fluid Organic Wave Displacement */}
            <svg className="absolute w-0 h-0">
              <defs>
                <filter id="pryzm-fluid-warp" x="-20%" y="-20%" width="140%" height="140%">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.002"
                    numOctaves="1"
                    result="noise"
                    seed="77"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="noise"
                    scale="240"
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                </filter>
              </defs>
            </svg>

            <div
              className="absolute inset-[-20%] w-[140%] h-[140%]"
              style={{
                background:
                  "linear-gradient(145deg, #f6d9e8 0%, #b9a8f0 35%, #4b3ecb 70%, #0e0c1c 100%)",
                filter: "url(#pryzm-fluid-warp)",
              }}
            />

            {/* Sandy film grain */}
            <div
              className="absolute inset-0 opacity-95 mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.22'/%3E%3C/svg%3E")`,
                backgroundRepeat: "repeat",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONTENT ── */}
      <AnimatePresence mode="wait">
        {showHello ? (
          <motion.div
            key="hello-intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(20px)" }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex items-center justify-center w-full px-6"
          >
            <AppleHelloSvg />
          </motion.div>
        ) : (
          <motion.div
            key="main-auth"
            initial={{ opacity: 0, scale: 0.9, y: 10, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center justify-center"
          >
            <AuthModal
              triggerText="Sign up / Sign in"
              onLogin={() => handleDemoLogin()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
