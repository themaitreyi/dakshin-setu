import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { knowledge } from "@/lib/knowledge";
import { Button } from "@/components/ui/button";
export type PortalUser = { id: string; name: string; email: string; role: "researcher" | "admin" };
export function PortalGate({ admin = false, children }: { admin?: boolean; children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    knowledge<{ user: PortalUser }>("/auth/me")
      .then((r) => setUser(r.user))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  async function logout() {
    try {
      await knowledge("/auth/logout", { method: "POST" });
      setUser(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-out failed");
    }
  }
  if (loading)
    return (
      <p role="status" className="p-12">
        Checking your session…
      </p>
    );
  if (!user || (admin && user.role !== "admin"))
    return (
      <section className="mx-auto max-w-3xl p-12">
        <h1 className="text-3xl font-bold">
          {user ? "Administrator access required" : "Sign in to your portal"}
        </h1>
        <p className="my-5">
          {user
            ? "Your researcher account cannot review records or read private enquiries."
            : error || "Your session has ended."}
        </p>
        <Button asChild>
          <Link to="/auth">Go to login</Link>
        </Button>
        <Link
          to="/preview/$role"
          params={{ role: admin ? "admin" : "researcher" }}
          className="ml-4 inline-block rounded-lg border bg-white px-4 py-2"
        >
          Explore the workspace overview →
        </Link>
      </section>
    );
  return (
    <>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <p className="text-sm">
          Signed in as <strong>{user.name}</strong> · {user.role}
        </p>
        <Button variant="outline" onClick={logout}>
          Sign out
        </Button>
        {error && <p role="alert">{error}</p>}
      </div>
      {children}
    </>
  );
}
