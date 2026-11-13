"use client";

import Link from "next/link";
import { useState } from "react";
import { becomeClient } from "../actions/engage";
import Icon from "./Icon";
import { SubmitButton } from "./ui";

/**
 * "Post an ad" for every kind of visitor:
 *  - clients go straight to the form,
 *  - guests are sent to join,
 *  - workers (employee accounts) are asked to become a client first. They keep everything they have.
 */
export default function PostAdButton({
  role,
  className = "btn btn-blue",
  label = "Post an ad",
}: {
  role: "guest" | "employee" | "client" | "admin";
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const inner = (
    <>
      <Icon name="plus" size={16} /> {label}
    </>
  );

  if (role === "client") return <Link href="/dashboard/new" className={className}>{inner}</Link>;
  if (role === "guest" || role === "admin") return <Link href="/register?as=client&next=/dashboard/new" className={className}>{inner}</Link>;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {inner}
      </button>
      {open && (
        <div className="fade-in fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="become-client" className="w-full max-w-md bg-paper p-7 text-ink" onClick={(e) => e.stopPropagation()}>
            <span className="flex h-12 w-12 items-center justify-center bg-red text-white">
              <Icon name="users" size={24} />
            </span>
            <h2 id="become-client" className="mt-4 text-xl font-extrabold">Become a client to post ads</h2>
            <p className="mt-2 text-sm text-muted">Posting ads is for client accounts. Switching takes one tap and your account stays the same.</p>
            <ul className="mt-4 space-y-2 text-sm font-semibold">
              {[
                ["plus", "Post ads and pick keywords, a runtime and co-hosts"],
                ["eye", "See views, applications and shares for your ads"],
                ["send", "Still apply to other people's ads, like you do now"],
                ["zap", "Your first ad is free"],
              ].map(([icon, text]) => (
                <li key={text} className="flex items-start gap-2.5">
                  <Icon name={icon as "plus"} size={16} className="mt-0.5 text-green" /> {text}
                </li>
              ))}
            </ul>
            <form action={becomeClient} className="mt-6 flex gap-2">
              <SubmitButton className="btn btn-blue flex-1" pendingText="Switching…">Become a client</SubmitButton>
              <button type="button" onClick={() => setOpen(false)} className="btn btn-soft">Not now</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
