"use client";

import { useActionState, useEffect, useState } from "react";
import { applyToAd } from "../actions/engage";
import { recordExternalApply, recordShare, recordView } from "../actions/engage";
import { toggleFollow } from "../actions/engage";
import Icon from "./Icon";
import { ErrorMessage, Gate, SubmitButton, SuccessMessage } from "./ui";
import type { FormState } from "../actions/auth";

/** Counts the view once the ad page is opened (not when it merely appears in a feed). */
export function ViewTracker({ adId }: { adId: string }) {
  useEffect(() => {
    void recordView(adId);
  }, [adId]);
  return null;
}

export function ShareButton({ adId, title, canShare }: { adId: string; title: string; canShare: boolean }) {
  const [note, setNote] = useState("");
  async function share() {
    const url = `${window.location.origin}/ads/${adId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: title, url });
        setNote("Shared!");
      } else {
        await navigator.clipboard.writeText(url);
        setNote("Link copied");
      }
      void recordShare(adId);
    } catch {
      // The user closed the share sheet; nothing to report.
    }
    setTimeout(() => setNote(""), 2500);
  }
  return (
    <Gate allowed={canShare} reason="Create a free account to share ads with your people.">
      <button type="button" onClick={share} className="btn btn-soft">
        <Icon name="share" size={15} /> {note || "Share"}
      </button>
    </Gate>
  );
}

export function FollowButton({
  category,
  following,
  allowed,
}: {
  category: string;
  following: boolean;
  allowed: boolean;
}) {
  return (
    <Gate allowed={allowed} reason="Create an account to follow a type of ad and get notified when a new one is posted.">
      <form action={toggleFollow}>
        <input type="hidden" name="category" value={category} />
        <button className={`btn ${following ? "btn-green" : "btn-soft"}`}>
          <Icon name={following ? "check" : "bell"} size={15} /> {following ? "Following" : "Follow this type"}
        </button>
      </form>
    </Gate>
  );
}

/** Shows the client's own contact (email, phone or link) to signed-in applicants; guests are asked to join. */
export function ApplyExternal({
  adId,
  method,
  value,
  allowed,
}: {
  adId: string;
  method: "email" | "phone" | "link";
  value: string;
  allowed: boolean;
}) {
  const icon = method === "email" ? "mail" : method === "phone" ? "phone" : "link";
  const href = method === "email" ? `mailto:${value}` : method === "phone" ? `tel:${value.replace(/[^\d+]/g, "")}` : value;
  const label = method === "email" ? "Email to apply" : method === "phone" ? "Call or WhatsApp to apply" : "Apply on their site";
  return (
    <Gate allowed={allowed} reason="Create an account to see how to apply to this ad.">
      <div className="space-y-3">
        <p className="text-sm text-muted">The client takes applications outside the app.</p>
        <a
          href={href}
          target={method === "link" ? "_blank" : undefined}
          rel={method === "link" ? "noopener noreferrer" : undefined}
          onClick={() => void recordExternalApply(adId)}
          className="btn btn-blue"
        >
          <Icon name={icon} size={15} /> {label}
        </a>
        <p className="break-all text-sm font-bold">{value}</p>
      </div>
    </Gate>
  );
}

export function ApplyForm({ adId, allowed }: { adId: string; allowed: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(applyToAd, {});
  const [message, setMessage] = useState("");
  return (
    <Gate allowed={allowed} reason="Create an account to apply and message the client.">
      <form action={action} className="space-y-3">
        <input type="hidden" name="adId" value={adId} />
        <label className="block text-sm font-bold" htmlFor="message">
          Your response
        </label>
        <textarea
          id="message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={1500}
          placeholder="Introduce yourself and say why you fit."
          className="field"
        />
        <ErrorMessage message={state.error} />
        <SuccessMessage message={state.message} />
        <SubmitButton pendingText="Sending…"><Icon name="send" size={15} /> Apply</SubmitButton>
      </form>
    </Gate>
  );
}
