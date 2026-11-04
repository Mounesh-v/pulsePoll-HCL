import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Globe2,
  Radio,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import HeroPollIllustration from "../components/hero/HeroPollIllustration";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/useAuth";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Radio,
    title: "Live results",
    description:
      "Votes arrive over WebSockets and charts move instantly, without a single refresh.",
  },
  {
    icon: Zap,
    title: "Fast by design",
    description:
      "Redis-backed counters keep every tally quick when a poll suddenly takes off.",
  },
  {
    icon: ShieldCheck,
    title: "One vote each",
    description:
      "Each voter gets one vote, backed by anonymous tokens that block repeats.",
  },
  {
    icon: Globe2,
    title: "Share anywhere",
    description:
      "Every poll gets a public link, so anyone can vote from any device.",
  },
];

const steps = [
  {
    title: "Create your poll",
    description:
      "Write a clear question, add up to six answer options, and publish in seconds.",
  },
  {
    title: "Share the link",
    description:
      "Send the public poll link to your team, community, classroom, or audience.",
  },
  {
    title: "Watch it unfold",
    description:
      "See results update live as each new vote lands, then close when you are ready.",
  },
];

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const { hash } = useLocation();
  const pageRef = useRef(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!hash) {
      return;
    }

    const element = document.getElementById(hash.slice(1));

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hash]);

  useEffect(() => {
    const root = pageRef.current;

    if (!root || prefersReducedMotion() || hasAnimatedRef.current) {
      return undefined;
    }

    hasAnimatedRef.current = true;

    const ctx = gsap.context(() => {
      const defaults = { ease: "power3.out" };

      const navbar = root.querySelector("header");
      const heroHeading = root.querySelector('[data-animate="hero-heading"]');
      const heroDescription = root.querySelector(
        '[data-animate="hero-description"]',
      );
      const heroCtas = gsap.utils.toArray(
        root.querySelectorAll('[data-animate="hero-cta"]'),
      );
      const previewVisual = root.querySelector(
        '[data-animate="preview-visual"]',
      );
      const previewQuestion = root.querySelector(
        '[data-animate="preview-question"]',
      );
      const previewOptionsEls = gsap.utils.toArray(
        root.querySelectorAll('[data-animate="preview-option"]'),
      );
      const previewBars = gsap.utils.toArray(
        root.querySelectorAll('[data-animate="preview-bar"]'),
      );
      const liveIndicator = root.querySelector(
        '[data-animate="live-indicator"]',
      );

      if (navbar) {
        gsap.from(navbar, {
          ...defaults,
          opacity: 0,
          y: -24,
          duration: 0.7,
          delay: 0.1,
          onComplete: () => {
            gsap.set(navbar, { clearProps: "transform" });
          },
        });
      }

      if (heroHeading) {
        gsap.from(heroHeading, {
          ...defaults,
          opacity: 0,
          y: 28,
          duration: 1.0,
          delay: 0.2,
        });
      }

      if (heroDescription) {
        gsap.from(heroDescription, {
          ...defaults,
          opacity: 0,
          y: 24,
          duration: 0.8,
          delay: 0.4,
        });
      }

      if (heroCtas.length) {
        gsap.from(heroCtas, {
          ...defaults,
          opacity: 0,
          y: 20,
          scale: 0.97,
          duration: 0.7,
          delay: 0.6,
          stagger: 0.08,
        });
      }

      if (previewVisual) {
        gsap.from(previewVisual, {
          ...defaults,
          opacity: 0,
          y: 32,
          duration: 1.0,
          delay: 0.5,
        });
      }

      if (previewQuestion) {
        gsap.from(previewQuestion, {
          ...defaults,
          opacity: 0,
          y: 18,
          duration: 0.6,
          delay: 0.85,
        });
      }

      if (previewOptionsEls.length) {
        gsap.from(previewOptionsEls, {
          ...defaults,
          opacity: 0,
          y: 16,
          duration: 0.5,
          delay: 1.0,
          stagger: 0.1,
        });
      }

      previewBars.forEach((bar) => {
        const targetWidth = bar.style.width || "0%";

        gsap.fromTo(
          bar,
          { width: "0%" },
          {
            width: targetWidth,
            duration: 1.2,
            ease: "power2.out",
            delay: 1.15,
          },
        );
      });

      if (liveIndicator) {
        gsap.to(liveIndicator, {
          opacity: 0.55,
          duration: 1.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 1.2,
        });
      }

      const statsSection = root.querySelector('[data-animate="stats"]');
      if (statsSection) {
        const statsCards = statsSection.querySelectorAll(
          '[data-animate="stats-card"]',
        );

        gsap.from(statsCards, {
          ...defaults,
          opacity: 0,
          y: 28,
          duration: 0.7,
          stagger: 0.12,
          scrollTrigger: {
            trigger: statsSection,
            start: "top 80%",
            once: true,
          },
        });
      }

      root.querySelectorAll('[data-animate="features"]').forEach((section) => {
        const heading = section.querySelector(
          '[data-animate="section-heading"]',
        );
        const cards = section.querySelectorAll('[data-animate="feature-card"]');

        if (heading) {
          gsap.from(heading, {
            ...defaults,
            opacity: 0,
            y: 24,
            duration: 0.7,
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              once: true,
            },
          });
        }

        if (cards.length) {
          gsap.from(cards, {
            ...defaults,
            opacity: 0,
            y: 28,
            scale: 0.96,
            duration: 0.8,
            stagger: 0.15,
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              once: true,
            },
          });
        }
      });

      const hoverCleanups = [];

      const bindHover = (element, enterVars, leaveVars, enterDuration) => {
        const onEnter = () => {
          gsap.to(element, {
            ...enterVars,
            duration: enterDuration,
            ease: "power3.out",
            overwrite: "auto",
          });
        };

        const onLeave = () => {
          gsap.to(element, {
            ...leaveVars,
            duration: 0.25,
            ease: "power3.out",
            overwrite: "auto",
          });
        };

        element.addEventListener("mouseenter", onEnter);
        element.addEventListener("mouseleave", onLeave);
        element.addEventListener("focus", onEnter);
        element.addEventListener("blur", onLeave);

        hoverCleanups.push(() => {
          element.removeEventListener("mouseenter", onEnter);
          element.removeEventListener("mouseleave", onLeave);
          element.removeEventListener("focus", onEnter);
          element.removeEventListener("blur", onLeave);
          gsap.killTweensOf(element);
        });
      };

      root.querySelectorAll('[data-hover="btn"]').forEach((button) => {
        bindHover(button, { scale: 1.03 }, { scale: 1 }, 0.2);
      });

      root.querySelectorAll('[data-hover="card"]').forEach((card) => {
        bindHover(card, { y: -5 }, { y: 0 }, 0.3);
      });

      root.querySelectorAll('[data-hover="icon"]').forEach((icon) => {
        bindHover(icon, { scale: 1.1 }, { scale: 1 }, 0.2);
      });

      return () => {
        hoverCleanups.forEach((cleanup) => cleanup());
      };
    }, root);

    return () => {
      ctx.revert();
      hasAnimatedRef.current = false;
    };
  }, []);

  const primaryTo = isAuthenticated ? "/polls/new" : "/register";
  const primaryLabel = isAuthenticated
    ? "Create a poll"
    : "Create your first poll";

  return (
    <div ref={pageRef} className="min-h-screen bg-canvas">
      <Navbar />

      <main>
        <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                <Sparkles size={14} className="text-primary" />
                Live audience insight
              </span>

              <h1
                data-animate="hero-heading"
                className="mt-6 font-display text-[3.35rem] leading-[0.98] tracking-[-0.04em] text-ink sm:text-[4.4rem] lg:text-[5.35rem]"
              >
                Ask better
                <br />
                questions.
                <span className="mt-1 block text-primary">
                  Watch answers live.
                </span>
              </h1>

              <p
                data-animate="hero-description"
                className="mt-6 max-w-xl text-lg leading-relaxed text-subtle sm:text-xl"
              >
                PulsePoll turns quick questions into beautiful, shareable polls
                with results that update the moment someone votes.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={primaryTo}
                  data-animate="hero-cta"
                  data-hover="btn"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-surface shadow-card transition hover:bg-ink"
                >
                  {primaryLabel}
                  <ArrowRight size={17} />
                </Link>
                <a
                  href="#preview"
                  data-animate="hero-cta"
                  data-hover="btn"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/10 bg-surface px-6 py-3.5 text-sm font-semibold text-ink transition hover:border-ink/20 hover:bg-surface-soft/35"
                >
                  See a live preview
                </a>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-subtle">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-live" />
                  No credit card
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-live" />
                  Anonymous voting
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-live" />
                  Instant results
                </span>
              </div>
            </div>

            <HeroPollIllustration />
          </div>
        </section>

        <section
          id="features"
          data-animate="features"
          className="scroll-mt-24 border-y border-line bg-surface"
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
              {/* Heading + Image */}
              <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
                {/* Left: Heading */}
                <div data-animate="section-heading">
                  <span className="inline-flex items-center gap-2 rounded-full bg-surface-soft/45 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                    <Zap size={14} data-hover="icon" className="text-primary" />
                    Built for momentum
                  </span>

                  <h2 className="mt-5 font-display text-4xl leading-[1.04] text-ink sm:text-5xl">
                    Everything a live poll needs, nothing it does not.
                  </h2>

                  <p className="mt-5 max-w-md text-base leading-relaxed text-subtle">
                    From the first vote to the final result, PulsePoll keeps the
                    experience fast, fair, and effortless.
                  </p>
                </div>

                {/* Right: Image */}
                <div
                  data-animate="preview-visual"
                  className="flex items-center justify-center lg:justify-end"
                >
                  <img
                    src="/second.png"
                    alt="PulsePoll live voting illustration"
                    className="w-full max-w-[580px] object-contain lg:scale-105"
                  />
                </div>
              </div>
          </div>
        </section>

        <section
          id="how-it-works"
          data-animate="stats"
          className="scroll-mt-24 bg-canvas"
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                <Radio size={14} className="text-primary" />
                How it works
              </span>
              <h2 className="mt-5 font-display text-4xl leading-[1.04] text-ink sm:text-5xl">
                Three steps to a pulse.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-subtle">
                No setup calls, no complicated dashboards. Just a question and
                an audience.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  data-animate="stats-card"
                  data-hover="card"
                  className="rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-7"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-surface">
                      0{index + 1}
                    </span>
                    <ArrowUpRight
                      size={18}
                      data-hover="icon"
                      className="text-muted"
                    />
                  </div>
                  <h3 className="mt-6 font-display text-2xl text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-subtle">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          data-animate="features"
          className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8"
        >
          <div
            data-animate="section-heading"
            className="overflow-hidden rounded-[2rem] bg-primary px-6 py-14 text-center shadow-soft sm:px-12 sm:py-16"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-surface/20 bg-surface/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-surface">
              <Sparkles size={14} data-hover="icon" />
              Ready when you are
            </span>
            <h2 className="mx-auto mt-6 max-w-2xl font-display text-4xl leading-[1.04] text-surface sm:text-5xl">
              Ready to feel the pulse of your audience?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-surface/75">
              Create a live poll in under a minute and share it with anyone,
              anywhere.
            </p>
            <Link
              to={primaryTo}
              data-hover="btn"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-surface px-6 py-3.5 text-sm font-semibold text-primary transition hover:bg-surface-soft"
            >
              {primaryLabel}
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-5 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-display text-xl tracking-[-0.04em] text-ink"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-surface">
              <Radio size={16} />
            </span>
            PulsePoll
          </Link>
          <p className="text-sm text-subtle">
            Live polls for teams that move fast.
          </p>
          <div className="flex items-center gap-4 text-sm text-subtle">
            <Link to="/#features" className="transition hover:text-ink">
              Features
            </Link>
            <Link to="/#how-it-works" className="transition hover:text-ink">
              How it works
            </Link>
            <Link to="/login" className="transition hover:text-ink">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
