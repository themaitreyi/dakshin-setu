import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/admin/users")({
  component: () => (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Access model</h1>
      <p className="mt-5">
        Public browsing is open. Registered researchers can submit sources; administrators can
        review records and read private enquiries. Passwords use salted scrypt hashes, and expiring
        HttpOnly sessions are stored on the server. Create an administrator using
        backend/create_admin.py. Institutional SSO, email verification, password recovery and
        detailed per-user audit trails are not implemented.
      </p>
    </section>
  ),
});
