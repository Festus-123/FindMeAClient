"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const MEDIUMS = [
  { kind: "Broker", name: "HFM", mono: "H", note: "Execution on majors and gold" },
  { kind: "Broker", name: "Exness", mono: "E", note: "Fast fills through the London and New York sessions" },
  { kind: "Broker", name: "Bamboo", mono: "B", note: "A doorway into global markets" },
  { kind: "Platform", name: "MetaTrader 4", mono: "M4", note: "The classic: clean charts, reliable orders" },
  { kind: "Platform", name: "MetaTrader 5", mono: "M5", note: "More timeframes, deeper market view" },
  { kind: "Platform", name: "TradingView", mono: "TV", note: "Charting, alerts and the daily game plan" },
];

const MARQUEE = ["HFM", "Exness", "MetaTrader 4", "MetaTrader 5", "Bamboo", "TradingView"];

function Row({ outline }: { outline?: boolean }) {
  return (
    <div className="flex w-max items-center">
      {[0, 1].map((dup) => (
        <div key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
          {MARQUEE.map((m) => (
            <span key={m} className="flex items-center">
              <span
                className={`font-display text-[clamp(3rem,8vw,7rem)] uppercase leading-none tracking-wide ${
                  outline
                    ? "text-transparent [-webkit-text-stroke:1.5px_rgba(22,14,64,0.5)]"
                    : "text-[#160e40]"
                }`}
              >
                {m}
              </span>
              <span className="mx-[3vw] text-[clamp(1.5rem,3vw,2.5rem)] text-orange">✦</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Mediums() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          q(".m-line"),
          { yPercent: 110 },
          {
            yPercent: 0,
            stagger: 0.12,
            duration: 1.1,
            ease: "power4.out",
            scrollTrigger: { trigger: q(".m-head")[0], start: "top 85%" },
          },
        );
        gsap.fromTo(
          q(".m-fade"),
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: q(".m-head")[0], start: "top 75%" },
          },
        );

        /* marquees, opposite directions, nudged by scroll */
        const rows = q(".m-row");
        const tweens = rows.map((el, i) =>
          gsap.fromTo(
            el,
            { xPercent: i % 2 ? -50 : 0 },
            { xPercent: i % 2 ? 0 : -50, duration: 38, ease: "none", repeat: -1 },
          ),
        );
        ScrollTrigger.create({
          trigger: q(".m-marquee")[0],
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const v = Math.min(5, Math.abs(self.getVelocity()) / 400);
            tweens.forEach((t) => {
              gsap.to(t, { timeScale: 1 + v, duration: 0.2, overwrite: true });
              gsap.to(t, { timeScale: 1, duration: 1.2, delay: 0.2 });
            });
          },
        });

        gsap.fromTo(
          q(".m-card"),
          { y: 80, opacity: 0, rotateX: 18 },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            stagger: 0.1,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: { trigger: q(".m-grid")[0], start: "top 85%" },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="mediums"
      className="relative z-30 -mt-10 overflow-hidden rounded-t-[44px] bg-[#f3efe6] pb-28 pt-24 text-[#160e40]"
    >
      <div className="px-5 sm:px-8 lg:px-[4%]">
        <div className="mx-auto max-w-[1300px]">
          <div className="m-fade mb-10 flex items-center justify-between font-mono text-[12px] uppercase tracking-[0.18em] opacity-0">
            <span className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-orange" />
              Mediums
            </span>
            <span className="hidden text-[#160e40]/50 sm:inline">
              Brokers · Platforms
            </span>
          </div>

          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <h2 className="m-head text-[clamp(2.4rem,5.4vw,5rem)] font-semibold leading-[1] tracking-tight">
              <span className="block overflow-hidden pb-1">
                <span className="m-line block">The tools behind</span>
              </span>
              <span className="block overflow-hidden pb-2">
                <span className="m-line block text-orange">every trade.</span>
              </span>
            </h2>
            <p className="m-fade max-w-[420px] text-[clamp(1.05rem,1.4vw,1.25rem)] leading-snug text-[#160e40]/70 opacity-0">
              The brokers that fill my orders and the platforms where I read
              the market, chosen for speed, stability and clean charts.
            </p>
          </div>
        </div>
      </div>

      {/* marquee */}
      <div className="m-marquee mt-16 flex flex-col gap-3 overflow-hidden">
        <div className="m-row">
          <Row />
        </div>
        <div className="m-row">
          <Row outline />
        </div>
      </div>

      {/* grid */}
      <div className="mt-20 px-5 sm:px-8 lg:px-[4%]">
        <div className="m-grid mx-auto grid max-w-[1300px] gap-4 sm:grid-cols-2 lg:grid-cols-3 [perspective:1000px]">
          {MEDIUMS.map((m) => (
            <article
              key={m.name}
              className="m-card group relative overflow-hidden rounded-[28px] border border-[#160e40]/15 p-6 opacity-0 transition-colors duration-500 hover:border-[#160e40] hover:bg-[#160e40] hover:text-white"
            >
              <span className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-orange/0 blur-3xl transition-colors duration-500 group-hover:bg-orange/50" />
              <div className="relative flex items-start justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#160e40] font-display text-lg tracking-wide text-white transition-colors duration-500 group-hover:bg-orange">
                  {m.mono}
                </span>
                <span className="rounded-full border border-current/25 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.16em] opacity-60">
                  {m.kind}
                </span>
              </div>
              <h3 className="relative mt-14 font-display text-[clamp(2rem,3vw,2.8rem)] uppercase leading-none tracking-wide">
                {m.name}
              </h3>
              <p className="relative mt-3 max-w-[300px] text-[15px] leading-snug opacity-65">
                {m.note}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
