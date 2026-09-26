"use client";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { dictionaries, localeOf } from "@/lib/i18n";

export function LoginForm({ locale }: { locale: string }) {
  const t = dictionaries[localeOf(locale)].auth,
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (result.error) {
      setBusy(false);
      setError(result.error.message || t.loginFailed);
      return;
    }
    const session = await authClient.getSession();
    const role = (session.data?.user as { role?: string } | undefined)?.role;
    window.location.assign(
      `/${locale}/${role === "ADMIN" ? "admin" : "dashboard"}`,
    );
  }
  return (
    <form className="form" onSubmit={submit}>
      <label className="field">
        {t.email}
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label className="field">
        {t.password}
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </label>
      {error && <p style={{ color: "#fca5a5" }}>{error}</p>}
      <button className="button accent" disabled={busy}>
        {busy ? t.signingIn : t.login}
      </button>
      <Link className="muted" href={`/${locale}/forgot-password`}>
        {t.forgot}
      </Link>
      <p>
        {t.newHere} <Link href={`/${locale}/register`}>{t.createLink}</Link>
      </p>
    </form>
  );
}

export function RegisterForm({ locale }: { locale: string }) {
  const t = dictionaries[localeOf(locale)].auth;
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const result = await authClient.signUp.email({
      name: String(f.get("name")),
      email: String(f.get("email")),
      password: String(f.get("password")),
      preferredLanguage: locale,
    } as never);
    setBusy(false);
    setMessage(
      result.error
        ? result.error.message || t.registrationFailed
        : t.checkEmail,
    );
  }
  return (
    <form className="form" onSubmit={submit}>
      <label className="field">
        {t.fullName}
        <input name="name" required minLength={2} />
      </label>
      <label className="field">
        {t.businessName}
        <input name="business" />
      </label>
      <label className="field">
        {t.email}
        <input name="email" type="email" required />
      </label>
      <label className="field">
        {t.password}
        <input name="password" type="password" required minLength={10} />
      </label>
      <label>
        <input type="checkbox" required /> {t.accept}
      </label>
      {message && <p>{message}</p>}
      <button className="button accent" disabled={busy}>
        {busy ? t.creating : t.create}
      </button>
    </form>
  );
}
