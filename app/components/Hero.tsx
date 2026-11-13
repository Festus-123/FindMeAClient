"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/* ---------- deterministic data (same on server + client) ---------- */

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Jagged, trending-up price line, like a live chart. */
function buildChart() {
  const rand = rng(7);
  const W = 1440;
  const H = 320;
  const n = 56;
  const pts: [number, number][] = [];
  let y = 270;
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * W;
    const trend = -2.6;
    const swing = (rand() - 0.46) * 64;
    y = Math.min(290, Math.max(40, y + trend + swing * 0.75));
    pts.push([r1(x), r1(y)]);
  }
  const line = pts.map(([x, py], i) => `${i ? "L" : "M"}${x} ${py}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  return { line, area, W, H };
}

function buildSpark(seed: number, up: boolean) {
  const rand = rng(seed);
  const n = 22;
  let y = up ? 26 : 8;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    y = Math.min(30, Math.max(3, y + (up ? -0.7 : 0.7) + (rand() - 0.5) * 8));
    pts.push(`${i ? "L" : "M"}${r1((i / (n - 1)) * 100)} ${r1(y)}`);
  }
  return pts.join(" ");
}

const CHART = buildChart();

type Pair = {
  symbol: string;
  name: string;
  code: "XAU" | "BTC";
  dec: number;
  seed: number;
  pos: string;
  depth: number;
};

const PAIRS: Pair[] = [
  {
    symbol: "XAUUSD",
    name: "Gold / US Dollar",
    code: "XAU",
    dec: 2,
    seed: 11,
    pos: "left-[4%] top-[17%] hidden lg:block",
    depth: 22,
  },
  {
    symbol: "BTCUSD",
    name: "Bitcoin / US Dollar",
    code: "BTC",
    dec: 2,
    seed: 31,
    pos: "right-[2.5%] top-[43%] hidden lg:block",
    depth: 48,
  },
];

const LINKS = [
  { label: "PiperX", href: "#piperx" },
  { label: "Mediums", href: "#mediums" },
  { label: "Trades", href: "#trades" },
  { label: "Contact", href: "#contact" },
];

const TITLE = "PIPERX".split("");

/* ---------- component ---------- */

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      /* reduced motion: show everything, no movement */
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(q("[data-reveal]"), { opacity: 1, clearProps: "transform" });
        gsap.set(q(".chart-line"), { strokeDashoffset: 0 });
        const c = q("[data-count]")[0];
        if (c) c.textContent = "7";
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

        /* ambience */
        tl.fromTo(
          q(".glow"),
          { opacity: 0, scale: 0.5 },
          { opacity: 1, scale: 1, duration: 2.2, ease: "power3.out" },
          0,
        );

        /* nav */
        tl.fromTo(
          q(".nav-item"),
          { y: -28, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, stagger: 0.07 },
          0.35,
        );

        /* giant wordmark, letter by letter */
        tl.fromTo(
          q(".title-letter"),
          { yPercent: 115, rotate: 7, opacity: 0 },
          {
            yPercent: 0,
            rotate: 0,
            opacity: 1,
            duration: 1.5,
            stagger: 0.09,
            ease: "expo.out",
          },
          0.2,
        );

        /* portrait unveils upward */
        tl.fromTo(
          q(".portrait-clip"),
          { clipPath: "inset(100% 0% 0% 0%)", opacity: 1 },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.7, ease: "expo.inOut" },
          0.55,
        );
        tl.fromTo(
          q(".portrait-img"),
          { scale: 1.35, y: 70 },
          { scale: 1, y: 0, duration: 2.1, ease: "power3.out" },
          0.55,
        );

        /* chart draws itself */
        tl.fromTo(
          q(".chart-line"),
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 2.8, ease: "power2.inOut" },
          0.8,
        );
        tl.fromTo(
          q(".chart-area"),
          { opacity: 0 },
          { opacity: 1, duration: 2, ease: "power1.out" },
          1.6,
        );
        tl.fromTo(
          q(".grid-line"),
          { scaleX: 0 },
          {
            scaleX: 1,
            transformOrigin: "left center",
            duration: 1.6,
            stagger: 0.1,
          },
          0.6,
        );

        /* copy */
        tl.fromTo(
          q(".copy-chip"),
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 1 },
          1.5,
        );
        tl.fromTo(
          q(".copy-word"),
          { yPercent: 120, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 1.1, stagger: 0.07 },
          1.6,
        );
        tl.fromTo(
          q(".copy-fade"),
          { y: 26, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, stagger: 0.12 },
          2.0,
        );

        /* glass cards fly in, then float forever */
        tl.fromTo(
          q(".pair-card"),
          { y: 90, opacity: 0, scale: 0.82, rotateX: 28, rotateZ: -4 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            rotateX: 0,
            rotateZ: 0,
            duration: 1.5,
            stagger: 0.18,
            ease: "back.out(1.5)",
          },
          1.7,
        );
        tl.fromTo(
          q(".spark"),
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 1.8, stagger: 0.18, ease: "power2.inOut" },
          2.1,
        );

        /* 7+ counter */
        const counter = { v: 0 };
        tl.to(
          counter,
          {
            v: 7,
            duration: 1.8,
            ease: "power3.out",
            onUpdate: () => {
              const el = q("[data-count]")[0];
              if (el) el.textContent = String(Math.round(counter.v));
            },
          },
          2.1,
        );

        /* idle: floating cards */
        q(".pair-card").forEach((el, i) => {
          gsap.to(el, {
            y: i % 2 ? 14 : -14,
            rotateZ: i % 2 ? -1.2 : 1.2,
            duration: 3.4 + i * 0.6,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: 3.2 + i * 0.3,
          });
        });

        /* idle: glow breathes */
        gsap.to(q(".glow-orange"), {
          scale: 1.18,
          opacity: 0.75,
          duration: 4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });

        /* idle: marker rides the price line */
        const path = q(".chart-line")[0] as unknown as SVGPathElement | undefined;
        const dot = q(".chart-dot")[0] as HTMLElement | undefined;
        if (path && dot) {
          const len = path.getTotalLength();
          const state = { p: 0 };
          const place = () => {
            const pt = path.getPointAtLength(state.p * len);
            dot.style.left = `${(pt.x / CHART.W) * 100}%`;
            dot.style.top = `${(pt.y / CHART.H) * 100}%`;
          };
          place();
          tl.fromTo(dot, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.6 }, 3.4);
          gsap.to(state, {
            p: 1,
            duration: 11,
            ease: "none",
            repeat: -1,
            repeatDelay: 0.8,
            delay: 3.4,
            onUpdate: place,
          });
        }

        /* live prices (gold-api.com, polled); sparkline built from live samples */
        const samples: Record<string, number[]> = { XAU: [], BTC: [] };
        const fmt = (n: number, dec: number) =>
          n.toLocaleString("en-US", {
            minimumFractionDigits: dec,
            maximumFractionDigits: dec,
          });
        let alive = true;
        const poll = () =>
          Promise.all(
            PAIRS.map(async (pair) => {
              try {
                const res = await fetch(
                  `https://api.gold-api.com/price/${pair.code}`,
                  { cache: "no-store" },
                );
                if (!res.ok) return;
                const { price } = (await res.json()) as { price: number };
                if (!alive || typeof price !== "number") return;
                const list = samples[pair.code];
                const prev = list[list.length - 1];
                list.push(price);
                if (list.length > 28) list.shift();

                const card = q(`[data-code="${pair.code}"]`)[0];
                const priceEl = card?.querySelector<HTMLElement>("[data-price]");
                const spark = card?.querySelector<SVGPathElement>(".spark");
                if (!priceEl) return;
                priceEl.textContent = `$${fmt(price, pair.dec)}`;
                if (prev !== undefined && prev !== price) {
                  gsap.fromTo(
                    priceEl,
                    { color: price > prev ? "#3ddc97" : "#ff5d6c" },
                    { color: "#ffffff", duration: 1.2, ease: "power2.out" },
                  );
                }
                if (spark && list.length > 1) {
                  const lo = Math.min(...list);
                  const span = Math.max(...list) - lo || 1;
                  spark.setAttribute(
                    "d",
                    list
                      .map(
                        (v, i) =>
                          `${i ? "L" : "M"}${r1((i / (list.length - 1)) * 100)} ${r1(30 - ((v - lo) / span) * 26)}`,
                      )
                      .join(" "),
                  );
                  spark.style.strokeDashoffset = "0";
                  spark.setAttribute(
                    "stroke",
                    list[list.length - 1] >= list[0] ? "#3ddc97" : "#ff5d6c",
                  );
                }
              } catch {
                /* network hiccup: keep the last price on screen */
              }
            }),
          );
        poll();
        const tick = window.setInterval(poll, 8000);

        /* mouse parallax (fine pointers only) */
        const section = root.current;
        const fine = window.matchMedia("(pointer: fine)").matches;
        let move: ((e: MouseEvent) => void) | undefined;
        let leave: (() => void) | undefined;
        if (section && fine) {
          const layers = q("[data-depth]").map((el) => ({
            x: gsap.quickTo(el, "x", { duration: 1.1, ease: "power3.out" }),
            y: gsap.quickTo(el, "y", { duration: 1.1, ease: "power3.out" }),
            d: parseFloat((el as HTMLElement).dataset.depth ?? "0"),
          }));
          move = (e) => {
            const nx = e.clientX / window.innerWidth - 0.5;
            const ny = e.clientY / window.innerHeight - 0.5;
            layers.forEach((l) => {
              l.x(-nx * l.d);
              l.y(-ny * l.d * 0.6);
            });
          };
          leave = () => layers.forEach((l) => (l.x(0), l.y(0)));
          section.addEventListener("mousemove", move);
          section.addEventListener("mouseleave", leave);
        }

        return () => {
          alive = false;
          window.clearInterval(tick);
          if (section && move) section.removeEventListener("mousemove", move);
          if (section && leave) section.removeEventListener("mouseleave", leave);
        };
      });
    },
    { scope: root },
  );

  const tagline = ["I", "read", "price,", "not", "noise."];

  return (
    <section
      ref={root}
      id="home"
      className="grain relative isolate h-svh min-h-[720px] w-full overflow-hidden bg-[#0b0720] text-white"
    >
      {/* ---------- background ---------- */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_50%_0%,#2f2080_0%,#1a1048_45%,#0b0720_100%)]"
      />
      <div
        aria-hidden
        data-reveal
        className="glow glow-orange pointer-events-none absolute left-1/2 top-[34%] -z-10 h-[62vmin] w-[62vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(239,95,24,0.85)_0%,rgba(239,95,24,0.25)_42%,transparent_70%)] opacity-0 blur-2xl"
      />
      <div
        aria-hidden
        data-reveal
        className="glow pointer-events-none absolute -left-[10%] bottom-[-20%] -z-10 h-[70vmin] w-[70vmin] rounded-full bg-[radial-gradient(circle,rgba(97,70,230,0.55)_0%,transparent_65%)] opacity-0 blur-3xl"
      />

      {/* ---------- chart ---------- */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[42vh] min-h-[240px]"
      >
        <svg
          viewBox={`0 0 ${CHART.W} ${CHART.H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          <defs>
            <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef5f18" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#ef5f18" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8f7bff" />
              <stop offset="55%" stopColor="#ff8a4c" />
              <stop offset="100%" stopColor="#ef5f18" />
            </linearGradient>
          </defs>
          {[0.2, 0.45, 0.7, 0.92].map((f) => (
            <line
              key={f}
              className="grid-line"
              x1="0"
              x2={CHART.W}
              y1={CHART.H * f}
              y2={CHART.H * f}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="4 8"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path
            className="chart-area opacity-0"
            d={CHART.area}
            fill="url(#area)"
            data-reveal
          />
          <path
            className="chart-line"
            d={CHART.line}
            fill="none"
            stroke="url(#stroke)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1}
            vectorEffect="non-scaling-stroke"
            style={{ filter: "drop-shadow(0 0 10px rgba(239,95,24,0.7))" }}
          />
        </svg>
        <span
          className="chart-dot absolute left-0 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 opacity-0"
        >
          <span className="pulse-ring absolute inset-0 rounded-full bg-orange" />
          <span className="absolute inset-0 rounded-full bg-white shadow-[0_0_16px_4px_rgba(239,95,24,0.9)]" />
        </span>
      </div>

      {/* ---------- nav ---------- */}
      <header className="absolute inset-x-0 top-0 z-40 mx-auto flex max-w-[1500px] items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <a
          href="#home"
          data-reveal
          className="nav-item flex items-center gap-2.5 opacity-0"
          aria-label="PiperX home"
        >
          <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
            <path d="M4 5h24l-4 7H8z" fill="#ef5f18" />
            <path d="M4 14h17l-4 7h-5v7H4z" fill="#fff" />
          </svg>
          <span className="text-lg font-semibold tracking-tight">
            Piper<span className="text-orange">X</span>
          </span>
        </a>

        <nav
          data-reveal
          className="nav-item glass hidden items-center gap-1 rounded-full p-1.5 opacity-0 md:flex"
        >
          {LINKS.map((l, i) => (
            <a
              key={l.label}
              href={l.href}
              className={`rounded-full px-4 py-2 text-[13px] transition-colors hover:bg-white/15 ${
                i === 0 ? "bg-white/15 text-white" : "text-white/70"
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a
          href="#contact"
          data-reveal
          className="nav-item rounded-full bg-white px-5 py-2.5 text-[13px] font-medium text-[#160e40] opacity-0 transition hover:bg-orange hover:text-white"
        >
          Get in touch
        </a>
      </header>

      {/* ---------- giant wordmark ---------- */}
      <div
        data-depth="14"
        className="absolute inset-x-0 top-[13vh] z-[6] flex justify-center"
      >
        <h1
          aria-label="PiperX"
          className="flex font-display leading-[0.9] tracking-[0.01em] [font-size:min(30vw,52vh)]"
        >
          {TITLE.map((c, i) => (
            <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.04em]">
              <span data-reveal className="title-letter hero-title inline-block opacity-0">
                {c}
              </span>
            </span>
          ))}
        </h1>
      </div>

      {/* ---------- portrait ---------- */}
      <div
        data-depth="26"
        className="pointer-events-none absolute inset-x-0 bottom-[27vh] z-10 flex justify-center sm:bottom-0"
      >
        <div
          data-reveal
          className="portrait-clip relative aspect-square h-[min(60vh,112vw)] sm:h-[min(88vh,118vw)] opacity-0"
          style={{
            maskImage: "linear-gradient(to bottom, #000 74%, transparent 99%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, #000 74%, transparent 99%)",
          }}
        >
          <Image
            src="/piperx.png"
            alt="PiperX, professional forex trader"
            fill
            priority
            sizes="(max-width: 768px) 118vw, 88vh"
            className="portrait-img object-contain object-bottom"
          />
        </div>
      </div>

      {/* ---------- floating glass quotes ---------- */}
      {PAIRS.map((p) => (
        <div
          key={p.symbol}
          data-depth={p.depth}
          className={`absolute z-20 [perspective:800px] ${p.pos}`}
        >
          <div
            data-reveal
            data-code={p.code}
            className="pair-card glass w-[220px] rounded-2xl p-4 opacity-0"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] font-semibold tracking-wide">
                  {p.symbol}
                </p>
                <p className="text-[10.5px] text-white/55">{p.name}</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-black/25 px-2 py-0.5 font-mono text-[10px] tracking-wider text-white/80">
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span className="pulse-ring absolute inset-0 rounded-full bg-[#3ddc97]" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-[#3ddc97]" />
                </span>
                LIVE
              </span>
            </div>
            <p
              data-price
              className="mt-3 font-mono text-[22px] font-medium tabular-nums"
            >
              $––
            </p>
            <svg
              viewBox="0 0 100 34"
              preserveAspectRatio="none"
              className="mt-2 h-8 w-full overflow-visible"
            >
              <path
                className="spark"
                d={buildSpark(p.seed, true)}
                fill="none"
                stroke="#8f7bff"
                strokeWidth="1.6"
                strokeLinejoin="round"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>
      ))}

      {/* ---------- copy (bottom-left) ---------- */}
      <div className="absolute bottom-[7vh] left-5 z-30 max-w-[min(440px,88vw)] sm:left-8 lg:left-[4%]">
        <div
          data-reveal
          className="copy-chip glass mb-5 inline-flex items-center gap-2.5 rounded-full py-1.5 pl-2 pr-4 text-[12px] opacity-0"
        >
          <span className="rounded-full bg-orange px-2.5 py-0.5 font-semibold">
            Forex Trader
          </span>
          <span className="text-white/80">
            <span data-count>7</span>+ years in the markets
          </span>
        </div>

        <h2 className="text-[clamp(1.9rem,3.6vw,3.2rem)] font-semibold leading-[1.02] tracking-tight">
          {tagline.map((w, i) => (
            <span key={i} className="mr-[0.25em] inline-block overflow-hidden align-bottom">
              <span
                data-reveal
                className={`copy-word inline-block opacity-0 ${
                  w === "noise." ? "text-orange" : ""
                }`}
              >
                {w}
              </span>
            </span>
          ))}
        </h2>

        <div data-reveal className="copy-fade mt-6 flex flex-wrap gap-3 opacity-0">
          <a
            href="#piperx"
            className="group inline-flex items-center gap-2 rounded-full bg-orange px-6 py-3 text-[14px] font-medium shadow-[0_10px_30px_-8px_rgba(239,95,24,0.8)] transition hover:-translate-y-0.5 hover:bg-[#ff7433]"
          >
            View my approach
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
          <a
            href="#contact"
            className="glass rounded-full px-6 py-3 text-[14px] font-medium transition hover:bg-white/20"
          >
            Book a session
          </a>
        </div>
      </div>
    </section>
  );
}
