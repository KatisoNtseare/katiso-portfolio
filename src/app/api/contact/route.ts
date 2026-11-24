import { NextResponse } from "next/server";
import { Resend } from "resend";
import { contactSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rate = checkRateLimit(`contact:${forwarded}`, 4, 60 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ message: "Too many messages have been submitted. Please try again later." }, { status: 429 });
  try {
    const parsed = contactSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message || "Please check the form and try again." }, { status: 400 });
    if (parsed.data.website) return NextResponse.json({ message: "Message received." });
    if (!process.env.RESEND_API_KEY || !process.env.CONTACT_TO_EMAIL || !process.env.CONTACT_FROM_EMAIL) {
      return NextResponse.json({ message: "The contact form is not connected yet. Please configure the email settings or use the social links." }, { status: 503 });
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL,
      to: [process.env.CONTACT_TO_EMAIL],
      replyTo: parsed.data.email,
      subject: `[Portfolio] ${parsed.data.enquiryType}: ${parsed.data.subject}`,
      text: [
        `Name: ${parsed.data.name}`,
        `Email: ${parsed.data.email}`,
        `Organisation: ${parsed.data.organisation || "Not provided"}`,
        `Enquiry: ${parsed.data.enquiryType}`,
        `Subject: ${parsed.data.subject}`,
        "",
        parsed.data.message,
      ].join("\n"),
    });
    if (error) return NextResponse.json({ message: "The email provider could not deliver the message. Please try again later." }, { status: 502 });
    return NextResponse.json({ message: "Your message has been sent." });
  } catch {
    return NextResponse.json({ message: "The message could not be processed." }, { status: 500 });
  }
}
