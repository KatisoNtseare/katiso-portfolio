type Props = { eyebrow: string; title: string; description?: string; dark?: boolean };
export function SectionHeading({ eyebrow, title, description, dark = false }: Props) {
  return <div className={`section-heading ${dark ? "section-heading-dark" : ""}`}><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>;
}
