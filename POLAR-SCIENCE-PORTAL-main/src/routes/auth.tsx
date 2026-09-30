import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Snowflake } from "lucide-react";
import { PublicShell } from "@/components/site/public-shell";
import { Button } from "@/components/ui/button";
import { knowledge } from "@/lib/knowledge";
import type { PortalUser } from "@/features/auth/portal-session";
export const Route = createFileRoute("/auth")({ component: Login });
function Login() {
  const [register, setRegister] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const navigate = useNavigate();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (register)
        await knowledge("/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(data),
        });
      const result = await knowledge<{ user: PortalUser }>("/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      await navigate({ to: result.user.role === "admin" ? "/admin" : "/researcher" });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <PublicShell>
      <section className="login-scene mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-2">
        <div className="flex flex-col justify-center">
          <div className="ice-emblem mb-8 flex size-24 items-center justify-center rounded-3xl border border-white bg-sky-100 text-sky-600 shadow-xl">
            <Snowflake size={54} />
          </div>
          <p className="text-sm uppercase tracking-[.25em] text-sky-700">
            One shared scientific journey
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
            Your gateway to
            <br />
            India’s three poles.
          </h1>
          <p className="mt-6 max-w-md text-slate-600">
            Learn freely. Contribute responsibly. Review with evidence. Dakshinsetu accounts belong
            to this independent project, not NCPOR.
          </p>
          <Link to="/student" className="mt-8 font-semibold text-sky-700 underline">
            Enter the student hub without signing in →
          </Link>
        </div>
        <form
          onSubmit={submit}
          className="rounded-3xl border border-sky-100 bg-white/95 p-8 shadow-xl"
        >
          <ShieldCheck className="mb-5 text-blue-600" size={30} />
          <h2 className="text-2xl font-semibold">
            {register ? "Create researcher account" : "Welcome back"}
          </h2>
          <p className="mt-2 mb-6 text-sm text-slate-500">
            {register
              ? "Submissions require administrator review. Registration does not verify institutional affiliation."
              : "Researchers and administrators use the same sign-in."}
          </p>
          {register && (
            <label className="mb-4 block text-sm">
              Your name
              <input
                name="name"
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                className="mt-2 w-full rounded-xl border p-3"
              />
            </label>
          )}
          <label className="mb-4 block text-sm">
            Email
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              className="mt-2 w-full rounded-xl border p-3"
            />
          </label>
          <label className="mb-4 block text-sm">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete={register ? "new-password" : "current-password"}
              className="mt-2 w-full rounded-xl border p-3"
            />
            <span className="mt-1 block text-xs text-slate-500">
              At least 12 characters. Never reuse your institutional password.
            </span>
          </label>
          <p role="status" className="my-4 text-sm text-red-700">
            {message}
          </p>
          <Button disabled={busy} className="w-full">
            {busy ? "Please wait…" : register ? "Create account & enter portal" : "Sign in"}
          </Button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setRegister(!register);
              setMessage("");
            }}
            className="mt-5 w-full text-sm text-blue-700 underline"
          >
            {register ? "Already registered? Sign in" : "New researcher? Create an account"}
          </button>
          <p className="mt-5 text-xs text-slate-500">
            Administrator accounts are provisioned by the operator. Email verification and password
            recovery are not enabled; contact your local operator for support.
          </p>
        </form>
      </section>
    </PublicShell>
  );
}
