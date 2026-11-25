import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy",
  description: "Read how Katiso Ntseare's portfolio handles contact details, service providers, data retention and privacy choices.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <main className="portfolio-page privacy-page">
      <section className="folio-page-hero">
        <div className="folio-shell folio-page-hero-grid">
          <div><h1 className="folio-display">Privacy matters.</h1>
          <p>How this portfolio collects, uses and protects information.</p>
          <p>Last updated: November 25, 2026</p></div>
        </div>
      </section>
      <section className="folio-content">
        <div className="folio-shell privacy-content">
          <div className="case-content">
            <section className="case-section">
              <h2>Who is responsible</h2>
              <p>Katiso Ntseare is responsible for personal information collected through this portfolio. For privacy questions or requests, email <a className="text-link" href={`mailto:${site.email}`}>{site.email}</a>.</p>
            </section>
            <section className="case-section">
              <h2>Information collected</h2>
              <p>If you submit the contact form, it collects your name, email address, optional organisation, enquiry type, subject and message. Please do not include passwords, payment details or other sensitive personal information.</p>
              <p>When you use the contact form, the site also processes your IP address to apply an abuse-prevention limit. The limit counter is held in server memory and is not saved to the portfolio&apos;s project database. The hosting provider may separately process technical data, such as IP addresses, browser details and request logs, to operate and secure the website.</p>
            </section>
            <section className="case-section">
              <h2>How information is used and shared</h2>
              <p>Contact details and message content are used to read and respond to your enquiry. The form sends messages through Resend to the portfolio&apos;s configured email inbox. The contact form does not save messages to the portfolio&apos;s project database. Resend and the email provider may process the information to deliver, secure and maintain the message.</p>
              <p>The site retrieves public profile and repository information from GitHub&apos;s API. This request is made by the website server. Project pages may also load images hosted by Cloudinary or videos embedded from Google Drive. When this media is present, those providers may receive technical information from your browser, such as your IP address and device or browser details.</p>
              <p>Personal information is not sold or used by this site for targeted advertising. Information may also be disclosed where required by law or when reasonably necessary to protect the site, its users or others.</p>
            </section>
            <section className="case-section">
              <h2>Retention and security</h2>
              <p>Contact messages are retained in the recipient&apos;s email account for as long as needed to respond and maintain relevant business correspondence, and may remain in backups. Resend, the email provider and the hosting provider may retain information under their own retention practices and policies. The site keeps contact messages out of its project database.</p>
              <p>Reasonable technical and organisational safeguards are used to protect information. However, transmission and storage over the internet cannot be guaranteed to be completely secure.</p>
            </section>
            <section className="case-section">
              <h2>Your privacy choices</h2>
              <p>Depending on the privacy laws that apply where you live, you may have the right to request access to, correction of or deletion of your personal information, or to object to or restrict certain processing. To make a request, email <a className="text-link" href={`mailto:${site.email}`}>{site.email}</a>. You may also choose not to submit the contact form, though this means the site cannot respond to your enquiry.</p>
              <p>Links to external websites are provided for convenience. Their privacy practices are governed by their own policies, which we encourage you to review.</p>
            </section>
            <section className="case-section">
              <h2>Updates to this policy</h2>
              <p>This policy may be updated when the site&apos;s services or privacy practices change. The latest version and its update date will be published on this page.</p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
