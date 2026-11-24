import { ArrowRight } from "lucide-react";

export function ArchitectureFlow({ nodes }: { nodes: string[] }) {
  if (nodes.length < 2) return null;
  return <div className="project-flow" aria-label={`Architecture flow: ${nodes.join(" to ")}`}>
    {nodes.map((node, index) => <div className="project-flow-part" key={`${node}-${index}`}>
      <div className="project-flow-node"><span>0{index + 1}</span><strong>{node}</strong></div>
      {index < nodes.length - 1 ? <ArrowRight className="project-flow-arrow" size={17} /> : null}
    </div>)}
  </div>;
}
