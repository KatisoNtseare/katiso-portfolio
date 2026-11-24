"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";

const initialState = { name: "", email: "", organisation: "", enquiryType: "Employment opportunity", subject: "", message: "", website: "" };

export function ContactForm() {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  function update(field: keyof typeof initialState, value: string) { setForm((current) => ({ ...current, [field]: value })); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("sending"); setMessage("");
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "The message could not be sent.");
      setStatus("success"); setMessage("Thanks for reaching out. Your message has been sent."); setForm(initialState);
    } catch (error) {
      setStatus("error"); setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  return <form className="contact-form" onSubmit={submit}>
    <div className="form-row"><label>Name<input required minLength={2} maxLength={100} value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Your name" /></label><label>Email<input required type="email" maxLength={200} value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="you@example.com" /></label></div>
    <div className="form-row"><label>Organisation <span className="optional">Optional</span><input maxLength={120} value={form.organisation} onChange={(event) => update("organisation", event.target.value)} placeholder="Company or organisation" /></label><label>Enquiry type<select value={form.enquiryType} onChange={(event) => update("enquiryType", event.target.value)}><option>Employment opportunity</option><option>Software development</option><option>Partnership</option><option>General enquiry</option></select></label></div>
    <label>Subject<input required minLength={3} maxLength={160} value={form.subject} onChange={(event) => update("subject", event.target.value)} placeholder="What would you like to discuss?" /></label>
    <label>Message<textarea required minLength={20} maxLength={5000} rows={6} value={form.message} onChange={(event) => update("message", event.target.value)} placeholder="Tell me a little about the opportunity or project…" /></label>
    <label className="honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => update("website", event.target.value)} /></label>
    <div className="form-submit-row"><button className="button button-primary" type="submit" disabled={status === "sending"}>{status === "sending" ? <LoaderCircle className="spin" size={17} /> : <Send size={16} />} {status === "sending" ? "Sending" : "Send enquiry"}</button>{status !== "idle" ? <p className={`form-message ${status}`}>{status === "success" ? <CheckCircle2 size={16} /> : null}{message}</p> : null}</div>
  </form>;
}
