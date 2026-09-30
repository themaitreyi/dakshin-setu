import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublicShell, PageHero } from "@/components/site/public-shell";
import { Button } from "@/components/ui/button";
import { knowledge } from "@/lib/knowledge";
export const Route = createFileRoute("/contact")({ component: Contact });
function Contact() {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <PublicShell>
      <PageHero
        eyebrow="Contact the project team"
        title="Corrections make the repository stronger."
        lead="Submit a source correction or content request to this portal's operator. This form does not contact NCPOR or send email."
      />
      <section className="mx-auto max-w-2xl px-4 py-12">
        <form
          className="space-y-5 rounded-2xl border bg-white p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget,
              data = new FormData(form);
            setBusy(true);
            try {
              const r = await knowledge<{ id: string; message: string }>("/enquiries", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  name: data.get("name"),
                  email: data.get("email"),
                  message: data.get("message"),
                }),
              });
              setMessage(`${r.message} Receipt: ${r.id}`);
              form.reset();
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Could not save your message");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="block">
            Name
            <input
              name="name"
              required
              minLength={2}
              maxLength={120}
              className="mt-2 w-full rounded-lg border p-3"
            />
          </label>
          <label className="block">
            Email
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              className="mt-2 w-full rounded-lg border p-3"
            />
          </label>
          <label className="block">
            Message
            <textarea
              name="message"
              required
              minLength={10}
              maxLength={4000}
              className="mt-2 min-h-32 w-full rounded-lg border p-3"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Your name, email and message will be stored in the portal database and accessible to its
            curator. Do not include sensitive research or personal information.
          </p>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save enquiry"}
          </Button>
          <p role="status">{message}</p>
        </form>
      </section>
    </PublicShell>
  );
}
