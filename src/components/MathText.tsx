import katex from "katex"

export function MathText({ tex, display = false }: { tex: string; display?: boolean }) {
  const html = katex.renderToString(tex, {
    throwOnError: false,
    displayMode: display,
  })
  return <span className={display ? "math-display" : undefined} dangerouslySetInnerHTML={{ __html: html }} />
}
