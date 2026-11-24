"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Send } from "lucide-react";

const initialState = {
  name: "",
  email: "",
  organisation: "",
  enquiryType: "Employment opportunity",
  subject: "",
  message: "",
  website: "", // honeypot
};

export function ContactForm() {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [referenceId, setReferenceId] = useState<string | null>(null);

  function update(field: keyof typeof initialState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    setMessage("");
    setReferenceId(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = (await response.json()) as {
        message?: string;
        referenceId?: string;
        emailId?: string;
      };

      if (!response.ok) {
        if (result.referenceId) {
          setReferenceId(result.referenceId);
        }
        throw new Error(result.message || "The message could not be sent. Please try again.");
      }

      setStatus("success");
      setMessage(result.message || "Your message has been submitted successfully. Thank you for getting in touch.");
      // Clear form only on confirmed success
      setForm(initialState);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      // Form fields are preserved so the visitor can retry without retyping!
    }
  }

  return (
    <form className="contact-form" onSubmit={submit} noValidate={false}>
      <div className="form-row">
        <label>
          Name *
          <input
            required
            minLength={2}
            maxLength={100}
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Your name"
            disabled={status === "sending"}
          />
        </label>
        <label>
          Email *
          <input
            required
            type="email"
            maxLength={200}
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="you@example.com"
            disabled={status === "sending"}
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          Organisation <span className="optional">Optional</span>
          <input
            maxLength={120}
            value={form.organisation}
            onChange={(event) => update("organisation", event.target.value)}
            placeholder="Company or organisation"
            disabled={status === "sending"}
          />
        </label>
        <label>
          Enquiry type *
          <select
            value={form.enquiryType}
            onChange={(event) => update("enquiryType", event.target.value)}
            disabled={status === "sending"}
          >
            <option>Employment opportunity</option>
            <option>Software development</option>
            <option>Partnership</option>
            <option>General enquiry</option>
          </select>
        </label>
      </div>

      <label>
        Subject *
        <input
          required
          minLength={3}
          maxLength={160}
          value={form.subject}
          onChange={(event) => update("subject", event.target.value)}
          placeholder="What would you like to discuss?"
          disabled={status === "sending"}
        />
      </label>

      <label>
        Message *
        <textarea
          required
          minLength={20}
          maxLength={5000}
          rows={6}
          value={form.message}
          onChange={(event) => update("message", event.target.value)}
          placeholder="Tell me a little about the opportunity or project…"
          disabled={status === "sending"}
        />
      </label>

      {/* Honeypot field for bot filtering */}
      <label className="honeypot" aria-hidden="true" style={{ display: "none" }}>
        Website
        <input
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(event) => update("website", event.target.value)}
        />
      </label>

      <div className="form-submit-row">
        <button
          className="button button-primary"
          type="submit"
          disabled={status === "sending"}
          aria-busy={status === "sending"}
        >
          {status === "sending" ? (
            <LoaderCircle className="spin" size={17} />
          ) : (
            <Send size={16} />
          )}
          {status === "sending" ? "Sending enquiry..." : "Send enquiry"}
        </button>

        {status !== "idle" && message ? (
          <div
            className={`form-message ${status}`}
            role="alert"
            aria-live="polite"
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {status === "success" ? (
                <CheckCircle2 size={16} style={{ flexShrink: 0, color: "#24a36b" }} />
              ) : (
                <AlertCircle size={16} style={{ flexShrink: 0, color: "#df3035" }} />
              )}
              <span>{message}</span>
            </div>
            {referenceId ? (
              <small style={{ fontSize: 11, color: "#888", marginLeft: 23 }}>
                Reference ID: <code>{referenceId}</code>
              </small>
            ) : null}
          </div>
        ) : null}
      </div>
    </form>
  );
}
