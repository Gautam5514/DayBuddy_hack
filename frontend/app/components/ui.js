// Small presentational building blocks shared by every page.

import Link from "next/link";

export function PageShell({ children }) {
  return (
    <div className="min-h-full w-full">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-10 px-5 py-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}

export function Brand() {
  return (
    <p className="font-serif text-xl font-semibold tracking-tight">
      Day<span className="text-clay">Buddy</span>
    </p>
  );
}

export function TextLink({ href, children }) {
  return (
    <Link
      href={href}
      className="font-medium text-ink underline decoration-line decoration-2 underline-offset-4 transition-colors hover:decoration-clay"
    >
      {children}
    </Link>
  );
}

// Header for secondary pages: a way home on the left, the brand on the right.
export function SubpageHeader() {
  return (
    <header className="flex items-center justify-between text-sm">
      <TextLink href="/">← Back to today</TextLink>
      <Brand />
    </header>
  );
}

export function PageIntro({ title, children }) {
  return (
    <section>
      <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        {title}
      </h1>
      {children && <p className="mt-3 text-base text-muted">{children}</p>}
    </section>
  );
}

export function SectionHeader({ title, description, children }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-line pb-3">
      <div>
        <h2 className="font-serif text-2xl font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function ErrorNotice({ children, className = "" }) {
  if (!children) return null;
  return (
    <p role="alert" className={`rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ${className}`}>
      {children}
    </p>
  );
}

// A pill that behaves like a toggle button.
export function ChoiceButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
        active ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink hover:border-stone-400"
      }`}
    >
      {children}
    </button>
  );
}

export function Spinner() {
  return (
    <span
      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
      aria-hidden="true"
    />
  );
}

export const fieldClass =
  "w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-base outline-none placeholder:text-stone-400 focus:border-clay";
