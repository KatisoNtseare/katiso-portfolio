import { ArrowDownToLine, FileText } from "lucide-react";

export function CvLink({ compact = false }: { compact?: boolean }) {
  const cvUrl = process.env.NEXT_PUBLIC_CV_URL;
  if (cvUrl) return <a className={`folio-button folio-button-light ${compact ? "folio-button-compact" : ""}`} href={cvUrl} target={cvUrl.startsWith("http") ? "_blank" : undefined} rel={cvUrl.startsWith("http") ? "noreferrer" : undefined}><ArrowDownToLine size={16} /> Download CV</a>;
  return <span className="folio-cv-pending" title="Add your PDF and set NEXT_PUBLIC_CV_URL in the environment."><FileText size={16} /> CV upload pending</span>;
}
