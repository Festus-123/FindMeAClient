import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "../_components/AuthForm";
import Icon from "../_components/Icon";
import Logo from "../_components/Logo";
import { getUser } from "@/lib/auth";
import { ROLE_SUMMARY } from "@/lib/permissions";

export const metadata = { title: "Join · Find Me A Client" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string; as?: string }> }) {
  const { next = "/", as } = await searchParams;
  if (await getUser()) redirect("/");
  const role = as === "client" || as === "employee" ? as : null;
  const q = (r: string) => `/register?as=${r}&next=${encodeURIComponent(next)}`;

  if (role) {
    const worker = role === "client"; // "Find me a worker" posts ads, so it is the client role
    const perks: { icon: "zap" | "eye" | "send" | "bell" | "trophy" | "users"; text: string }[] = worker
      ? [
          { icon: "zap", text: "Your first ad is free" },
          { icon: "eye", text: "Seen by every signed-in user at least once" },
          { icon: "trophy", text: "Climb the weekly client leaderboard" },
        ]
      : [
          { icon: "send", text: "Apply in one message" },
          { icon: "bell", text: "Get notified when your kind of work is posted" },
          { icon: "eye", text: "Browse every live ad, free" },
        ];
    return (
      <div className="fade-in mx-auto grid max-w-5xl pt-6 md:grid-cols-[1.05fr_1fr]">
        {/* Photo panel: real people, a bold line and three quick reasons to join. */}
        <aside className="relative hidden min-h-[34rem] overflow-hidden bg-ink text-white md:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={worker ? "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000&q=70&auto=format&fit=crop" : "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&q=70&auto=format&fit=crop"}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
          <div aria-hidden className="absolute inset-x-0 top-0 flex h-2">
            <div className="flex-1 bg-red" />
            <div className="flex-1 bg-blue" />
            <div className="flex-1 bg-green" />
          </div>
          <div className="relative flex h-full flex-col justify-between p-10">
            <p><Logo className="text-xl" onDark /></p>
            <div className="space-y-8">
              <h1 className="text-4xl font-extrabold leading-[1.05]">
                {worker ? "Hiring? Let the right people find you." : "Skills are good. Being seen is better."}
              </h1>
              <ul className="space-y-3">
                {perks.map((p, i) => (
                  <li key={p.text} className="flex items-center gap-3 text-sm font-semibold">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center ${i % 2 ? "bg-green" : "bg-blue"}`}>
                      <Icon name={p.icon} size={17} />
                    </span>
                    {p.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
        <div className="space-y-6 bg-surface p-8 sm:p-10">
          <div>
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-accent">
              <Icon name={worker ? "users" : "briefcase"} size={14} /> {worker ? "Find me a worker" : "Find me a client"}
            </p>
            <h2 className="mt-2 text-2xl font-extrabold">Create your account</h2>
            <p className="mt-1 text-sm text-muted">{worker ? "Free to join. Your first ad is on us." : "Free to join. Apply to as many ads as you like."}</p>
          </div>
          <AuthForm mode="register" next={next} role={role} />
          <Link href={`/register?next=${encodeURIComponent(next)}`} className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink">
            <Icon name="back" size={13} /> Choose a different path
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in mx-auto max-w-5xl space-y-8 pt-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold sm:text-5xl">How will you use <Logo />?</h1>
        <p className="mt-3 text-sm text-muted">Pick one. It takes under a minute.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Choice href={q("employee")} color="bg-red" icon="briefcase" title="Find me a client" blurb="I offer a skill or service and want work." lines={ROLE_SUMMARY.employee.slice(0, 4)} />
        <Choice href={q("client")} color="bg-blue" icon="users" title="Find me a worker" blurb="I'm hiring, or promoting a role or service." lines={ROLE_SUMMARY.client.slice(0, 4)} />
      </div>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-bold text-accent">Sign in</Link>
      </p>
    </div>
  );
}

function Choice({ href, color, icon, title, blurb, lines }: { href: string; color: string; icon: "briefcase" | "users"; title: string; blurb: string; lines: string[] }) {
  return (
    <Link href={href} className={`tile group flex min-h-80 flex-col justify-between p-8 text-white ${color}`}>
      <div className="space-y-3">
        <Icon name={icon} size={44} />
        <h2 className="text-3xl font-extrabold">{title}</h2>
        <p className="text-sm font-semibold opacity-90">{blurb}</p>
      </div>
      <div className="space-y-4">
        <ul className="space-y-1.5 text-sm">
          {lines.map((l) => (
            <li key={l} className="flex gap-2 opacity-90">
              <Icon name="check" size={15} className="mt-0.5" /> {l}
            </li>
          ))}
        </ul>
        <span className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide">
          Continue <Icon name="arrow" size={16} className="transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
