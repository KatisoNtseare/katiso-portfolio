export function ArchitectureFlow({ nodes }: { nodes: string[] }) {
  if (nodes.length < 2) return null;
  return (
    <ol className="k-flow" aria-label={`Architecture flow: ${nodes.join(" to ")}`}>
      {nodes.map((node, index) => (
        <li key={`${node}-${index}`}>
          <div><span>{String(index + 1).padStart(2, "0")}</span><strong>{node}</strong></div>
        </li>
      ))}
    </ol>
  );
}