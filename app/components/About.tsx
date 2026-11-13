"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const STATEMENT =
  "Seven years ago I lost my first trade in under a minute. Today I read the same chart for what it really is: a record of people being fearful, greedy and late. I don't predict the market. I trade the moment it shows its hand.";

const HOT = new Set(["fearful,", "greedy", "late.", "hand."]);

const FACTS = [
  { label: "Style", text: "Price action and market structure" },
  { label: "Instruments", text: "Major pairs, gold and bitcoin" },
  { label: "Timeframes", text: "15-minute entries, daily bias" },
  { label: "Mindset", text: "Protect the capital, then grow it" },
];

/* placeholder figures: swap for the real numbers */
const YEARS = [
  { tag: "Surviving the curve", profit: 100, cap: 350 },
  { tag: "First steady results", profit: 620, cap: 500 },
  { tag: "Consistency kicks in", profit: 1900, cap: 900 },
  { tag: "Scaling position size", profit: 4800, cap: 1500 },
  { tag: "Compounding", profit: 9200, cap: 2800 },
  { tag: "Breakout year", profit: 15600, cap: 4500 },
  { tag: "Best year yet", profit: 25000, cap: 6000 },
];

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

const CURVE =
  "M0 182 L60 160 L110 172 L170 130 L230 144 L300 96 L350 114 L420 74 L470 98 L540 58 L600 82 L680 44 L740 64 L820 30 L880 50 L1000 12";

