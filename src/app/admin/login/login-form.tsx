"use client";

import { useActionState } from "react";
import { login } from "../actions/auth";
import { FormStatus, SubmitButton } from "@/components/forms/form-kit";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <FormStatus state={state} />
      <SubmitButton pending={pending} className="!w-full">Entrar</SubmitButton>
    </form>
  );
}
