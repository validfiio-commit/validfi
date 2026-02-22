"use client";

import { useWallet } from "@/components/wallet-provider";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { Analytics } from "@vercel/analytics/next"

export default function Home() {
  const { address, connecting, connect } = useWallet();
  const router = useRouter();
  const revealRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (address) router.push("/dashboard");
  }, [address, router]);

  // Intersection observer for reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    revealRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Score bar animation
  useEffect(() => {
    if (!scoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll(".dim-fill").forEach((bar) => {
              bar.classList.add("animate");
            });
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(scoreRef.current);
    return () => observer.disconnect();
  }, []);

  // Nav scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const nav = document.getElementById("main-nav");
      if (nav) nav.classList.toggle("scrolled", window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  let revealIndex = 0;
  const addRevealRef = (el: HTMLDivElement | null) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const problemCards = [
    {
      num: "01",
      title: "No Validation Standard",
      desc: "Projects raise millions on hype alone. There's no institutional framework for evaluating Web3 ideas before capital is deployed.",
    },
    {
      num: "02",
      title: "Information Asymmetry",
      desc: "Investors rely on pitch decks and Twitter threads. Founders operate without market feedback until it's too late.",
    },
    {
      num: "03",
      title: "Reputation Is Unverifiable",
      desc: "Builder credibility is scattered across chains, platforms, and social media with no composable identity layer.",
    },
    {
      num: "04",
      title: "Execution Gaps Kill Projects",
      desc: "92% of Web3 startups fail not because of bad ideas, but because of poor execution strategy and misaligned tokenomics.",
    },
  ];

  const solutionItems = [
    {
      icon: "🎯",
      title: "5-Dimensional Scoring",
      desc: "Market viability, tokenomics health, technical feasibility, team capability, and competitive positioning-all quantified.",
    },
    {
      icon: "📋",
      title: "Execution Blueprint",
      desc: "Not just a score-a step-by-step roadmap with milestones, risk flags, and strategic recommendations.",
    },
    {
      icon: "🔗",
      title: "Onchain Score Card",
      desc: "Mint your validation as a verifiable NFT on Base. Shareable proof of due diligence for investors and partners.",
    },
    {
      icon: "🤖",
      title: "AI Advisory Layer",
      desc: "Post-validation AI advisor that answers follow-ups, stress-tests assumptions, and refines your strategy.",
    },
  ];

  const howSteps = [
    {
      num: "Step 01",
      icon: "🔐",
      title: "Connect Wallet",
      desc: "Link your wallet to establish your onchain identity. Your validation history builds your Web3 reputation.",
    },
    {
      num: "Step 02",
      icon: "📝",
      title: "Submit Your Idea",
      desc: "Describe your project, target market, tokenomics model, and competitive landscape. Our structured intake captures what matters.",
    },
    {
      num: "Step 03",
      icon: "⚡",
      title: "AI Validation",
      desc: "Our engine scores across 5 dimensions, maps competitors, stress-tests tokenomics, and generates your execution blueprint.",
    },
    {
      num: "Step 04",
      icon: "🎫",
      title: "Mint & Share",
      desc: "Receive your report, mint your score card as an NFT on Base, and share verifiable proof of validation with investors.",
    },
  ];

  const primitives = [
    {
      icon: "🧠",
      tag: "Intelligence",
      title: "Validation Engine",
      desc: "Multi-model AI pipeline that analyzes market dynamics, tokenomics viability, technical architecture, and team-market fit with institutional rigor.",
      bg: "bg-[rgba(0,240,255,0.06)]",
      border: "border-[rgba(0,240,255,0.15)]",
    },
    {
      icon: "⛓️",
      tag: "Identity",
      title: "Onchain Score Registry",
      desc: "Every validation minted as a soulbound NFT on Base. Composable reputation that follows you across the ecosystem.",
      bg: "bg-[rgba(168,85,247,0.06)]",
      border: "border-[rgba(168,85,247,0.2)]",
    },
    {
      icon: "📊",
      tag: "Framework",
      title: "5D Scoring Matrix",
      desc: "Proprietary five-dimensional evaluation model: Market, Tokenomics, Technical, Team, and Competitive-weighted and contextualized per vertical.",
      bg: "bg-[rgba(52,211,153,0.06)]",
      border: "border-[rgba(52,211,153,0.2)]",
    },
    {
      icon: "🗺️",
      tag: "Strategy",
      title: "Execution Blueprint",
      desc: "AI-generated go-to-market roadmap with milestone planning, risk matrices, resource allocation, and critical path analysis.",
      bg: "bg-[rgba(251,191,36,0.06)]",
      border: "border-[rgba(251,191,36,0.2)]",
    },
    {
      icon: "💬",
      tag: "Advisory",
      title: "AI Strategy Advisor",
      desc: "Post-validation conversational AI that stress-tests assumptions, answers follow-ups, and iterates on your strategy in real-time.",
      bg: "bg-[rgba(244,114,182,0.06)]",
      border: "border-[rgba(244,114,182,0.2)]",
    },
    {
      icon: "🔍",
      tag: "Intelligence",
      title: "Competitor Mapping",
      desc: "Automated landscape analysis that identifies direct and adjacent competitors, moats, and white-space opportunities in your vertical.",
      bg: "bg-[rgba(96,165,250,0.06)]",
      border: "border-[rgba(96,165,250,0.2)]",
    },
  ];

  const features = [
    {
      icon: "📈",
      title: "Tokenomics Stress Testing",
      desc: "Simulate token distribution scenarios, inflation curves, and liquidity dynamics. Our models flag unsustainable mechanisms before they become liabilities.",
      span: true,
    },
    {
      icon: "🛡️",
      title: "KYC-Verified Identity",
      desc: "Optional Elsa-powered identity verification that adds trust layers to your validation score and builder profile.",
      span: false,
    },
    {
      icon: "💬",
      title: "XMTP Messaging",
      desc: "Encrypted, wallet-to-wallet communication. Connect with advisors, investors, and collaborators without leaving the platform.",
      span: false,
    },
    {
      icon: "🏗️",
      title: "Launchpad Integration",
      desc: "Validated projects get fast-tracked to Moltlaunch. Your score card becomes your application-projects scoring above 80 receive priority listing.",
      span: true,
    },
    {
      icon: "📊",
      title: "Shareable Score Cards",
      desc: "Generate beautiful, verifiable score cards for your pitch deck, Twitter, and investor outreach. One link to prove diligence.",
      span: false,
    },
    {
      icon: "🔄",
      title: "Re-Validation",
      desc: "Ideas evolve. Re-submit as your project matures and build a validation history that shows progress over time.",
      span: false,
    },
    {
      icon: "🌐",
      title: "Multi-Chain Support",
      desc: "Score cards anchored on Base with future support for Ethereum, Solana, and Polygon. Your reputation travels everywhere.",
      span: false,
    },
  ];

  const poweredBy = [
    { name: "Elsa", letter: "E", bg: "rgba(0,240,255,0.1)", color: "#00f0ff" , icon: "/elsa.jpg", link: "https://www.heyelsa.ai/"},
    { name: "XMTP", letter: "X", bg: "rgba(93,63,211,0.15)", color: "#5d3fd3" , icon: "/xmtp_logo.jpg", link: "https://xmtp.org/"},
    { name: "Base", letter: "⬡", bg: "rgba(0,82,255,0.12)", color: "#0052ff" , icon: "/base_logo.jpg", link: "https://base.org/"},
    { name: "Moltlaunch", letter: "M", bg: "rgba(255,165,0,0.12)", color: "#ffa500" , icon: "/moltlaunch_logo.jpg", link: "https://moltlaunch.com/"},
    { name: "Gemini", letter: "✦", bg: "rgba(66,133,244,0.12)", color: "#4285f4" , icon: "/gemini_logo.jpg", link: "https://www.gemini.com/"},
  ];

  const scoreDimensions = [
    { label: "Market", value: 92 },
    { label: "Tokenomics", value: 84 },
    { label: "Technical", value: 88 },
    { label: "Team", value: 79 },
    { label: "Competitive", value: 91 },
  ];

  return (
    <>
    <Analytics />
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --bg: #06060a;
          --surface: #0c0c12;
          --surface-2: #111118;
          --border: rgba(255,255,255,0.06);
          --border-hover: rgba(255,255,255,0.12);
          --accent: #00f0ff;
          --accent-dim: rgba(0,240,255,0.08);
          --accent-border: rgba(0,240,255,0.15);
          --purple: #a855f7;
          --green: #34d399;
          --red: #f87171;
          --ivory: #e8e4dd;
          --ivory-muted: #9a9590;
          --ivory-dim: #5a5652;
        }

        body {
          font-family: 'DM Sans', system-ui, sans-serif;
          background: var(--bg);
          color: var(--ivory);
          -webkit-font-smoothing: antialiased;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0,240,255,0.15); }
          50% { box-shadow: 0 0 40px rgba(0,240,255,0.25); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes count-line {
          from { width: 0; }
          to { width: var(--target-width); }
        }
        @keyframes dot-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        .animate-fade-up {
          opacity: 0;
          animation: fadeUp 0.8s ease forwards;
        }
        .animate-d1 { animation-delay: 0.1s; }
        .animate-d2 { animation-delay: 0.2s; }
        .animate-d3 { animation-delay: 0.3s; }

        .reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-d1 { transition-delay: 0.1s; }
        .reveal-d2 { transition-delay: 0.2s; }
        .reveal-d3 { transition-delay: 0.3s; }
        .reveal-d4 { transition-delay: 0.4s; }

        #main-nav {
          transition: all 0.3s;
        }
        #main-nav.scrolled {
          padding-top: 0.6rem;
          padding-bottom: 0.6rem;
          background: rgba(6,6,10,0.95);
        }

        .gradient-text {
          background: linear-gradient(135deg, var(--accent), var(--purple), var(--accent));
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 4s ease infinite;
        }

        .dim-fill {
          width: 0;
          transition: width 1.5s ease;
        }
        .dim-fill.animate {
          width: var(--target-width);
        }

        .problem-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: #f87171;
          opacity: 0.6;
          border-radius: 0 3px 3px 0;
        }

        .primitive-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .primitive-card:hover::before {
          opacity: 1;
        }

        .cta-btn {
          animation: pulse-glow 3s ease infinite;
        }

        .score-dot {
          animation: dot-pulse 2s ease infinite;
        }
      `}</style>

      <div className="min-h-screen overflow-x-hidden">
        {/* ===== NAV ===== */}
        <nav
          id="main-nav"
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 bg-[rgba(6,6,10,0.8)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)]"
        >
          <a href="#" className="flex items-center gap-2.5">
            <img
              className="h-14 w-14 rounded-lg"
              src="/validfi_logo.PNG"
              alt="ValidFi"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            {/* <span className="text-lg font-bold tracking-tight">
              Valid<span className="text-[#00f0ff]">Fi</span>
            </span> */}
          </a>

          <ul className="hidden md:flex items-center gap-8 list-none">
            {["Problem", "Solution", "How", "Features", "Vision"].map((s) => (
              <li key={s}>
                <button
                  onClick={() => scrollTo(s.toLowerCase())}
                  className="text-[#9a9590] text-sm font-medium hover:text-[#e8e4dd] transition-colors bg-transparent border-none cursor-pointer"
                >
                  {s === "How" ? "How It Works" : s}
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={connect}
            disabled={connecting}
            className="px-6 py-2.5 rounded-lg bg-[#00f0ff] text-[#06060a] text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
          >
            {connecting ? "Connecting..." : "Validate Your Idea"}
          </button>
        </nav>

        {/* ===== HERO ===== */}
        <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32 pb-16 overflow-hidden">
          {/* Glows */}
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[radial-gradient(ellipse,rgba(0,240,255,0.06)_0%,transparent_60%)] pointer-events-none" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-[radial-gradient(ellipse,rgba(168,85,247,0.04)_0%,transparent_60%)] pointer-events-none" />
          {/* Grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
              maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
              WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
            }}
          />

          <h1
            className="relative z-10 text-[clamp(3.5rem,7vw,6rem)] font-normal leading-[1.05] tracking-tight mb-6 animate-fade-up"
            style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}
          >
            <span className="gradient-text">Validate. Mint. Execute.</span>
          </h1>

          <p className="relative z-10 text-lg text-[#9a9590] leading-relaxed max-w-[580px] mx-auto mb-10 animate-fade-up animate-d1">
            ValidFi is the validation layer for Web3. Submit your idea to receive an
            institutional-grade validation report, execution blueprint, and a verifiable
            score anchored permanently onchain.
          </p>

          <div className="relative z-10 flex items-center gap-4 flex-wrap justify-center animate-fade-up animate-d2">
            <button
              onClick={connect}
              disabled={connecting}
              className="cta-btn inline-flex items-center gap-3 px-10 py-4 rounded-lg bg-[#00f0ff] text-[#06060a] text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12V7H5a2 2 0 010-4h14v4" />
                <path d="M3 5v14a2 2 0 002 2h16v-5" />
                <path d="M18 12a2 2 0 000 4h4v-4h-4z" />
              </svg>
              {connecting ? "Connecting..." : "Validate Your Idea"}
            </button>
            <button
              onClick={() => scrollTo("how")}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-lg bg-transparent text-[#e8e4dd] text-sm font-semibold border border-[rgba(255,255,255,0.12)] hover:border-[rgba(0,240,255,0.15)] hover:bg-[rgba(0,240,255,0.08)] transition-all cursor-pointer"
            >
              How It Works →
            </button>
          </div>

          {/* Stats */}
          <div className="relative z-10 flex gap-12 mt-14 justify-center flex-wrap animate-fade-up animate-d3">
            {[
              ["5D", "Scoring Model"],
              ["NFT", "Score Card"],
              ["AI", "Powered Analysis"],
              ["Base", "Anchored Onchain"],
            ].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="font-mono text-2xl font-medium text-[#00f0ff]">{num}</div>
                <div className="text-xs text-[#5a5652] mt-1 uppercase tracking-[0.1em]">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== POWERED BY ===== */}
        <div className="py-12 border-t border-b border-[rgba(255,255,255,0.06)]">
          <div className="max-w-[1200px] mx-auto px-8">
            <p className="text-center text-[0.7rem] uppercase tracking-[0.2em] text-[#c6c6c6] font-semibold mb-8">
              Powered By
            </p>
            <div className="flex items-center justify-center gap-10 md:gap-16 flex-wrap">

              {poweredBy.map((p) => (
                <a href={p.link} target="_blank" rel="noopener noreferrer" key={p.name} className="flex items-center gap-2 opacity-100 hover:opacity-70 transition-opacity">
                  <div
                    key={p.name}
                    className="flex items-center gap-2 opacity-100 hover:opacity-70 transition-opacity"
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold"
                      style={{ background: p.bg, color: p.color }}
                    >
                      <img src={p.icon} alt={p.name} className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      {/* {p.letter} */}
                    </div>
                  </div>
                  <span className="text-[0.95rem] font-semibold text-[#c6c6c6]">{p.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ===== PROBLEM ===== */}
        <section id="problem" className="py-28" style={{ background: "linear-gradient(180deg, #06060a 0%, #0c0c12 100%)" }}>
          <div className="max-w-[1200px] mx-auto px-8">
            <div ref={addRevealRef} className="reveal">
              <div className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-[#00f0ff] font-semibold mb-5 font-mono">
                <span className="block w-5 h-px bg-[#00f0ff]" />
                The Problem
              </div>
              <h2
                className="text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.1] tracking-tight mb-4"
                style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}
              >
                Web3 is building blind
              </h2>
              <p className="text-[1.05rem] text-[#9a9590] leading-relaxed max-w-[560px]">
                The crypto ecosystem has no standardized way to evaluate ideas before millions are
                raised and burned.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mt-12">
              <div className="flex flex-col gap-4">
                {problemCards.map((card, i) => (
                  <div
                    key={card.num}
                    ref={addRevealRef}
                    className={`reveal reveal-d${i + 1} problem-card relative p-6 rounded-xl bg-[#111118] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(248,113,113,0.15)] hover:bg-[rgba(248,113,113,0.03)] transition-all overflow-hidden`}
                  >
                    <div className="font-mono text-[0.7rem] text-[#f87171] mb-2 opacity-70">{card.num}</div>
                    <h4 className="text-[0.95rem] font-semibold mb-1">{card.title}</h4>
                    <p className="text-[0.85rem] text-[#9a9590] leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>

              <div ref={addRevealRef} className="reveal reveal-d3 flex flex-col items-center justify-center">
                <div
                  className="text-[7rem] leading-none mb-2"
                  style={{
                    fontFamily: "Instrument Serif, Georgia, serif",
                    fontStyle: "italic",
                    background: "linear-gradient(135deg, #f87171, #ff6b6b)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  92%
                </div>
                <p className="text-base text-[#9a9590] text-center max-w-[280px] leading-relaxed">
                  of Web3 projects fail within the first 18 months due to preventable execution errors
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SOLUTION ===== */}
        <section id="solution" className="py-28 bg-[#06060a]">
          <div className="max-w-[1200px] mx-auto px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Content */}
              <div>
                <div ref={addRevealRef} className="reveal">
                  <div className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-[#00f0ff] font-semibold mb-5 font-mono">
                    <span className="block w-5 h-px bg-[#00f0ff]" />
                    The Solution
                  </div>
                  <h2
                    className="text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.1] tracking-tight mb-4"
                    style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}
                  >
                    An institutional-grade
                    <br />
                    validation engine for Web3
                  </h2>
                  <p className="text-[1.05rem] text-[#9a9590] leading-relaxed max-w-[560px]">
                    ValidFi combines AI analysis, onchain identity, and structured frameworks to give
                    every builder the due diligence they deserve-before they ship.
                  </p>
                </div>

                <div className="flex flex-col gap-6 mt-8">
                  {solutionItems.map((item, i) => (
                    <div
                      key={item.title}
                      ref={addRevealRef}
                      className={`reveal reveal-d${i + 1} flex gap-4 items-start`}
                    >
                      <div className="shrink-0 w-10 h-10 rounded-[10px] bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.15)] flex items-center justify-center text-base">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="text-[0.95rem] font-semibold mb-1">{item.title}</h4>
                        <p className="text-[0.85rem] text-[#9a9590] leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score Card Visual */}
              <div ref={addRevealRef} className="reveal">
                <div className="relative bg-[#0c0c12] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 overflow-hidden">
                  <div className="absolute top-[-50%] right-[-50%] w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(0,240,255,0.06)_0%,transparent_70%)] pointer-events-none" />

                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-[rgba(255,255,255,0.06)]">
                    <span className="font-semibold text-[0.95rem]">DeFi Protocol Alpha</span>
                    <span className="font-mono text-2xl font-medium text-[#00f0ff]">87/100</span>
                  </div>

                  <div ref={scoreRef} className="flex flex-col gap-3">
                    {scoreDimensions.map((dim) => (
                      <div key={dim.label} className="flex items-center gap-3">
                        <span className="text-xs text-[#9a9590] w-20 shrink-0">{dim.label}</span>
                        <div className="flex-1 h-1.5 bg-[#111118] rounded-full overflow-hidden">
                          <div
                            className="dim-fill h-full rounded-full bg-[#00f0ff]"
                            style={{ "--target-width": `${dim.value}%` } as React.CSSProperties}
                          />
                        </div>
                        <span className="font-mono text-xs text-[#5a5652] w-7 text-right">
                          {dim.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)] flex justify-between items-center">
                    <div className="flex items-center gap-1.5 font-mono text-[0.7rem] text-[#5a5652]">
                      <span className="score-dot w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                      Anchored on Base
                    </div>
                    <div className="font-mono text-[0.7rem] text-[#00f0ff] uppercase tracking-[0.1em]">
                      NFT Minted ✓
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section
          id="how"
          className="py-28"
          style={{ background: "linear-gradient(180deg, #06060a 0%, #0c0c12 50%, #06060a 100%)" }}
        >
          <div className="max-w-[1200px] mx-auto px-8">
            <div ref={addRevealRef} className="reveal text-center">
              <div className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-[#00f0ff] font-semibold mb-5 font-mono justify-center">
                <span className="block w-5 h-px bg-[#00f0ff]" />
                How It Works
              </div>
              <h2
                className="text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.1] tracking-tight mb-4"
                style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}
              >
                Four steps to validated conviction
              </h2>
              <p className="text-[1.05rem] text-[#9a9590] leading-relaxed max-w-[560px] mx-auto">
                From raw idea to verifiable, onchain proof of validation in under five minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              {howSteps.map((step, i) => (
                <div
                  key={step.num}
                  ref={addRevealRef}
                  className={`reveal reveal-d${i + 1} bg-[#111118] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 hover:border-[rgba(0,240,255,0.15)] hover:-translate-y-1 transition-all`}
                >
                  <div className="font-mono text-[0.65rem] text-[#00f0ff] uppercase tracking-[0.15em] mb-5">
                    {step.num}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.15)] flex items-center justify-center text-xl mb-5">
                    {step.icon}
                  </div>
                  <h4 className="text-base font-semibold mb-2">{step.title}</h4>
                  <p className="text-[0.85rem] text-[#9a9590] leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CORE PRIMITIVES ===== */}
        <section id="primitives" className="py-28 bg-[#06060a]">
          <div className="max-w-[1200px] mx-auto px-8">
            <div ref={addRevealRef} className="reveal text-center">
              <div className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-[#00f0ff] font-semibold mb-5 font-mono justify-center">
                <span className="block w-5 h-px bg-[#00f0ff]" />
                Core Primitives
              </div>
              <h2
                className="text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.1] tracking-tight mb-4"
                style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}
              >
                The building blocks of validated conviction
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {primitives.map((p, i) => (
                <div
                  key={p.title}
                  ref={addRevealRef}
                  className={`reveal reveal-d${(i % 3) + 1} primitive-card relative bg-[#0c0c12] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 hover:border-[rgba(0,240,255,0.15)] hover:-translate-y-0.5 transition-all overflow-hidden`}
                >
                  <div className={`w-11 h-11 rounded-[10px] ${p.bg} border ${p.border} flex items-center justify-center text-xl mb-5`}>
                    {p.icon}
                  </div>
                  <div className="inline-block font-mono text-[0.65rem] px-2 py-0.5 rounded bg-[rgba(0,240,255,0.08)] text-[#00f0ff] mb-3 uppercase tracking-[0.1em]">
                    {p.tag}
                  </div>
                  <h4 className="text-base font-semibold mb-2">{p.title}</h4>
                  <p className="text-[0.85rem] text-[#9a9590] leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FEATURES ===== */}
        <section
          id="features"
          className="py-28"
          style={{ background: "linear-gradient(180deg, #06060a 0%, #0c0c12 100%)" }}
        >
          <div className="max-w-[1200px] mx-auto px-8">
            <div ref={addRevealRef} className="reveal text-center">
              <div className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-[#00f0ff] font-semibold mb-5 font-mono justify-center">
                <span className="block w-5 h-px bg-[#00f0ff]" />
                Features
              </div>
              <h2
                className="text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.1] tracking-tight mb-4"
                style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}
              >
                Everything you need to ship with confidence
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {features.map((f, i) => (
                <div
                  key={f.title}
                  ref={addRevealRef}
                  className={`reveal reveal-d${(i % 3) + 1} bg-[#111118] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.02)] transition-all ${
                    f.span ? "md:col-span-2 lg:col-span-2" : ""
                  }`}
                >
                  <div className="text-2xl mb-4">{f.icon}</div>
                  <h4 className="text-base font-semibold mb-2">{f.title}</h4>
                  <p className="text-[0.85rem] text-[#9a9590] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== VISION ===== */}
        <section id="vision" className="py-28 bg-[#06060a] text-center">
          <div className="max-w-[1200px] mx-auto px-8">
            <div ref={addRevealRef} className="reveal max-w-[700px] mx-auto">
              <div className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-[#00f0ff] font-semibold mb-5 font-mono justify-center">
                <span className="block w-5 h-px bg-[#00f0ff]" />
                The Vision
              </div>
              <h2
                className="text-[clamp(2.5rem,5vw,3.8rem)] leading-[1.1] tracking-tight mb-6"
                style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}
              >
                Becoming the{" "}
                <span className="text-[#00f0ff]">Moody&apos;s of Web3</span>
              </h2>
              <p className="text-lg text-[#9a9590] leading-relaxed mb-8">
                We&apos;re building the standard validation infrastructure for the decentralized
                economy. Every project should have a ValidFi score before raising a single dollar.
                Every investor should have verifiable data before deploying capital. Every builder
                deserves institutional-grade feedback regardless of pedigree.
              </p>
              <p className="text-base text-[#5a5652] leading-relaxed">
                ValidFi transforms validation from a gatekept process into a permissionless public
                good - powered by AI, verified onchain, and composable across the entire Web3 stack.
              </p>
            </div>

            <div
              ref={addRevealRef}
              className="reveal reveal-d2 flex justify-center gap-16 mt-12 flex-wrap"
            >
              {[
                ["$47B", "Lost to failed projects (2020–24)"],
                ["∞", "Permissionless access"],
                ["0→1", "Category creator"],
              ].map(([num, label]) => (
                <div key={label} className="text-center">
                  <div
                    className="text-5xl text-[#00f0ff] leading-none"
                    style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}
                  >
                    {num}
                  </div>
                  <div className="text-[0.8rem] text-[#5a5652] mt-1 uppercase tracking-[0.1em]">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section id="cta" className="py-32 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,rgba(0,240,255,0.06)_0%,rgba(168,85,247,0.03)_40%,transparent_70%)] pointer-events-none" />

          <div className="max-w-[1200px] mx-auto px-8 relative z-10">
            <div ref={addRevealRef} className="reveal">
              <h2
                className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] tracking-tight mb-4"
                style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}
              >
                Stop guessing.
                <br />
                <span className="gradient-text">Start validating.</span>
              </h2>
              <p className="text-lg text-[#9a9590] max-w-[480px] mx-auto mb-10 leading-relaxed">
                Connect your wallet, submit your idea, and get your validation report in under five
                minutes. Your score card awaits.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <button
                  onClick={connect}
                  disabled={connecting}
                  className="cta-btn inline-flex items-center gap-3 px-12 py-4 rounded-lg bg-[#00f0ff] text-[#06060a] text-base font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12V7H5a2 2 0 010-4h14v4" />
                    <path d="M3 5v14a2 2 0 002 2h16v-5" />
                    <path d="M18 12a2 2 0 000 4h4v-4h-4z" />
                  </svg>
                  {connecting ? "Connecting..." : "Validate Your Idea"}
                </button>
                {/* <button className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-transparent text-[#e8e4dd] text-base font-semibold border border-[rgba(255,255,255,0.12)] hover:border-[rgba(0,240,255,0.15)] hover:bg-[rgba(0,240,255,0.08)] transition-all cursor-pointer">
                  Read the Docs →
                </button> */}
              </div>
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="border-t border-[rgba(255,255,255,0.06)] pt-16 pb-8 bg-[#06060a]">
          <div className="max-w-[1200px] mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <img
                    src="/validfi_logo.PNG"
                    alt="ValidFi"
                    className="h-14 w-14 rounded-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  {/* <span className="text-lg font-bold">
                    Valid<span className="text-[#00f0ff]">Fi</span>
                  </span> */}
                </div>
                <p className="text-[0.85rem] text-[#9a9590] leading-relaxed max-w-[280px]">
                  The validation layer for Web3. Institutional-grade idea validation, powered by AI,
                  anchored onchain.
                </p>
              </div>

              {[
                {
                  title: "Product",
                  links: ["How It Works", "Features", "Core Primitives"],
                },
                {
                  title: "Ecosystem",
                  links: ["Elsa (KYC)", "XMTP (Messaging)", "Base (Chain)", "Moltlaunch", "Gemini (AI)"],
                }
              ].map((col) => (
                <div key={col.title}>
                  <h5 className="text-[0.7rem] uppercase tracking-[0.15em] text-[#c6c6c6] font-semibold mb-4">
                    {col.title}
                  </h5>
                  {col.links.map((link) => (
                    <a
                      key={link}
                      href="#"
                      className="block text-[0.85rem] text-[#9a9590] hover:text-[#c6c6c6] transition-colors mb-2.5"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              ))}
            </div>

            <div className="border-t border-[rgba(255,255,255,0.06)] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs text-[#5a5652]">© 2025 ValidFi. All rights reserved.</p>
              <div className="flex gap-6">
                {["Twitter", "Discord", "GitHub", "Farcaster"].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="text-[0.8rem] text-[#5a5652] hover:text-[#00f0ff] transition-colors"
                  >
                    {social}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
