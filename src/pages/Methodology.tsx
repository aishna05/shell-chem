import { useState } from "react"
import { Link } from "react-router-dom"
import { MathText } from "../components/MathText"

type Figure = { src: string; caption: string }

type Node = {
  id: string
  title: string
  summary: string
  equations: { tex: string; source: string; notes: string }[]
  rules: string[]
  figures: Figure[]
}

const nodes: Node[] = [
  {
    id: "duty",
    title: "1. Duty and energy balance",
    summary: "Fix the heat-transfer rate before any area is chosen. Use only the stream the problem actually specifies.",
    equations: [
      {
        tex: "Q = m c_p \\Delta T",
        source: "Sensible-heat duty, used throughout Section 12.9. m in kg/s, cp in kJ/kg°C, Q in kW.",
        notes: "Convert kg/h by dividing by 3600. A vapour that is given a specific heat and no latent heat is a sensible stream.",
      },
      {
        tex: "Q = m \\lambda",
        source: "Latent duty for isothermal condensation or vaporisation, Section 12.10 and Section 12.11. λ in kJ/kg gives Q in kW when m is in kg/s.",
        notes: "A condenser that also subcools is split. Section 12.10.7 does not put the whole duty through one isothermal mean difference.",
      },
    ],
    rules: [
      "The two streams carry the same duty once losses are neglected. The chapter’s worked examples state a heat loss only when they include one.",
      "Do not borrow a specific heat from a different example.",
    ],
    figures: [],
  },
  {
    id: "lmtd",
    title: "2. LMTD and Ft correction",
    summary: "Equation 12.1 uses the corrected mean temperature difference. For one shell pass and an even number of tube passes, Ft comes from equation 12.8, which is plotted as Figure 12.19.",
    equations: [
      {
        tex: "\\Delta T_{lm}=\\frac{(T_1-t_2)-(T_2-t_1)}{\\ln[(T_1-t_2)/(T_2-t_1)]}",
        source: "Equation 12.4, p. 655. T is the shell fluid and t is the tube fluid. This is the counter-current mean.",
        notes: "Both terminal differences must be positive. A zero or negative argument means the temperatures cross.",
      },
      {
        tex: "R=\\frac{T_1-T_2}{t_2-t_1},\\quad S=\\frac{t_2-t_1}{T_1-t_1}",
        source: "Equations 12.6 and 12.7, pp. 655–656.",
        notes: "Swapping the shell and tube fluids changes both ratios.",
      },
      {
        tex: "\\Delta T_m = F_t\\,\\Delta T_{lm}",
        source: "Equation 12.5, p. 655. Ft is 1 for pure counter-current flow and for isothermal condensation or boiling.",
        notes: "The book says an economic one-shell design is not normally made when Ft falls below about 0.75.",
      },
      {
        tex: "\\Delta T_{lm}=\\frac{(T_{sat}-t_1)-(T_{sat}-t_2)}{\\ln[(T_{sat}-t_1)/(T_{sat}-t_2)]}",
        source: "Equation 12.57, p. 717, for an isothermal condenser.",
        notes: "Use this only for the condensing zone. A desuperheating or subcooling zone has its own mean.",
      },
    ],
    rules: [
      "Figure 12.19 is one shell pass and an even number of tube passes. Figure 12.20 is two shell passes. Figure 12.21 is a divided-flow shell.",
      "If the curves do not intersect, equation 12.8 has no real value. Example 12.2 (R = 8, S = 0.12) is that case.",
    ],
    figures: [
      {
        src: "/book-assets/fig-12-19-ft-one-shell.png",
        caption: "Figure 12.19, book p. 657. One shell pass; two or more even tube passes.",
      },
      {
        src: "/book-assets/fig-12-20-ft-two-shell.png",
        caption: "Figures 12.20 and 12.21, book p. 658. Two shell passes, and a divided-flow shell.",
      },
    ],
  },
  {
    id: "area",
    title: "3. Trial overall coefficient and area",
    summary: "A design starts from an assumed overall coefficient. A rating starts from the installed area and later compares the calculated coefficient with the value implied by the duty.",
    equations: [
      {
        tex: "Q = U_o A_o \\Delta T_m",
        source: "Equation 12.1, p. 635. Q in W, Uo in W/m²°C, Ao in m², ΔTm in °C.",
        notes: "The area in this equation is the outside tube area when U is the outside overall coefficient.",
      },
      {
        tex: "A_o = N_t \\pi d_o L",
        source: "Outside surface of plain tubes. do and L in metres.",
        notes: "For a U-tube bundle the book’s equation 12.74 note counts Nt as twice the number of U-tubes when that equation is used.",
      },
      {
        tex: "\\frac{1}{U_o}=\\frac{1}{h_o}+\\frac{1}{h_{od}}+\\frac{d_o\\ln(d_o/d_i)}{2k_w}+\\frac{d_o}{d_i}\\frac{1}{h_{id}}+\\frac{d_o}{d_i}\\frac{1}{h_i}",
        source: "Equation 12.2, p. 635. kw from Table 12.6. Fouling resistances from Table 12.2 only when the fluid is named there.",
        notes: "Carbon steel is 45 W/m°C at 0°C and at 100°C. Stainless steel (18/8) is 16 W/m°C.",
      },
    ],
    rules: [
      "Figure 12.1 is a first estimate of U. Join the process duty to the service fluid and read the centre scale. It is not a calculated coefficient.",
      "Figure A accepts the trial when the calculated overall coefficient is within 30 per cent of the assumed value, on the positive side of that test.",
    ],
    figures: [
      { src: "/book-assets/fig-12-1-overall-coefficient.png", caption: "Figure 12.1, book p. 639. Estimated overall coefficient." },
      { src: "/book-assets/table-12-2-fouling.png", caption: "Table 12.2, book p. 640. Fouling factors. Ranges, not single design values." },
      { src: "/book-assets/table-12-6-conductivity.png", caption: "Table 12.6, book p. 662. Conductivity of metals." },
    ],
  },
  {
    id: "layout",
    title: "4. Tube layout and passes",
    summary: "The layout fixes the flow area, the equivalent diameter and which Ft chart applies.",
    equations: [
      {
        tex: "A_s=\\frac{(p_t-d_o)D_s l_B}{p_t}",
        source: "Equation 12.21, p. 672. Cross-flow area at the shell equator.",
        notes: "pt, do, Ds and lB are in metres.",
      },
      {
        tex: "d_e=\\frac{1.10}{d_o}(p_t^2-0.917 d_o^2)",
        source: "Equation 12.23, p. 672. Equilateral triangular pitch.",
        notes: "Square pitch uses equation 12.22: de = 1.27/do (pt² − 0.785 do²).",
      },
    ],
    rules: [
      "Baffle cut in the Kern procedure is chosen with the curves on Figures 12.29 and 12.30. The exercises that specify 25 per cent cut are read on that curve.",
      "Baffle spacing appears in As and in the number of bundle crossings L/lB.",
      "Tube-side velocity is the flow per pass divided by the flow area of the tubes in one pass.",
    ],
    figures: [],
  },
  {
    id: "tube",
    title: "5. Tube-side coefficient and pressure drop",
    summary: "Water in tubes may use the book’s simplified equation. Other fluids use the tube-side jh chart. The friction factor is a different chart.",
    equations: [
      {
        tex: "h_i=\\frac{4200(1.35+0.02t)\\,u_t^{0.8}}{d_i^{0.2}}",
        source: "Equation 12.17, p. 666. Water only. t in °C, ut in m/s, di in mm, hi in W/m²°C.",
        notes: "The diameter in this equation is in millimetres. Do not insert metres.",
      },
      {
        tex: "\\Delta P_t=N_p\\left[8j_f\\left(\\frac{L}{d_i}\\right)\\left(\\frac{\\mu}{\\mu_w}\\right)^{-m}+2.5\\right]\\frac{\\rho u_t^2}{2}",
        source: "Equation 12.20, p. 667. m = 0.25 for laminar flow and 0.14 for turbulent flow. jf is read from Figure 12.24.",
        notes: "The 2.5 velocity heads per pass is the book’s allowance for entry, exit and turnaround.",
      },
    ],
    rules: [
      "Figure 12.23 is the tube-side heat-transfer factor. Figure 12.24 is the tube-side friction factor. They are not interchangeable with Figures 12.29 and 12.30.",
      "A gas nozzle loss is additional. The chapter treats it as significant for gases and often negligible for liquids.",
    ],
    figures: [
      { src: "/book-assets/fig-12-23-tube-jh.png", caption: "Figure 12.23, book p. 665. Tube-side heat-transfer factor." },
      { src: "/book-assets/fig-12-24-tube-jf.png", caption: "Figure 12.24, book p. 668. Tube-side friction factor." },
    ],
  },
  {
    id: "shell",
    title: "6. Shell-side coefficient and pressure drop",
    summary: "Kern’s method in Section 12.9.3. The heat-transfer and friction factors are read, not calculated.",
    equations: [
      {
        tex: "Re=\\frac{G_s d_e}{\\mu},\\quad G_s=\\frac{W_s}{A_s}",
        source: "Equation 12.24, p. 672. Ws in kg/s, μ in N s/m².",
        notes: "Section 12.7.1 treats the shell side as turbulent above about Re = 200.",
      },
      {
        tex: "\\frac{h_s d_e}{k}=j_h\\,Re\\,Pr^{1/3}\\left(\\frac{\\mu}{\\mu_w}\\right)^{0.14}",
        source: "Equation 12.25, p. 673. jh from Figure 12.29 at the calculated Re, the baffle cut and the tube arrangement.",
        notes: "Pr = cp μ / k, with cp in J/kg°C.",
      },
      {
        tex: "\\Delta P_s=8j_f\\left(\\frac{D_s}{d_e}\\right)\\left(\\frac{L}{l_B}\\right)\\frac{\\rho u_s^2}{2}\\left(\\frac{\\mu}{\\mu_w}\\right)^{-0.14}",
        source: "Equation 12.26, p. 675. jf from Figure 12.30.",
        notes: "Shell-nozzle loss is 1½ velocity heads at the inlet and ½ at the outlet, based on the smaller of the nozzle area and the adjacent-row free area.",
      },
    ],
    rules: [
      "Read the curve for the stated baffle cut and for triangular or square pitch. Do not copy a jh printed in a worked example.",
      "Bell’s method in Section 12.9.4 is a different procedure. The exercise ratings follow Section 12.9.3.",
    ],
    figures: [
      { src: "/book-assets/fig-12-29-shell-jh.png", caption: "Figure 12.29, book p. 673. Shell-side heat-transfer factors, segmental baffles." },
      { src: "/book-assets/fig-12-30-shell-jf.png", caption: "Figure 12.30, book p. 674. Shell-side friction factors, segmental baffles." },
    ],
  },
  {
    id: "check",
    title: "7. Calculated U, pressure drop and iteration",
    summary: "Compare the coefficient from equation 12.2 with the coefficient implied by equation 12.1. Then compare both pressure drops with the stated limits.",
    equations: [
      {
        tex: "U_{o,\\,duty}=\\frac{Q}{A_o\\Delta T_m}",
        source: "Equation 12.1 rearranged. This is the coefficient the installed area must provide.",
        notes: "Overdesign is the excess of installed area over Q/(Ucalc ΔTm), once Ucalc exists. It is not reported while a film coefficient is still missing.",
      },
    ],
    rules: [
      "Figure A returns to the assumed coefficient when the calculated value is outside the 30 per cent band, and it changes the layout when a pressure drop is outside the specification.",
      "A condenser uses Section 12.10. A kettle or thermosyphon uses Section 12.11. Those sections do not reuse the single-phase shell j-factors.",
      "Where a saturation temperature, a property, or a chart ordinate is absent, the specification sheet stays open.",
    ],
    figures: [
      { src: "/book-assets/figure-a-design-algorithm.png", caption: "Figure A, book p. 684. Design procedure for shell-and-tube heat exchangers." },
    ],
  },
]

