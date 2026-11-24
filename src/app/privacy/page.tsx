import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy information for the Katiso Ntseare portfolio website.",
};

export default function PrivacyPage() {
  return (
    <main className="portfolio-page privacy-page">
      <section className="folio-page-hero">
        <div className="folio-shell folio-page-hero-grid">
          <div><span className="folio-kicker">Privacy information</span>
          <h1 className="folio-display">Privacy matters.</h1>
          <p>This page explains how information submitted through this portfolio is intended to be handled.</p></div>
        </div>
      </section>
      <section className="folio-content">
        <div className="folio-shell privacy-content">
          <div className="case-content">
            <section className="case-section">
              <h2>Information submitted</h2>
              <p>If you use the contact form, the site asks for your name, email address, organisation (optional), enquiry category, subject and message. Do not include passwords, payment information or other sensitive details.</p>
            </section>
            <section className="case-section">
              <h2>How information is used</h2>
              <p>Contact details are used to review and respond to the enquiry. The form is designed to send messages to the portfolio owner&apos;s configured inbox through the email provider configured by the site operator.</p>
            </section>
            <section className="case-section">
              <h2>Service providers and technical data</h2>
              <p>The website may use GitHub&apos;s public API to retrieve public profile and repository information. The hosting provider may process technical request data such as IP addresses and server logs for security and service operation. The contact form uses Resend only when the operator has configured it.</p>
            </section>
            <section className="case-section">
              <h2>Retention and security</h2>
              <p>Contact messages may remain in the receiving email inbox according to the operator&apos;s retention practices. Reasonable technical measures should be maintained, including HTTPS, restricted access to server configuration and regular security updates. No website can guarantee absolute security.</p>
            </section>
            <section className="case-section">
              <h2>Your choices and questions</h2>
              <p>You can choose not to submit the contact form. For questions or requests relating to a message you have sent, use the <Link href="/contact" className="text-link">contact page</Link>.</p>
            </section>
            <section className="case-section">
              <h2>Site operator review required</h2>
              <p>This is a starter privacy notice. Before launch, the site operator must verify that it accurately reflects the hosting provider, email provider, logging, retention and data-handling practices actually used, and update it to meet applicable privacy laws.</p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