export default function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        /* manifesto: words light up as you read */
        gsap.fromTo(
          q(".stmt-word"),
          { opacity: 0.16 },
          {
            opacity: 1,
            stagger: 0.12,
            ease: "none",
            scrollTrigger: {
              trigger: q(".stmt")[0],
              start: "top 85%",
              end: "bottom 55%",
              scrub: true,
            },
          },
        );

        gsap.fromTo(
          q(".about-label"),
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: q(".about-label")[0], start: "top 90%" },
          },
        );

        /* portrait unveil + parallax */
        gsap.fromTo(
          q(".about-portrait"),
          { clipPath: "inset(14% 14% 14% 14% round 36px)", scale: 0.88 },
          {
            clipPath: "inset(0% 0% 0% 0% round 36px)",
            scale: 1,
            duration: 1.5,
            ease: "expo.out",
            scrollTrigger: { trigger: q(".about-portrait")[0], start: "top 82%" },
          },
        );
        gsap.fromTo(
          q(".about-img"),
          { yPercent: 8 },
          {
            yPercent: -4,
            ease: "none",
            scrollTrigger: {
              trigger: q(".about-portrait")[0],
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );

        /* heading + fact cards */
        gsap.fromTo(
          q(".about-head-line"),
          { yPercent: 110 },
          {
            yPercent: 0,
            stagger: 0.12,
            duration: 1.1,
            ease: "power4.out",
            scrollTrigger: { trigger: q(".about-head")[0], start: "top 85%" },
          },
        );
        gsap.fromTo(
          q(".about-fade"),
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: q(".about-head")[0], start: "top 70%" },
          },
        );
        gsap.fromTo(
          q(".fact"),
          { y: 70, opacity: 0, rotateX: 20 },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            stagger: 0.12,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: { trigger: q(".facts")[0], start: "top 88%" },
          },
        );

        /* seven years: pinned horizontal story, equity curve drawn in sync */
        const wrap = q(".hs")[0];
        const track = q(".track")[0];
        const curve = q(".curve")[0] as unknown as SVGPathElement;
        const dot = q(".curve-dot")[0] as HTMLElement;
        const label = q(".curve-year")[0] as HTMLElement;
        const price = q(".curve-price")[0] as HTMLElement | undefined;
        const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const len = curve.getTotalLength();
        const state = { p: 0 };
        const place = () => {
          const pt = curve.getPointAtLength(state.p * len);
          dot.style.left = `${(pt.x / 1000) * 100}%`;
          dot.style.top = `${(pt.y / 200) * 100}%`;
          label.textContent = `Year ${Math.min(7, Math.floor(state.p * 7) + 1)}`;
          if (price) {
            const f = state.p * (YEARS.length - 1);
            const i = Math.min(YEARS.length - 2, Math.floor(f));
            const v =
              YEARS[i].profit + (YEARS[i + 1].profit - YEARS[i].profit) * (f - i);
            price.textContent = money(v);
          }
        };
        place();

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: wrap,
            start: "top top",
            end: () => `+=${dist()}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        tl.to(track, { x: () => -dist() }, 0);
        tl.fromTo(curve, { strokeDashoffset: 1 }, { strokeDashoffset: 0 }, 0);
        tl.to(state, { p: 1, onUpdate: place }, 0);
        tl.fromTo(q(".area"), { opacity: 0 }, { opacity: 1 }, 0);
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(q(".curve"), { strokeDashoffset: 0 });
        gsap.set(q(".track"), { clearProps: "all" });
      });
    },
    { scope: root },
  );

  const words = STATEMENT.split(" ");

  return (
    <section ref={root} id="piperx" className="relative z-20">
      {/* ================= about ================= */}
      <div className="relative -mt-10 rounded-t-[44px] bg-[#f3efe6] px-5 pb-28 pt-24 text-[#160e40] sm:px-8 lg:px-[4%]">
        <div className="mx-auto max-w-[1300px]">
          <div className="about-label mb-10 flex items-center justify-between font-mono text-[12px] uppercase tracking-[0.18em] opacity-0">
            <span className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-orange" />
              About PiperX
            </span>
            <span className="hidden text-[#160e40]/50 sm:inline">
              Forex trader · 7+ years
            </span>
          </div>

          <p className="stmt text-[clamp(1.7rem,4.3vw,4rem)] font-semibold leading-[1.1] tracking-tight">
            {words.map((w, i) => (
              <span
                key={i}
                className={`stmt-word mr-[0.26em] inline-block ${
                  HOT.has(w) ? "text-orange" : ""
                }`}
              >
                {w}
              </span>
            ))}
          </p>

          <div className="mt-24 grid items-center gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            {/* portrait */}
            <div className="relative mx-auto w-full max-w-[520px]">
              <div className="about-portrait relative aspect-[4/5] overflow-hidden rounded-[36px] bg-[radial-gradient(100%_80%_at_50%_100%,#ef5f18_0%,#5b3bd6_45%,#261a66_100%)]">
                <div className="about-img absolute inset-x-0 bottom-0 h-[112%]">
                  <Image
                    src="/piperx.png"
                    alt="PiperX at work"
                    fill
                    sizes="(max-width: 1024px) 90vw, 520px"
                    className="object-contain object-bottom"
                  />
                </div>
              </div>
            </div>

            {/* copy + facts */}
            <div>
              <h3 className="about-head text-[clamp(2.2rem,4.6vw,4.2rem)] font-semibold leading-[1] tracking-tight">
                <span className="block overflow-hidden pb-1">
                  <span className="about-head-line block">Not a signal seller.</span>
                </span>
                <span className="block overflow-hidden pb-2">
                  <span className="about-head-line block text-orange">
                    A student of price.
                  </span>
                </span>
              </h3>

              <p className="about-fade mt-7 max-w-[640px] text-[clamp(1.2rem,1.8vw,1.55rem)] leading-[1.45] text-[#160e40]/80 opacity-0">
                Why do most traders lose? Because they chase. I did too: every
                green candle, every loud opinion, until the market taught me
                to slow down. Now I wait for price to come to my level, fix the
                risk before I click, and let the chart do the talking. No
                secret indicator. Just structure, patience and discipline.
              </p>

              <div className="facts mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {FACTS.map((f) => (
                  <div
                    key={f.label}
                    className="fact rounded-2xl border border-[#160e40]/15 bg-transparent p-5 opacity-0 transition-colors duration-300 hover:border-orange"
                  >
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-orange">
                      {f.label}
                    </p>
                    <p className="mt-2 text-[17px] font-medium leading-snug">
                      {f.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= seven years, pinned ================= */}
      <div className="hs relative flex h-svh min-h-[640px] flex-col justify-center overflow-hidden bg-[#120b36] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[10%] top-[10%] h-[60vmin] w-[60vmin] rounded-full bg-[radial-gradient(circle,rgba(239,95,24,0.35)_0%,transparent_65%)] blur-3xl"
        />

        <div className="relative px-5 sm:px-8 lg:px-[4%]">
          <div className="mx-auto flex max-w-[1300px] items-end justify-between gap-6">
            <h3 className="text-[clamp(2rem,4.4vw,4rem)] font-semibold leading-[1] tracking-tight">
              Seven years.
              <br />
              <span className="text-orange">On the record.</span>
            </h3>
            <p className="curve-year font-display text-[clamp(2rem,5vw,4.5rem)] leading-none text-white/25">
              Year 1
            </p>
          </div>

          {/* equity curve */}
          <div className="relative mx-auto mt-8 h-[22vh] max-w-[1300px]">
            <svg
              viewBox="0 0 1000 200"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
              aria-hidden
            >
              <defs>
                <linearGradient id="eqfill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef5f18" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#ef5f18" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="eqstroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8f7bff" />
                  <stop offset="100%" stopColor="#ef5f18" />
                </linearGradient>
              </defs>
              <line x1="0" x2="1000" y1="199" y2="199" stroke="rgba(255,255,255,0.15)" vectorEffect="non-scaling-stroke" />
              <path className="area" d={`${CURVE} L1000 200 L0 200 Z`} fill="url(#eqfill)" />
              <path
                className="curve"
                d={CURVE}
                fill="none"
                stroke="url(#eqstroke)"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1}
                vectorEffect="non-scaling-stroke"
                style={{ filter: "drop-shadow(0 0 8px rgba(239,95,24,0.7))" }}
              />
            </svg>
            <span className="curve-dot absolute left-0 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2">
              <span className="pulse-ring absolute inset-0 rounded-full bg-orange" />
              <span className="absolute inset-0 rounded-full bg-white shadow-[0_0_16px_4px_rgba(239,95,24,0.9)]" />
              <span className="absolute bottom-full left-1/2 mb-3 flex -translate-x-1/2 flex-col items-center">
                <span className="curve-price whitespace-nowrap rounded-full bg-orange px-3 py-1 font-mono text-[13px] font-semibold tabular-nums text-white shadow-[0_8px_24px_-6px_rgba(239,95,24,0.9)]">
                  $100
                </span>
                <span className="h-3 w-px bg-orange/70" />
              </span>
            </span>
          </div>
        </div>

        {/* cards */}
        <div className="track relative mt-10 flex w-max gap-5 px-5 sm:px-8 lg:px-[4%]">
          {YEARS.map((y, i) => (
            <article
              key={y.tag}
              className="relative flex h-[34vh] min-h-[250px] w-[min(78vw,380px)] flex-col justify-between overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">
                <span>Year {i + 1}</span>
                <span>{y.tag}</span>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">
                  Profit
                </p>
                <p className="font-display text-[clamp(2.8rem,4.4vw,4rem)] leading-none text-white">
                  {money(y.profit)}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[13px]">
                  <span className="text-white/50">Loss cap</span>
                  <span className="font-mono text-[#ff8f9b]">-{money(y.cap)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
