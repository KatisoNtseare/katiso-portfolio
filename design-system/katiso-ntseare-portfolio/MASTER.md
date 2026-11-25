# Katiso Ntseare Portfolio - Design System

This is the source of truth for public portfolio UI. Apply existing project components and tokens before adding new styles. The Engineering Playground is intentionally excluded at the owner's request; do not add it back without a new explicit request.

## Product and audience

A recruiter-facing software engineering portfolio. Recruiters should quickly understand Katiso's role, see verified evidence in published project case studies, and reach the contact or CV actions. Favor clear proof of work over claims, metrics, or decorative dashboards.

## Visual direction

**Editorial engineering folio:** a calm, light paper field, confident typography, precise dividers, real project media, and occasional structured grid texture. The visual voice is professional and authored, with a few strong ProIT red moments. Yellow Punk is a rare signal. It is not a dark or all-red site.

Use actual portfolio and project imagery. Avoid stock portraits, generic code decoration, repeated identical cards, gratuitous gradients, random badges, and animation that delays reading.

## Color tokens

| Role | Value | Use |
|---|---|---|
| Paper / Snowy White | `#FDFBFF` | Main page, navigation, light surfaces |
| Ink | `#171717` | Primary text and dark text on light surfaces |
| Red Orange | `#D92E12` | Brand links, primary buttons, selected panels and small headline accents |
| Yellow Punk | `#D5F500` | Sparse emphasis on dark/red surfaces, selection and focus indicators; avoid small text on white |
| Graphite | `#242321` | Occasional technical or footer surface, with white text |
| Soft surface | `#F3EFEC` | Secondary panels and media controls |
| Muted text | `#62625F` | Supporting text on light surfaces; use darker values if contrast is insufficient |
| Divider | `#E3D8D4` | Fine rules and component boundaries |

Use semantic `--folio-*` tokens already defined in `src/app/portfolio-design.css`. Do not substitute generated pink/cyan palettes or repeat ad hoc hex values where a token exists. Keep body copy at WCAG AA contrast (4.5:1); never rely on color alone to show state.

## Typography

Use the fonts already configured by the application: Manrope for display headings, DM Sans for body and UI, and DM Mono for short technical metadata. Do not add a new font download for a cosmetic change. Use sentence case, restrained tracking, readable line lengths, and tabular numerals only for aligned numerical data.

## Layout and spacing

- Keep the existing centered `.folio-shell` and page-specific editorial layouts.
- Preserve generous section spacing and a readable content measure; use the established `clamp()` scales rather than fixed oversized text.
- Use thin borders and image-led layouts; reserve card containers for content that needs grouping.
- Break into a stacked layout at the existing mobile breakpoints. Keep project media, navigation, tables, and controls usable without horizontal scrolling.
- Keep the public design scoped under `.public-site`; admin styles must remain unaffected.

## Components and states

- Primary action: Red Orange with Snowy White text. Secondary action: quiet outline with clear hover and focus states.
- Projects: feature real published records and their media. Vary editorial composition only when content supports it; omit absent case-study fields.
- Technology: keep the existing grouped technology list and supplied SVG icons; use consistent icon wells and meaningful alt text.
- Navigation: retain semantic links, current-route state, keyboard access, and an announced mobile menu state.
- Forms and media controls: retain visible labels, inline errors, responsive video frames, and keyboard-operable lightbox behavior.
- Loading, empty, and error states must describe the actual state; do not invent GitHub activity or project metrics.

## Motion

Use motion only to clarify entry, navigation, or a real state change. Keep existing GSAP motion subtle and short (about 150–350 ms); animate transform or opacity, not layout. Render content readable without JavaScript, respect `prefers-reduced-motion`, and clean up GSAP contexts and listeners. No scroll hijacking, continuous loops, or repeated reveal on every block.

## Accessibility and quality bar

Visible focus, logical heading order, descriptive links, semantic buttons, keyboard operation, sufficient contrast, and reduced-motion support are required. Check narrow mobile and desktop layouts after a UI change. Keep the current Next.js App Router and prefer Server Components unless interaction requires client state. Preserve MongoDB-backed projects, admin workflows, media security, contact email, GitHub integration, and CV behavior.

## Anti-patterns

No fake credentials or metrics, arbitrary skill ratings, generic testimonials, unrelated visualizations, arbitrary iframe embedding, unverified project outcomes, Playground restoration, or broad CSS overrides. Modify the smallest existing component or token set that solves the design need.