"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { login, register, type FormState } from "../actions/auth";
import Icon from "./Icon";
import { ErrorMessage, SubmitButton } from "./ui";

export default function AuthForm({ mode, next, role }: { mode: "login" | "register"; next: string; role?: "client" | "employee" }) {
  const [state, action] = useActionState<FormState, FormData>(mode === "login" ? login : register, {});
  // Controlled so a failed attempt keeps what was typed (React 19 resets uncontrolled fields).
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const isRegister = mode === "register";
  const business = role === "client";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {isRegister && role && (
        <>
          <input type="hidden" name="role" value={role} />
          <div>
            <label htmlFor="name" className="mb-1.5 flex items-center gap-2 text-sm font-bold">
              <Icon name={business ? "briefcase" : "user"} size={15} /> {business ? "Company or business name" : "Your name"}
            </label>
            <input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete={business ? "organization" : "name"} placeholder={business ? "e.g. Brightwave Studio" : "e.g. Ada Obi"} className="field" />
          </div>
        </>
      )}
      <div>
        <label htmlFor="email" className="mb-1.5 flex items-center gap-2 text-sm font-bold"><Icon name="mail" size={15} /> Email</label>
        <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="field" />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-bold">Password</label>
        <input id="password" name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} className="field" />
      </div>
      <ErrorMessage message={state.error} />
      <SubmitButton className="btn btn-blue w-full">{isRegister ? "Create account" : "Sign in"}</SubmitButton>
      <p className="text-center text-sm text-muted">
        {isRegister ? "Already have an account?" : "New here?"}{" "}
        <Link href={`${isRegister ? "/login" : "/register"}?next=${encodeURIComponent(next)}`} className="font-bold text-accent">
          {isRegister ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}
