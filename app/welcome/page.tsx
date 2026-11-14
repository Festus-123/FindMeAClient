import { saveOnboarding } from "../actions/auth";
import Icon, { CATEGORY_ICONS } from "../_components/Icon";
import { SubmitButton } from "../_components/ui";
import { requireUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/config";

export const metadata = { title: "Welcome · Find Me A Client" };

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  const user = await requireUser(["employee"], "/welcome");

  return (
    <div className="fade-in mx-auto max-w-3xl space-y-8 pt-6">
      <header className="space-y-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-accent">Step 1 of 1 · Make your feed yours</p>
        <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
          Who should we find for you, {user.name.split(" ")[0]}?
        </h1>
        <p className="max-w-xl text-muted">
          Someone out there has work and the budget for it. Tell us what kind of clients you want and they
          will show up first.
        </p>
      </header>

      <form action={saveOnboarding} className="space-y-8">
        <input type="hidden" name="next" value={next} />
        <fieldset className="space-y-3">
          <legend className="text-sm font-extrabold uppercase tracking-wide">Kinds of clients</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {CATEGORIES.map((c) => (
              <label key={c} className="group relative cursor-pointer">
                <input type="checkbox" name="category" value={c} defaultChecked={user.follows.includes(c)} className="peer sr-only" />
                <span className="flex items-center gap-3 bg-surface px-4 py-3.5 text-sm font-bold transition-colors duration-150 peer-checked:bg-ink peer-checked:text-on-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent hover:bg-red-soft peer-checked:hover:bg-ink">
                  <Icon name={CATEGORY_ICONS[c] ?? "grid"} size={18} /> {c}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex cursor-pointer items-start gap-3 bg-green-soft p-5">
          <input type="checkbox" name="notify" defaultChecked className="mt-1 h-4 w-4 accent-[var(--green)]" />
          <span>
            <span className="flex items-center gap-2 font-extrabold"><Icon name="bell" size={16} className="text-green" /> Tell me the moment a matching ad goes up</span>
            <span className="text-sm text-muted">Be first in line. You can change this any time from your dashboard.</span>
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton pendingText="Saving…">Show me my feed</SubmitButton>
          <a href={next} className="btn btn-soft">Skip for now</a>
        </div>
      </form>
    </div>
  );
}
