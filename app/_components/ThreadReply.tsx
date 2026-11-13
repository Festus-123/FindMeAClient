"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendMessage } from "../actions/engage";
import Icon from "./Icon";
import type { FormState } from "../actions/auth";
import { ErrorMessage, SubmitButton } from "./ui";

export default function ThreadReply({ threadId }: { threadId: string }) {
  const [state, action] = useActionState<FormState, FormData>(sendMessage, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="mt-3 space-y-2">
      <input type="hidden" name="threadId" value={threadId} />
      <textarea name="text" rows={2} maxLength={1500} placeholder="Write a reply…" className="field" />
      <ErrorMessage message={state.error} />
      <SubmitButton pendingText="Sending…" className="btn btn-blue !py-2"><Icon name="send" size={14} /> Send</SubmitButton>
    </form>
  );
}
