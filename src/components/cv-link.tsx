import { ArrowDownToLine, FileText } from "lucide-react";

export function CvLink({ compact = false }: { compact?: boolean }) {
  const cvUrl = process.env.NEXT_PUBLIC_CV_URL;
  if (cvUrl) return <a className={compact ? "button button-secondary button-small" : "button button-secondary"} href={cvUrl} target={cvUrl.startsWith("http") ? "_blank" : undefined} rel={cvUrl.startsWith("http") ? "noreferrer" : undefined}><ArrowDownToLine size={16} /> Download CV</a>;
  return <span className="cv-pending" title="Add your PDF and set NEXT_PUBLIC_CV_URL in the environment."><FileText size={16} /> CV upload pending</span>;
}
