import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
export const metadata: Metadata = { title: "Contact", description: "Get in touch with Katiso Ntseare about software engineering opportunities and projects." };
export default function ContactPage() {
  return <main><section className="page-hero"><div className="shell"><span className="eyebrow">CONTACT / START A CONVERSATION</span><h1>Have an opportunity<br />or a problem to solve?</h1><p>Share a little context and I'll get back to you. Choose the enquiry type that best describes what you'd like to discuss.</p></div></section><section className="content-section"><div className="shell contact-grid"><aside className="contact-aside"><span className="eyebrow">LET'S CONNECT</span><h2>Good conversations lead to good work.</h2><p>I'm open to discussions about software development roles, collaborations, consulting and practical technology projects.</p><p>The form is ready, but email delivery needs the Resend environment variables configured before it can send messages.</p></aside><ContactForm /></div></section></main>;
}
