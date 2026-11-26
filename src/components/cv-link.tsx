import { ArrowDownToLine } from "lucide-react";

export function CvLink() {
  const cvUrl = process.env.NEXT_PUBLIC_CV_URL || "/documents/katiso-ntseare-cv.pdf";
  return (
    <a className="k-btn k-btn-ghost" href={cvUrl} download="katiso-ntseare-cv.pdf">
      <ArrowDownToLine size={16} aria-hidden="true" /> Download CV
    </a>
  );
}