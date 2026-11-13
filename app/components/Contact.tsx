"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/* TODO: replace with the real Telegram handle */
export const TELEGRAM_URL = "https://t.me/piperx";

const NAV = [
  { label: "PiperX", href: "#piperx" },
  { label: "Mediums", href: "#mediums" },
  { label: "Trades", href: "#trades" },
  { label: "Contact", href: "#contact" },
];

export default function Contact() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          q(".c-line"),
          { yPercent: 110 },
          {
            yPercent: 0,
            stagger: 0.12,
            duration: 1.2,
            ease: "power4.out",
            scrollTrigger: { trigger: q(".c-head")[0], start: "top 85%" },
          },
        );
        gsap.fromTo(
          q(".c-fade"),
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.12,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: q(".c-head")[0], start: "top 70%" },
          },
        );
        gsap.fromTo(
          q(".c-word"),
          { yPercent: 40, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 1.6,
            ease: "expo.out",
            scrollTrigger: { trigger: q(".c-word")[0], start: "top 105%" },
          },
        );
        gsap.to(q(".c-plane"), {
          x: 5,
          y: -5,
          duration: 1.2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });

        /* magnetic CTA */
        const wrap = q(".c-magnet")[0] as HTMLElement;
        const btn = q(".c-cta")[0] as HTMLElement;
        const fine = window.matchMedia("(pointer: fine)").matches;
        if (!wrap || !btn || !fine) return;
        const mx = gsap.quickTo(btn, "x", { duration: 0.6, ease: "power3.out" });
        const my = gsap.quickTo(btn, "y", { duration: 0.6, ease: "power3.out" });
        const move = (e: MouseEvent) => {
          const r = wrap.getBoundingClientRect();
          mx((e.clientX - (r.left + r.width / 2)) * 0.28);
          my((e.clientY - (r.top + r.height / 2)) * 0.28);
        };
        const leave = () => {
          mx(0);
          my(0);
        };
        wrap.addEventListener("mousemove", move);
        wrap.addEventListener("mouseleave", leave);
        return () => {
          wrap.removeEventListener("mousemove", move);
          wrap.removeEventListener("mouseleave", leave);
        };
      });
    },
    { scope: root },
  );

  return (
    <footer
      ref={root}
      id="contact"
      className="grain relative isolate z-40 -mt-10 overflow-hidden rounded-t-[44px] bg-[#0b0720] text-white"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_50%_0%,#2f2080_0%,#160e40_50%,#0b0720_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[30%] -z-10 h-[60vmin] w-[60vmin] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(239,95,24,0.45)_0%,transparent_65%)] blur-3xl"
      />

      <div className="px-5 pt-28 sm:px-8 lg:px-[4%]">
        <div className="mx-auto flex max-w-[1300px] flex-col items-center text-center">
          <p className="c-fade mb-8 flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.18em] text-white/60 opacity-0">
            <span className="relative inline-flex h-2 w-2">
              <span className="pulse-ring absolute inset-0 rounded-full bg-[#3ddc97]" />
              <span className="relative h-2 w-2 rounded-full bg-[#3ddc97]" />
            </span>
            Contact
          </p>

          <h2 className="c-head text-[clamp(2.6rem,7vw,6.5rem)] font-semibold leading-[0.98] tracking-tight">
            <span className="block overflow-hidden pb-1">
              <span className="c-line block">Ready to trade</span>
            </span>
            <span className="block overflow-hidden pb-2">
              <span className="c-line block text-orange">with clarity?</span>
            </span>
          </h2>

          <p className="c-fade mt-6 max-w-[520px] text-[clamp(1.05rem,1.5vw,1.3rem)] leading-snug text-white/65 opacity-0">
            Questions, mentorship or just a chart you want a second pair of
            eyes on? Send me a message on Telegram.
          </p>

          <div className="c-fade c-magnet mt-12 p-8 opacity-0">
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="c-cta group relative inline-flex items-center gap-4 rounded-full bg-orange py-4 pl-8 pr-4 text-[clamp(1.05rem,1.5vw,1.3rem)] font-medium shadow-[0_20px_60px_-12px_rgba(239,95,24,0.85)] transition-colors hover:bg-[#ff7433]"
            >
              Message me on Telegram
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-orange">
                <svg
                  className="c-plane"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M21.6 3.4 2.9 10.6c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.6.1.9.8.9.5 0 .8-.2 1.1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.8c.3-1.2-.5-1.8-1.5-1.4ZM8.6 13.2l9.6-6c.5-.3.9-.1.6.2l-7.9 7.1-.3 3.3-2-4.6Z" />
                </svg>
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* wordmark */}
      <div className="pointer-events-none mt-6 select-none overflow-hidden">
        <p
          aria-hidden
          className="c-word hero-title text-center font-display uppercase leading-[0.9] tracking-[0.01em] [font-size:min(30vw,34rem)]"
          style={{ paddingBottom: "0.02em" }}
        >
          PiperX
        </p>
      </div>

      {/* bottom bar */}
      <div className="relative border-t border-white/10 bg-[#0b0720]/80 px-5 py-6 backdrop-blur-sm sm:px-8 lg:px-[4%]">
        <div className="mx-auto flex max-w-[1300px] flex-col gap-5">
          <div className="flex flex-col items-center justify-between gap-4 text-[13px] text-white/60 md:flex-row">
            <span>© {new Date().getFullYear()} PiperX. All rights reserved.</span>
            <nav className="flex gap-6">
              {NAV.map((n) => (
                <a key={n.label} href={n.href} className="transition-colors hover:text-orange">
                  {n.label}
                </a>
              ))}
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-orange"
              >
                Telegram
              </a>
            </nav>
          </div>
          <p className="text-center text-[11.5px] leading-relaxed text-white/35 md:text-left">
            Risk warning: trading forex, gold and crypto involves substantial
            risk and may not be suitable for everyone. Past performance is not
            indicative of future results. Nothing on this site is financial
            advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
