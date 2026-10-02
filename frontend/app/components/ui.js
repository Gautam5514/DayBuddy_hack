"use client";

// Small presentational building blocks shared by every page.
// Colours come only from the theme tokens in globals.css, so dark mode just works.

import Link from "next/link";
import { usePathname } from "next/navigation";

const WIDTHS = { narrow: "max-w-2xl", wide: "max-w-5xl" };

export function PageShell({ width = "narrow", children }) {
  return (
    <div className="min-h-full w-full">
      <AppHeader width={width} />
      <main className={`mx-auto flex w-full ${WIDTHS[width]} flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 sm:pt-10`}>
        {children}
      </main>
    </div>
  );
}

const NAV = [
  { href: "/", label: "Today" },
  { href: "/ask", label: "Ask" },
  { href: "/profile", label: "Profile" },
];

function AppHeader({ width }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-line/60 bg-paper/80 backdrop-blur-md">
      <div className={`mx-auto flex ${WIDTHS[width]} items-center justify-between gap-4 px-4 py-3 sm:px-6`}>
        <Link href="/" className="flex items-center gap-2" aria-label="DayBuddy home">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-clay text-on-accent" aria-hidden="true">
            <SunIcon className="h-4 w-4" />
          </span>
          <span className="font-serif text-lg font-semibold tracking-tight">
            Day<span className="text-clay">Buddy</span>
          </span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 rounded-full border border-line bg-card p-1 text-sm">
          {NAV.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 font-medium transition-colors sm:px-4 ${
                  active ? "bg-ink text-paper" : "text-muted hover:text-ink"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function PageIntro({ eyebrow, title, children }) {
  return (
    <section className="animate-rise">
      {eyebrow && <p className="mb-2 text-sm font-medium uppercase tracking-[0.14em] text-clay">{eyebrow}</p>}
      <h1 className="font-serif text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">{title}</h1>
      {children && <p className="mt-3 max-w-prose text-base text-muted sm:text-lg">{children}</p>}
    </section>
  );
}

export function Card({ as: Tag = "section", className = "", delay = 0, children, ...rest }) {
  return (
    <Tag
      className={`animate-rise rounded-3xl border border-line bg-card p-5 shadow-card sm:p-7 ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function SectionHeader({ title, description, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}

const BUTTON_VARIANTS = {
  primary: "bg-clay text-on-accent hover:bg-clay-dark",
  dark: "bg-ink text-paper hover:opacity-90",
  ghost: "border border-line bg-card text-ink hover:border-muted",
};

export function Button({ variant = "primary", className = "", children, ...rest }) {
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${BUTTON_VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ErrorNotice({ children, className = "" }) {
  if (!children) return null;
  return (
    <p role="alert" className={`rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger ${className}`}>
      {children}
    </p>
  );
}

// A pill that behaves like a toggle button.
export function ChoiceButton({ active, onClick, className = "", children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-[0.97] ${
        active ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink hover:border-muted"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Spinner() {
  return (
    <span
      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
      aria-hidden="true"
    />
  );
}

export const fieldClass =
  "w-full rounded-2xl border border-line bg-paper px-4 py-3 text-base outline-none transition-shadow placeholder:text-muted/70 focus:border-clay focus:ring-4 focus:ring-clay/15";

// ---- Icons (inline SVG, inherit currentColor) ----

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const SunIcon = (p) => (
  <svg {...svgProps} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const CheckIcon = (p) => (
  <svg {...svgProps} strokeWidth={3} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const CloseIcon = (p) => (
  <svg {...svgProps} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const PlusIcon = (p) => (
  <svg {...svgProps} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const ArrowIcon = (p) => (
  <svg {...svgProps} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
