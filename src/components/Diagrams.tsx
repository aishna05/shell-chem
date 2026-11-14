export function ExchangerDiagram({ kind }: { kind: string }) {
  const shell = "#22d3ee"
  const tube = "#60a5fa"
  return (
    <svg viewBox="0 0 640 280" className="h-auto w-full rounded-lg border border-line bg-surface" role="img">
      <title>Shell-and-tube arrangement for this exercise</title>
      <rect x="70" y="40" width="470" height="160" rx="80" fill="none" stroke={shell} strokeWidth="3" />
      {kind === "kettle" ? <path d="M470 40 h70 v160 h-70" fill="none" stroke={shell} strokeWidth="3" /> : null}
      {Array.from({ length: 5 }, (_, index) => (
        <line key={index} x1="120" x2="500" y1={78 + index * 22} y2={78 + index * 22} stroke={tube} strokeWidth="3" />
      ))}
      {[180, 280, 380].map((x) => (
        <path key={x} d={`M ${x} 48 v104 M ${x} 168 v24`} stroke="#fbbf24" strokeWidth="4" />
      ))}
      <text x="24" y="30" fill="currentColor" fontSize="13">
        {labelFor(kind)}
      </text>
      <text x="90" y="230" fill="currentColor" fontSize="12">
        Cyan shell, blue tubes, amber segmental baffles. Arrows show the stated direction only.
      </text>
      {kind === "multipass-e" ? <text x="90" y="252" fill="currentColor" fontSize="12">Problem 12.5: water in the tubes, eight passes; ammonia vapour in the E shell.</text> : null}
      {kind === "fixed-e" ? <text x="90" y="252" fill="currentColor" fontSize="12">E shell. Problem 12.3 is one tube pass. Problem 12.4 does not fix the pass count.</text> : null}
      {kind === "horizontal-condenser" ? <text x="90" y="252" fill="currentColor" fontSize="12">Usual horizontal arrangement in Section 12.10: condensation on the shell, coolant in the tubes.</text> : null}
      {kind === "vertical-condenser" ? <text x="90" y="252" fill="currentColor" fontSize="12">Vertical condenser. Equation 12.51 replaces the horizontal row correction.</text> : null}
      {kind === "thermosyphon" ? <text x="90" y="252" fill="currentColor" fontSize="12">Vertical thermosyphon: boiling in the tubes, steam on the shell, as drawn in Figure 12.58.</text> : null}
      {kind === "kettle" || kind === "immersed" ? <text x="90" y="252" fill="currentColor" fontSize="12">Submerged U-tube bundle. Section 12.11.6. The enlarged end is the vapour space.</text> : null}
    </svg>
  )
}

function labelFor(kind: string) {
  if (kind === "multipass-e") return "E shell, multipass tubes"
  if (kind === "kettle") return "Kettle reboiler"
  if (kind === "horizontal-condenser") return "Horizontal condenser"
  if (kind === "vertical-condenser") return "Vertical condenser"
  if (kind === "partial-condenser") return "Partial condenser"
  if (kind === "thermosyphon") return "Vertical thermosyphon"
  if (kind === "immersed") return "Immersed bundle"
  return "E-shell exchanger"
}