export function Methodology() {
  const [open, setOpen] = useState("duty")
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-surface p-6 shadow-[var(--shadow)]">
        <p className="text-xs font-medium tracking-[0.14em] text-accent uppercase">Chapter 12</p>
        <h2 className="mt-1 text-2xl font-semibold">Shell-and-tube design method</h2>
        <p className="mt-3 max-w-3xl text-muted">
          The sequence below is the single-phase sizing and rating path in Sections 12.2, 12.6 and 12.9.3, with the condenser and reboiler branches named where the exercises leave that path. Every equation is from the chapter. Open a stage to see the formula, the units, and the figure used at that stage.
        </p>
        <Link to="/exercises" className="mt-5 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-slate-950">
          Open the solved problems
        </Link>
      </section>
      <ol className="space-y-3">
        {nodes.map((node) => {
          const expanded = open === node.id
          return (
            <li key={node.id} className="rounded-xl border border-line bg-surface">
              <button
                type="button"
                className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpen(expanded ? "" : node.id)}
                aria-expanded={expanded}
              >
                <span>
                  <span className="block font-semibold">{node.title}</span>
                  <span className="mt-1 block text-sm text-muted">{node.summary}</span>
                </span>
                <span className="text-sm text-accent">{expanded ? "Hide" : "Open"}</span>
              </button>
              {expanded ? (
                <div className="space-y-4 border-t border-line px-5 py-4">
                  {node.equations.map((equation) => (
                    <div key={equation.tex} className="rounded-lg bg-surface-2 px-4 py-3">
                      <MathText tex={equation.tex} display />
                      <p className="text-sm">{equation.source}</p>
                      <p className="mt-1 text-sm text-muted">{equation.notes}</p>
                    </div>
                  ))}
                  <ul className="space-y-2">
                    {node.rules.map((rule) => (
                      <li key={rule} className="rounded-md border border-line px-3 py-2 text-sm">{rule}</li>
                    ))}
                  </ul>
                  <div className="grid gap-4">
                    {node.figures.map((figure) => (
                      <figure key={figure.src} className="overflow-hidden rounded-lg border border-line bg-white text-slate-900">
                        <img src={figure.src} alt={figure.caption} className="max-h-[36rem] w-full object-contain" />
                        <figcaption className="border-t border-slate-200 px-3 py-2 text-sm">{figure.caption}</figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
