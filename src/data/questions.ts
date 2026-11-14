import {
  correctionFactor,
  crossflowArea,
  equivalentDiameterTriangular,
  lmtdCounter,
  nozzleVelocity,
  outsideArea,
  sensibleDuty,
  shellReynolds,
  sig,
  temperatureRatios,
  type Calc,
} from "../calculations/textbook"
import type { CalculatorRow, Question, Step } from "./types"
import { moreQuestions } from "./moreQuestions"

function computed(
  id: string,
  title: string,
  why: string,
  formulaTex: string,
  source: string,
  variables: Step["variables"],
  calc: Extract<Calc, { ok: true }>,
  verification: string,
  mistake: string,
): Step {
  return {
    id,
    title,
    why,
    formulaTex,
    source,
    variables,
    substitutionTex: calc.substitution,
    arithmetic: calc.lines,
    resultText: calc.unit === "—" ? sig(calc.value) : `${sig(calc.value)} ${calc.unit}`,
    value: calc.value,
    unit: calc.unit,
    verification,
    mistake,
    status: "computed",
  }
}

function blocked(
  id: string,
  title: string,
  why: string,
  formulaTex: string,
  source: string,
  variables: Step["variables"],
  reason: string,
  mistake: string,
  arithmetic: string[] = [],
): Step {
  return {
    id,
    title,
    why,
    formulaTex,
    source,
    variables,
    substitutionTex: reason,
    arithmetic: arithmetic.length > 0 ? arithmetic : [reason],
    resultText: "Not calculated. The PDF does not contain a required value.",
    value: null,
    unit: "",
    verification: "Stopped rather than inserting a value from outside this chapter.",
    mistake,
    status: "blocked",
  }
}

function chartStep(
  id: string,
  title: string,
  why: string,
  formulaTex: string,
  source: string,
  variables: Step["variables"],
  instruction: string,
  mistake: string,
): Step {
  return {
    id,
    title,
    why,
    formulaTex,
    source,
    variables,
    substitutionTex: instruction,
    arithmetic: [instruction],
    resultText: "Chart value not digitized.",
    value: null,
    unit: "",
    verification: "Requires chart or source verification. No number has been read off the figure by this program.",
    mistake,
    status: "chart",
  }
}

function must<T extends Calc>(calc: T, label: string): Extract<T, { ok: true }> {
  if (!calc.ok) throw new Error(`${label} failed: ${calc.reason}`)
  return calc as Extract<T, { ok: true }>
}

const ammoniaDuty = must(
  sensibleDuty({ massFlowKgH: 4500, cpKJ: 2.418, hotIn: 120, hotOut: 40 }),
  "12.5 duty",
)
const ammoniaLmtd = must(lmtdCounter(120, 40, 30, 40), "12.5 LMTD")
const ammoniaRatios = must(temperatureRatios(120, 40, 30, 40), "12.5 ratios")
const ammoniaFt = must(correctionFactor(ammoniaRatios.R ?? 0, ammoniaRatios.S ?? 0), "12.5 Ft")
const ammoniaArea = must(outsideArea(360, 0.019, 2.4), "12.5 area")
const ammoniaAs = must(crossflowArea(0.02375, 0.019, 0.59, 0.3), "12.5 As")
const ammoniaDe = must(equivalentDiameterTriangular(0.02375, 0.019), "12.5 de")
const ammoniaFlow = must(
  shellReynolds({
    massFlowKgS: 4500 / 3600,
    areaM2: ammoniaAs.value,
    density: 4.03,
    viscosity: 1.21e-5,
    equivalentDiameterM: ammoniaDe.value,
    cp: 2418,
    conductivity: 0.0317,
  }),
  "12.5 Re",
)
const ammoniaNozzle = must(nozzleVelocity(4500 / 3600, 4.03, 0.15), "12.5 nozzle")

const geometry123Area = must(outsideArea(124, 0.019, 4.094), "12.3 area")
const geometry123As = must(crossflowArea(0.024, 0.019, 0.337, 0.106), "12.3 As")
const geometry123De = must(equivalentDiameterTriangular(0.024, 0.019), "12.3 de")

function rowsFrom(entries: [string, Calc][]): CalculatorRow[] {
  return entries.map(([label, calc]) => ({
    label,
    status: calc.ok ? "computed" : "blocked",
    text: calc.ok ? `${sig(calc.value)} ${calc.unit}`.trim() : calc.reason,
  }))
}

export const questions: Question[] = [
  {
    id: "12.3",
    title: "Rate an existing E-shell water heater",
    kind: "Rating",
    bookPages: "790",
    pdfPages: "157",
    statement: [
      "In a food processing plant there is a requirement to heat 50,000 kg/h of towns water from 10 to 70°C. Steam at 2.7 bar is available for heating the water.",
      "An existing heat exchanger is available, with the following specification:",
      "Shell inside diameter 337 mm, E type.",
      "Baffles 25 per cent cut, set at a spacing of 106 mm.",
      "Tubes 15 mm inside diameter, 19 mm outside diameter, 4094 mm long.",
      "Tube pitch 24 mm, triangular.",
      "Number of tubes 124, arranged in a single pass.",
      "Would this exchanger be suitable for the specified duty?",
    ],
    understand: {
      asking: "The question asks whether one stated exchanger can heat the stated water flow with steam at 2.7 bar. It is a rating problem: the geometry is fixed and the duty is fixed.",
      type: "Single-pass E-shell rating, with steam as the heating medium.",
      provided: "Water flow and temperatures, steam pressure, and the complete bundle geometry are printed. Physical properties are not printed.",
      calculate: "The suitability decision needs the duty, the mean temperature difference, the outside area, the film coefficients, the overall coefficient, and the pressure drops. Only the geometric part can be calculated from this PDF.",
      procedure: "Section 12.2 gives the design and rating sequence. Kern’s shell-side method is Section 12.9.3. Because one fluid is condensing steam, Section 12.10.5 allows a conservative steam coefficient of 8000 W/m²°C once the steam temperature is known. Equation 12.17 is the water-side coefficient.",
      why: "The geometry matches an E shell with segmental baffles, so Kern’s method is the chapter’s procedure. The steam pressure alone does not give the saturation temperature; the chapter uses steam tables for that, and no steam table is printed here.",
      strategy: [
        "Fix the duty from the water flow and its specific heat.",
        "Find the steam saturation temperature at 2.7 bar and decide which fluid is in the tubes.",
        "Calculate the logarithmic mean. For isothermal steam, Section 12.10.6 uses equation 12.57 and does not apply Ft.",
        "Calculate the installed outside area and compare UA with the duty.",
        "Calculate the water-side coefficient and pressure drop, then decide suitability.",
      ],
    },
    given: [
      { quantity: "Water mass flow", symbol: "W", value: "50000", unit: "kg/h" },
      { quantity: "Water inlet", symbol: "t1", value: "10", unit: "°C" },
      { quantity: "Water outlet", symbol: "t2", value: "70", unit: "°C" },
      { quantity: "Steam pressure", symbol: "P", value: "2.7", unit: "bar" },
      { quantity: "Shell inside diameter", symbol: "Ds", value: "337", unit: "mm" },
      { quantity: "Baffle cut", symbol: "Bc", value: "25", unit: "%" },
      { quantity: "Baffle spacing", symbol: "lB", value: "106", unit: "mm" },
      { quantity: "Tube inside diameter", symbol: "di", value: "15", unit: "mm" },
      { quantity: "Tube outside diameter", symbol: "do", value: "19", unit: "mm" },
      { quantity: "Tube length", symbol: "L", value: "4094", unit: "mm" },
      { quantity: "Tube pitch", symbol: "pt", value: "24", unit: "mm" },
      { quantity: "Number of tubes", symbol: "Nt", value: "124", unit: "—" },
      { quantity: "Tube passes", symbol: "Np", value: "1", unit: "—" },
    ],
    conversions: ["337 mm = 0.337 m", "106 mm = 0.106 m", "15 mm = 0.015 m", "19 mm = 0.019 m", "4094 mm = 4.094 m", "24 mm = 0.024 m"],
    assumptions: [
      "The printed geometry is used exactly. No tube-sheet thickness is deducted because the problem gives 4094 mm as the tube length.",
      "Fluid allocation is not printed. Section 12.10 says condensing steam is usually placed in the tubes of a heater, but that choice is not made numerically here.",
    ],
    missing: [
      "Specific heat, density, viscosity and conductivity of towns water.",
      "Saturation temperature and latent heat of steam at 2.7 bar. The chapter refers to steam tables, which are not in this PDF.",
      "Whether the towns water is hard or soft. Table 12.2 gives ranges for both, not one value.",
    ],
    formulaIds: ["12.1", "12.17", "12.21", "12.23", "12.57"],
    steps: [
      computed(
        "area",
        "Installed outside area",
        "Equation 12.1 needs the surface that is actually installed. For a plain tube the usual design area is the outside area.",
        "A_o = N_t \\pi d_o L",
        "Section 12.2 and Example 12.1, which calculates the area of one tube as π do L.",
        [
          { symbol: "N_t", meaning: "124 tubes" },
          { symbol: "d_o", meaning: "0.019 m" },
          { symbol: "L", meaning: "4.094 m" },
        ],
        geometry123Area,
        "The area is larger than one tube and smaller than a few hundred square metres, which is reasonable for 124 tubes about 4 m long.",
        "Using the inside diameter, or forgetting π.",
      ),
      computed(
        "as",
        "Shell-side cross-flow area",
        "If the water or another single-phase fluid is placed on the shell, Kern’s method starts from the equatorial cross-flow area.",
        "A_s = (p_t-d_o)D_s l_B / p_t",
        "Equation 12.21, Section 12.9.3, p. 672.",
        [
          { symbol: "p_t", meaning: "0.024 m" },
          { symbol: "d_o", meaning: "0.019 m" },
          { symbol: "D_s", meaning: "0.337 m" },
          { symbol: "l_B", meaning: "0.106 m" },
        ],
        geometry123As,
        "The clearance ratio (0.024−0.019)/0.024 is about 0.21, so As is much smaller than the empty shell area. That is what equation 12.21 is meant to do.",
        "Using πDs²/4 as the flow area.",
      ),
      computed(
        "de",
        "Triangular-pitch equivalent diameter",
        "The shell-side Reynolds number uses the equivalent diameter defined by Kern for the stated pitch.",
        "d_e = 1.10(p_t^2 - 0.917 d_o^2)/d_o",
        "Equation 12.23, Section 12.9.3, p. 672.",
        [
          { symbol: "p_t", meaning: "0.024 m" },
          { symbol: "d_o", meaning: "0.019 m" },
        ],
        geometry123De,
        "de is smaller than the tube pitch and of the same order as the tube diameter, which is the expected magnitude.",
        "Using the square-pitch equation 12.22 for a triangular layout.",
      ),
      blocked(
        "duty",
        "Heat duty",
        "The water temperature rise is known, but Q = m cp ΔT cannot be evaluated until cp is known.",
        "Q = m c_p (t_2-t_1)",
        "The sensible-heat duty used in Example 12.1. No water specific heat is printed in Problem 12.3 or in a property table in this chapter.",
        [
          { symbol: "m", meaning: "50000/3600 kg/s, which is known" },
          { symbol: "c_p", meaning: "Not printed" },
        ],
        "Towns-water specific heat is not given in this PDF.",
        "Inserting 4.2 kJ/kg°C because it appeared in a different example.",
      ),
      blocked(
        "lmtd",
        "Mean temperature difference",
        "Steam at a stated pressure condenses isothermally only after its saturation temperature is known.",
        "\\Delta T_{lm} = (t_2-t_1)/\\ln[(T_{sat}-t_1)/(T_{sat}-t_2)]",
        "Equation 12.57, Section 12.10.6, p. 717. Tsat at 2.7 bar is not printed.",
        [{ symbol: "T_{sat}", meaning: "Not printed" }],
        "The saturation temperature of steam at 2.7 bar is not in this PDF.",
        "Assuming 100°C because that is the saturation temperature at 1 atm, not at 2.7 bar.",
      ),
    ],
    verification: "Incomplete due to missing source information",
    verificationNote: "The three geometric results were recalculated from equations 12.21 and 12.23 and from π do L. The duty, LMTD, coefficients and suitability are not completed because the required properties are not in the PDF. There is no answer key.",
    finals: [
      { label: "Outside area", text: `${sig(geometry123Area.value)} m²` },
      { label: "Cross-flow area", text: `${sig(geometry123As.value)} m²` },
      { label: "Equivalent diameter", text: `${sig(geometry123De.value)} m` },
      { label: "Suitable?", text: "Cannot be decided from this PDF." },
    ],
    diagram: "fixed-e",
    practice: [
      {
        id: "area",
        prompt: "Calculate the outside heat-transfer area in m².",
        expected: geometry123Area.value,
        unit: "m²",
        relTolerance: 0.01,
        absTolerance: 0.05,
        hints: [
          "Use the outside surface of every tube.",
          "Ao = Nt π do L.",
          "124 × π × 0.019 × 4.094.",
        ],
      },
    ],
    mistakes: [
      {
        id: "inside",
        prompt: "A solution uses the inside diameter for the installed area. What is wrong?",
        wrongWorking: "A = 124 × π × 0.015 × 4.094.",
        correctId: "area",
        explanation: "Example 12.1 bases the tube area on the outside diameter. The inside diameter is used later for the tube-side velocity and for equation 12.17.",
      },
    ],
    revision: {
      objective: "Rate a fully specified one-pass E shell, and stop when a property is absent.",
      formulas: ["Ao = Nt π do L", "Equation 12.21", "Equation 12.23", "Equation 12.57 once Tsat is known"],
      sequence: ["Area", "As", "de", "Duty, blocked", "LMTD, blocked"],
      intermediates: [`Ao = ${sig(geometry123Area.value)} m²`, `As = ${sig(geometry123As.value)} m²`, `de = ${sig(geometry123De.value)} m`],
      mistakes: ["Using di for the outside area.", "Inventing a steam temperature."],
      finalAnswer: "Geometry only. Suitability is not determined.",
    },
    checklist: [
      "Are diameters in metres in equations 12.21 and 12.23?",
      "Was the triangular-pitch equation used?",
      "Is any property value traceable to this PDF?",
    ],
    calculator: {
      inputs: [
        { key: "nt", label: "Number of tubes", unit: "—", textbook: 124 },
        { key: "do", label: "Outside diameter", unit: "m", textbook: 0.019 },
        { key: "L", label: "Length", unit: "m", textbook: 4.094 },
        { key: "pt", label: "Pitch", unit: "m", textbook: 0.024 },
        { key: "Ds", label: "Shell inside diameter", unit: "m", textbook: 0.337 },
        { key: "lB", label: "Baffle spacing", unit: "m", textbook: 0.106 },
      ],
      run(values) {
        return rowsFrom([
          ["Outside area", outsideArea(values.nt, values.do, values.L)],
          ["Cross-flow area", crossflowArea(values.pt, values.do, values.Ds, values.lB)],
          ["Equivalent diameter", equivalentDiameterTriangular(values.pt, values.do)],
        ])
      },
    },
  },
  {
    id: "12.4",
    title: "Design a shell-and-tube ethanol heater",
    kind: "Design",
    bookPages: "790–791",
    pdfPages: "157–158",
    statement: [
      "Design a shell and tube exchanger to heat 50,000 kg/h of liquid ethanol from 20°C to 80°C. Steam at 1.5 bar is available for heating. Assign the ethanol to the tube-side. The total pressure drop must not exceed 0.7 bar for the alcohol stream.",
      "Plant practice requires the use of carbon steel tubes, 25 mm inside diameter, 29 mm outside diameter, 4 m long.",
      "Set out your design on a data sheet and make a rough sketch of the heat exchanger.",
      "The physical properties of ethanol can be readily found in the literature.",
    ],
    understand: {
      asking: "The question asks for a complete thermal design, a data sheet, and a sketch. The tube diameter, length, material and the ethanol allocation are fixed. The shell diameter, tube count, passes and baffle spacing are not.",
      type: "Open shell-and-tube design with an isothermal steam heating medium and a tube-side pressure-drop limit.",
      provided: "Ethanol flow and temperatures, steam pressure, tube-side allocation, pressure-drop limit, and the required tube size.",
      calculate: "Duty, steam temperature, LMTD, trial area, tube count, tube-side coefficient and pressure drop, and a check against 0.7 bar. None of the numerical design can start, because the ethanol properties and the steam saturation temperature are outside this PDF.",
      procedure: "The eleven-step procedure in Section 12.2. Ethanol stays in the tubes as instructed. Steam is therefore on the shell side. Section 12.10.5 gives the usual steam coefficient once Tsat is known. Tube-side pressure drop is equation 12.20. Carbon-steel conductivity is 45 W/m°C in Table 12.6.",
      why: "The problem explicitly says “design a shell and tube exchanger” and fixes the tube-side fluid. The same section says the physical properties are to be found in the literature, so they are not part of this PDF.",
      strategy: [
        "Calculate the ethanol duty.",
        "Read Tsat at 1.5 bar and evaluate the isothermal mean temperature difference.",
        "Choose a trial U from Table 12.1 or Figure 12.1 and find a trial area.",
        "Choose the pass count so that the ethanol velocity is reasonable and ΔP is below 0.7 bar.",
        "Iterate U and the layout. Record the result on a data sheet and sketch the exchanger.",
      ],
    },
    given: [
      { quantity: "Ethanol flow", symbol: "m", value: "50000", unit: "kg/h" },
      { quantity: "Ethanol inlet", symbol: "t1", value: "20", unit: "°C" },
      { quantity: "Ethanol outlet", symbol: "t2", value: "80", unit: "°C" },
      { quantity: "Steam pressure", symbol: "P", value: "1.5", unit: "bar" },
      { quantity: "Maximum ethanol pressure drop", symbol: "ΔPt", value: "0.7", unit: "bar" },
      { quantity: "Tube inside diameter", symbol: "di", value: "25", unit: "mm" },
      { quantity: "Tube outside diameter", symbol: "do", value: "29", unit: "mm" },
      { quantity: "Tube length", symbol: "L", value: "4", unit: "m" },
      { quantity: "Tube material", symbol: "kw", value: "carbon steel", unit: "Table 12.6 gives 45 W/m°C at 0°C and 100°C" },
    ],
    conversions: ["25 mm = 0.025 m", "29 mm = 0.029 m", "0.7 bar = 70000 Pa"],
    assumptions: ["Ethanol is allocated to the tubes because the problem says so.", "The design is not given a unique shell diameter by the problem."],
    missing: [
      "Ethanol specific heat, density, viscosity and thermal conductivity. The problem says to find them in the literature.",
      "Saturation temperature and latent heat of steam at 1.5 bar.",
    ],
    formulaIds: ["12.1", "12.2", "12.17", "12.20", "12.57"],
    steps: [
      blocked(
        "duty",
        "Ethanol duty",
        "The flow and temperature change are known. The specific heat is not.",
        "Q = m c_p (80-20)",
        "Problem 12.4, p. 790. The problem explicitly sends the properties to the literature.",
        [
          { symbol: "m", meaning: "50000/3600 = 13.889 kg/s" },
          { symbol: "ΔT", meaning: "60°C" },
          { symbol: "c_p", meaning: "Not in this PDF" },
        ],
        "Ethanol specific heat is not printed in this PDF, so Q is not evaluated.",
        "Looking up ethanol data from memory and treating it as a textbook value.",
        ["50000/3600 = 13.8889 kg/s", "80 − 20 = 60°C", "The product m cp ΔT cannot be formed."],
      ),
    ],
    verification: "Incomplete due to missing source information",
    verificationNote: "No numerical design result is reported. The tube dimensions and the carbon-steel conductivity in Table 12.6 were checked against the PDF. There is no answer key.",
    finals: [{ label: "Design", text: "Incomplete. Ethanol properties and the steam saturation temperature are not in the PDF." }],
    diagram: "fixed-e",
    practice: [],
    mistakes: [],
    revision: {
      objective: "Set out the Section 12.2 design loop with ethanol fixed in the tubes.",
      formulas: ["Q = m cp ΔT", "Equation 12.57", "Equation 12.1", "Equation 12.20"],
      sequence: ["Duty", "Tsat", "LMTD", "Trial area", "Tube-side velocity and pressure drop", "Iterate"],
      intermediates: ["m = 13.889 kg/s", "Ethanol temperature rise = 60°C", "kw = 45 W/m°C from Table 12.6"],
      mistakes: ["Putting ethanol on the shell after the problem assigned it to the tubes.", "Using an outside source for ethanol properties without labelling it."],
      finalAnswer: "No numerical exchanger is claimed.",
    },
    checklist: ["Is ethanol on the tube side?", "Is the pressure-drop limit applied to the alcohol stream only?", "Is kw taken from Table 12.6?"],
    calculator: {
      inputs: [],
      run: () => [{ label: "Duty", status: "blocked", text: "Ethanol specific heat is not in the PDF." }],
    },
  },
  {
    id: "12.5",
    title: "Rate a proposed ammonia-vapour cooler",
    kind: "Rating",
    bookPages: "791",
    pdfPages: "158",
    statement: [
      "4500 kg/h of ammonia vapour at 6.7 bara pressure is to be cooled from 120°C to 40°C, using cooling water. The maximum supply temperature of the cooling water available is 30°C, and the outlet temperature is to be restricted to 40°C.",
      "The pressure drops over the exchanger must not exceed 0.5 bar for the ammonia stream and 1.5 bar for the cooling water.",
      "A contractor has proposed an E-type shell, inside diameter 590 mm. Baffles: 25 per cent cut, 300 mm spacing. Tubes: carbon steel, 15 mm inside diameter, 19 mm outside diameter, 2400 mm long, number 360. Tube arrangement: 8 passes, triangular tube pitch, pitch 23.75 mm. Nozzles: shell 150 mm inside diameter, tube headers 75 mm inside diameter. Cooling water is proposed in the tubes.",
      "Is the proposed design suitable for the duty?",
      "Physical properties of ammonia at the mean temperature of 80°C: specific heat 2.418 kJ/kg°C, thermal conductivity 0.0317 W/m°C, density 4.03 kg/m³, viscosity 1.21×10⁻⁵ N m⁻² s.",
    ],
    understand: {
      asking: "The question asks for a yes or no on one proposed exchanger. Every mechanical dimension is given, and the ammonia properties at 80°C are given.",
      type: "Multipass E-shell rating. Ammonia is a gas being cooled sensibly. Water is in the tubes. There are eight tube passes, so equation 12.8 applies.",
      provided: "Both terminal temperatures, the ammonia flow and properties, the pressure-drop limits, and the full proposal.",
      calculate: "Ammonia duty, counter-current LMTD, R, S, Ft, corrected mean temperature difference, outside area, shell cross-flow area, equivalent diameter, shell Reynolds and Prandtl numbers, and the shell-nozzle velocity. The film coefficients and both pressure drops still need a chart reading or the missing water properties.",
      procedure: "Section 12.2 for the rating logic, Section 12.6 for the mean temperature difference, and Kern’s method in Section 12.9.3 for the shell. Equation 12.17 would be used for water after the tube velocity is known.",
      why: "The proposal is an E shell with segmental baffles and an even number of tube passes. Equation 12.8 is the book’s equation for that arrangement. The ammonia density shows that the stream is still vapour at the stated mean temperature, so the sensible-heat duty is the correct duty.",
      strategy: [
        "Calculate Q from the ammonia flow and the given specific heat.",
        "Calculate the counter-current LMTD, then R, S and Ft.",
        "Reject the layout if Ft is below about 0.75 or if equation 12.8 has no real value.",
        "Calculate the installed area and the shell-side Re and Pr.",
        "Read jh and jf from Figures 12.29 and 12.30 before calculating hs and ΔPs.",
        "Leave the water side until its density and specific heat are available from a source that is actually in the chapter.",
      ],
    },
    given: [
      { quantity: "Ammonia flow", symbol: "Ws", value: "4500", unit: "kg/h" },
      { quantity: "Ammonia inlet", symbol: "T1", value: "120", unit: "°C" },
      { quantity: "Ammonia outlet", symbol: "T2", value: "40", unit: "°C" },
      { quantity: "Ammonia pressure", symbol: "P", value: "6.7", unit: "bara" },
      { quantity: "Water inlet", symbol: "t1", value: "30", unit: "°C" },
      { quantity: "Water outlet", symbol: "t2", value: "40", unit: "°C" },
      { quantity: "Ammonia pressure-drop limit", symbol: "ΔPs,max", value: "0.5", unit: "bar" },
      { quantity: "Water pressure-drop limit", symbol: "ΔPt,max", value: "1.5", unit: "bar" },
      { quantity: "Shell inside diameter", symbol: "Ds", value: "590", unit: "mm" },
      { quantity: "Baffle cut", symbol: "Bc", value: "25", unit: "%" },
      { quantity: "Baffle spacing", symbol: "lB", value: "300", unit: "mm" },
      { quantity: "Tube inside diameter", symbol: "di", value: "15", unit: "mm" },
      { quantity: "Tube outside diameter", symbol: "do", value: "19", unit: "mm" },
      { quantity: "Tube length", symbol: "L", value: "2400", unit: "mm" },
      { quantity: "Number of tubes", symbol: "Nt", value: "360", unit: "—" },
      { quantity: "Tube passes", symbol: "Np", value: "8", unit: "—" },
      { quantity: "Tube pitch", symbol: "pt", value: "23.75", unit: "mm" },
      { quantity: "Shell nozzle inside diameter", symbol: "Dn,s", value: "150", unit: "mm" },
      { quantity: "Specific heat", symbol: "cp", value: "2.418", unit: "kJ/kg°C" },
      { quantity: "Thermal conductivity", symbol: "k", value: "0.0317", unit: "W/m°C" },
      { quantity: "Density", symbol: "ρ", value: "4.03", unit: "kg/m³" },
      { quantity: "Viscosity", symbol: "μ", value: "1.21e-5", unit: "N s/m²" },
    ],
    conversions: [
      "4500 kg/h = 1.25 kg/s",
      "590 mm = 0.590 m",
      "300 mm = 0.300 m",
      "19 mm = 0.019 m",
      "23.75 mm = 0.02375 m",
      "2400 mm = 2.4 m",
      "2.418 kJ/kg°C = 2418 J/kg°C",
    ],
    assumptions: [
      "Cooling water is in the tubes, as the proposal states, so ammonia is the shell fluid in equations 12.6 and 12.7.",
      "The given properties at 80°C are used for the whole ammonia stream. The mean of 120 and 40 is 80°C, which is why the problem quotes that temperature.",
      "The duty is sensible only. The problem gives a vapour density and a vapour specific heat, and it does not give a latent heat.",
    ],
    missing: [
      "Water specific heat and density, so the water flow and the tube velocity cannot be calculated.",
      "jh from Figure 12.29 and jf from Figure 12.30. The figures are printed, but their curves are not tabulated.",
      "A named fouling row for ammonia. Table 12.2 is not used to invent one.",
    ],
    formulaIds: ["12.1", "12.4", "12.5", "12.6", "12.7", "12.8", "12.21", "12.23", "12.25", "12.26"],
    steps: [
      computed(
        "duty",
        "Ammonia duty",
        "Equation 12.1 needs Q. The stream is vapour with a stated specific heat, so the duty is sensible heat.",
        "Q = m c_p (T_1-T_2)",
        "Section 12.2 and the sensible-heat calculation in Example 12.1. Properties from Problem 12.5, p. 791.",
        [
          { symbol: "m", meaning: "4500 kg/h" },
          { symbol: "c_p", meaning: "2.418 kJ/kg°C" },
          { symbol: "T_1-T_2", meaning: "80°C" },
        ],
        ammoniaDuty,
        "Units: (kg/s)(kJ/kg°C)(°C) = kW. The result is 241.8 kW.",
        "Leaving the flow in kg/h and calling the product kilowatts.",
      ),
      computed(
        "lmtd",
        "Counter-current logarithmic mean",
        "Equation 12.5 multiplies Ft by the counter-current logarithmic mean, even though the exchanger has eight tube passes.",
        "\\Delta T_{lm}=\\frac{(T_1-t_2)-(T_2-t_1)}{\\ln[(T_1-t_2)/(T_2-t_1)]}",
        "Equation 12.4, Section 12.6, p. 655.",
        [
          { symbol: "T_1,T_2", meaning: "120°C and 40°C, shell side" },
          { symbol: "t_1,t_2", meaning: "30°C and 40°C, tube side" },
        ],
        ammoniaLmtd,
        "80°C and 10°C are both positive, so there is no temperature cross in the counter-current definition. The mean lies between them.",
        "Using (T1−t1) and (T2−t2). The cold end would be 40−40 = 0.",
      ),
      computed(
        "ratios",
        "Temperature ratios R and S",
        "Ft for one shell pass is a function of R and S. Ammonia is on the shell and water is on the tubes.",
        "R=(T_1-T_2)/(t_2-t_1),\\quad S=(t_2-t_1)/(T_1-t_1)",
        "Equations 12.6 and 12.7, pp. 655–656.",
        [
          { symbol: "T", meaning: "Shell-side ammonia temperatures" },
          { symbol: "t", meaning: "Tube-side water temperatures" },
        ],
        ammoniaRatios,
        "R = 8 is large because the water rise is only 10°C while the gas falls 80°C. S = 1/9.",
        "Swapping the shell and tube fluids in R.",
      ),
      computed(
        "ft",
        "One-shell-pass correction factor",
        "Eight is an even tube-pass count, so the book says equation 12.8 may be used. This also checks whether a single E shell is in the usable region of Figure 12.19.",
        "F_t=\\frac{\\sqrt{R^2+1}\\ln[(1-S)/(1-RS)]}{(R-1)\\ln[\\cdots]}",
        "Equation 12.8, p. 656. Figure 12.19 is the same relation drawn as a chart.",
        [
          { symbol: "R", meaning: "8" },
          { symbol: "S", meaning: "0.111111" },
        ],
        ammoniaFt,
        `Ft = ${sig(ammoniaFt.value)}. The book says an economic design is not normally made when Ft falls below about 0.75. This value is above that limit. Example 12.1’s chart reading of 0.85 agrees with equation 12.8 to within ordinary chart-reading accuracy (the equation gives 0.835 for that example).`,
        "Declaring the exchanger impossible because R is large, without evaluating equation 12.8. For these temperatures the equation does have a value.",
      ),
      computed(
        "dtm",
        "Corrected mean temperature difference",
        "The driving force used in equation 12.1 is Ft times the counter-current logarithmic mean.",
        "\\Delta T_m = F_t\\Delta T_{lm}",
        "Equation 12.5, p. 655.",
        [
          { symbol: "F_t", meaning: sig(ammoniaFt.value) },
          { symbol: "\\Delta T_{lm}", meaning: `${sig(ammoniaLmtd.value)} °C` },
        ],
        {
          ok: true,
          value: ammoniaFt.value * ammoniaLmtd.value,
          unit: "°C",
          substitution: `\\Delta T_m = ${sig(ammoniaFt.value)} \\times ${sig(ammoniaLmtd.value)}`,
          lines: [`${sig(ammoniaFt.value)} × ${sig(ammoniaLmtd.value)} = ${sig(ammoniaFt.value * ammoniaLmtd.value)} °C`],
        },
        "The corrected mean is below the logarithmic mean because Ft is below 1.",
        "Multiplying Ft a second time.",
      ),
      computed(
        "area",
        "Installed outside area",
        "The proposal already chooses the tubes, so the area is calculated directly. It is not a trial area.",
        "A_o = N_t \\pi d_o L",
        "Same outside-area relation used in Example 12.1.",
        [
          { symbol: "N_t", meaning: "360" },
          { symbol: "d_o", meaning: "0.019 m" },
          { symbol: "L", meaning: "2.4 m" },
        ],
        ammoniaArea,
        "About 52 m² for 360 tubes of 19 mm diameter and 2.4 m length is consistent with π do L ≈ 0.143 m² per tube.",
        "Dividing by eight passes. Passes change the velocity, not the installed area.",
      ),
      computed(
        "as",
        "Shell cross-flow area",
        "Ammonia is on the shell. Kern’s mass velocity uses equation 12.21.",
        "A_s=(p_t-d_o)D_s l_B/p_t",
        "Equation 12.21, p. 672.",
        [
          { symbol: "p_t", meaning: "0.02375 m" },
          { symbol: "d_o", meaning: "0.019 m" },
          { symbol: "D_s", meaning: "0.590 m" },
          { symbol: "l_B", meaning: "0.300 m" },
        ],
        ammoniaAs,
        "As is a few hundredths of a square metre, which is plausible for a 590 mm shell and a 300 mm baffle spacing.",
        "Forgetting to multiply by the baffle spacing.",
      ),
      computed(
        "de",
        "Equivalent diameter",
        "The pitch is triangular, so equation 12.23 is the matching definition.",
        "d_e=1.10(p_t^2-0.917d_o^2)/d_o",
        "Equation 12.23, p. 672.",
        [
          { symbol: "p_t", meaning: "0.02375 m" },
          { symbol: "d_o", meaning: "0.019 m" },
        ],
        ammoniaDe,
        "de is about 13.5 mm, just below the tube outside diameter. That is normal for this pitch ratio.",
        "Using equation 12.22.",
      ),
      computed(
        "re",
        "Shell-side Reynolds and Prandtl numbers",
        "Figure 12.29 is entered with the shell Reynolds number. The Prandtl number is needed in equation 12.25 after jh has been read.",
        "G_s=W_s/A_s,\\ Re=G_s d_e/\\mu,\\ Pr=c_p\\mu/k",
        "Equations 12.24 and the Prandtl number defined in Section 12.8.1. Viscosity, conductivity and specific heat are the values printed in the problem.",
        [
          { symbol: "W_s", meaning: "1.25 kg/s" },
          { symbol: "\\mu", meaning: "1.21×10⁻⁵ N s/m²" },
          { symbol: "k", meaning: "0.0317 W/m°C" },
        ],
        ammoniaFlow,
        `Re is about ${sig(ammoniaFlow.Re ?? 0)}, well above the shell-side turbulent threshold of about 200 given in Section 12.7.1. Pr is of order 1, which is reasonable for a gas.`,
        "Using the tube diameter instead of de in the Reynolds number.",
      ),
      computed(
        "nozzle",
        "Shell-nozzle velocity",
        "The book says shell-nozzle loss matters for gases. The loss is 1½ velocity heads at the inlet and ½ at the outlet, based on the nozzle area or the adjacent tube-row free area, whichever is smaller.",
        "u_n = W_s/(\\rho A_n),\\quad A_n=\\pi D_n^2/4",
        "Shell nozzle-pressure drop paragraph, Section 12.9.3, p. 675.",
        [
          { symbol: "D_n", meaning: "0.150 m" },
          { symbol: "\\rho", meaning: "4.03 kg/m³" },
        ],
        ammoniaNozzle,
        "The adjacent-row free area is not fixed by the printed data, so this velocity is the nozzle-area value only. Two velocity heads are 2 × ρu²/2 = ρu². That comparison can be made after a layout drawing gives the free area.",
        "Ignoring the nozzle term for a gas.",
      ),
      chartStep(
        "jh",
        "Shell-side factor jh",
        "Equation 12.25 cannot be evaluated until jh is read at the Reynolds number just calculated.",
        "\\frac{h_s d_e}{k}=j_h Re Pr^{1/3}(\\mu/\\mu_w)^{0.14}",
        `Figure 12.29, p. 673. Enter at Re = ${sig(ammoniaFlow.Re ?? 0)}, 25 per cent baffle cut, triangular pitch.`,
        [{ symbol: "j_h", meaning: "Read from Figure 12.29" }],
        `Open Figure 12.29. Use the 25% baffle-cut curve for triangular pitch at Re = ${sig(ammoniaFlow.Re ?? 0)}. The curve has not been digitized, so hs is not given a number here.`,
        "Continuing with a remembered jh from Example 12.1.",
      ),
      blocked(
        "water",
        "Water flow and tube-side coefficient",
        "The water temperatures are known, so the flow would be Q/(cp Δt). Equation 12.17 then needs the velocity, which needs the density.",
        "m_w = Q/[c_p(t_2-t_1)],\\quad h_i = 4200(1.35+0.02t)u_t^{0.8}/d_i^{0.2}",
        "Equation 12.17, p. 666. Water cp and density are not printed in Problem 12.5.",
        [
          { symbol: "Q", meaning: `${sig(ammoniaDuty.value)} W, known` },
          { symbol: "c_p", meaning: "Not printed for water" },
        ],
        "Water specific heat and density are not in this PDF.",
        "Borrowing 4.2 kJ/kg°C from Example 12.1 and treating the result as part of Problem 12.5.",
      ),
    ],
    verification: "Requires chart or source verification",
    verificationNote: "Duty, LMTD, R, S, Ft, area, As, de, Re, Pr and nozzle velocity were recalculated from the printed data and equations 12.4 to 12.8, 12.21 and 12.23. Equation 12.8 was also checked against Example 12.1: the book reads Ft = 0.85 and the equation gives 0.835. The shell coefficient, both pressure drops and the final suitability are not claimed. There is no answer key.",
    finals: [
      { label: "Duty", text: "241.8 kW" },
      { label: "LMTD", text: `${sig(ammoniaLmtd.value)} °C` },
      { label: "R and S", text: `R = 8, S = ${sig(ammoniaRatios.S ?? 0)}` },
      { label: "Ft", text: sig(ammoniaFt.value) },
      { label: "Corrected mean difference", text: `${sig(ammoniaFt.value * ammoniaLmtd.value)} °C` },
      { label: "Outside area", text: `${sig(ammoniaArea.value)} m²` },
      { label: "Shell Reynolds number", text: sig(ammoniaFlow.Re ?? 0) },
      { label: "Suitable?", text: "Not decided. jh, jf and the water properties are still required." },
    ],
    diagram: "multipass-e",
    practice: [
      {
        id: "duty",
        prompt: "Calculate the ammonia duty in kW.",
        expected: ammoniaDuty.value / 1000,
        unit: "kW",
        relTolerance: 0.005,
        absTolerance: 0.2,
        hints: ["The stream is sensible vapour.", "Q = m cp ΔT, with m in kg/s.", "m = 4500/3600, cp = 2.418 kJ/kg°C, ΔT = 80°C."],
      },
      {
        id: "ft",
        prompt: "Calculate Ft from equation 12.8.",
        expected: ammoniaFt.value,
        unit: "—",
        relTolerance: 0.01,
        absTolerance: 0.005,
        hints: ["Ammonia is on the shell.", "R = 80/10 and S = 10/90.", "Use equation 12.8, not Figure 12.20."],
      },
    ],
    mistakes: [
      {
        id: "kgh",
        prompt: "Find the mistake in this duty calculation.",
        wrongWorking: "Q = 4500 × 2.418 × (120 − 40) = 870480 kW.",
        correctId: "duty",
        explanation: "4500 kg/h must be divided by 3600 before multiplying by kJ/kg°C. The numerical product 870480 kJ/h is 241.8 kW, not 870480 kW.",
      },
    ],
    revision: {
      objective: "Rate the proposed eight-pass E shell as far as the printed ammonia data allow.",
      formulas: ["Q = m cp ΔT", "Equations 12.4 to 12.8", "Equations 12.21 and 12.23"],
      sequence: ["Duty", "LMTD", "R and S", "Ft", "Area", "Re", "Stop at Figure 12.29"],
      intermediates: ["Q = 241.8 kW", `Ft = ${sig(ammoniaFt.value)}`, `Re = ${sig(ammoniaFlow.Re ?? 0)}`],
      mistakes: ["Forgetting the 3600 conversion.", "Using the two-shell chart for an E shell.", "Inventing a water specific heat."],
      finalAnswer: "Ft is above 0.75, but suitability is not decided.",
    },
    checklist: [
      "Was 4500 kg/h converted to kg/s?",
      "Are the shell and tube fluids correct in R and S?",
      "Is Ft from equation 12.8 rather than Figure 12.20?",
      "Is the area based on do and the full tube length?",
      "Has a chart value been left unmarked?",
    ],
    calculator: {
      inputs: [
        { key: "flow", label: "Ammonia flow", unit: "kg/h", textbook: 4500 },
        { key: "cp", label: "Specific heat", unit: "kJ/kg°C", textbook: 2.418 },
        { key: "T1", label: "Ammonia inlet", unit: "°C", textbook: 120 },
        { key: "T2", label: "Ammonia outlet", unit: "°C", textbook: 40 },
        { key: "t1", label: "Water inlet", unit: "°C", textbook: 30 },
        { key: "t2", label: "Water outlet", unit: "°C", textbook: 40 },
        { key: "nt", label: "Tubes", unit: "—", textbook: 360 },
        { key: "do", label: "Outside diameter", unit: "m", textbook: 0.019 },
        { key: "L", label: "Length", unit: "m", textbook: 2.4 },
        { key: "pt", label: "Pitch", unit: "m", textbook: 0.02375 },
        { key: "Ds", label: "Shell inside diameter", unit: "m", textbook: 0.59 },
        { key: "lB", label: "Baffle spacing", unit: "m", textbook: 0.3 },
        { key: "rho", label: "Density", unit: "kg/m³", textbook: 4.03 },
        { key: "mu", label: "Viscosity", unit: "N s/m²", textbook: 1.21e-5 },
        { key: "k", label: "Conductivity", unit: "W/m°C", textbook: 0.0317 },
      ],
      run(v) {
        const duty = sensibleDuty({ massFlowKgH: v.flow, cpKJ: v.cp, hotIn: v.T1, hotOut: v.T2 })
        const lmtd = lmtdCounter(v.T1, v.T2, v.t1, v.t2)
        const ratios = temperatureRatios(v.T1, v.T2, v.t1, v.t2)
        const ft = ratios.ok ? correctionFactor(ratios.R ?? 0, ratios.S ?? 0) : ratios
        const area = outsideArea(v.nt, v.do, v.L)
        const as = crossflowArea(v.pt, v.do, v.Ds, v.lB)
        const de = equivalentDiameterTriangular(v.pt, v.do)
        const re = !as.ok
          ? as
          : !de.ok
            ? de
            : shellReynolds({
                massFlowKgS: v.flow / 3600,
                areaM2: as.value,
                density: v.rho,
                viscosity: v.mu,
                equivalentDiameterM: de.value,
                cp: v.cp * 1000,
                conductivity: v.k,
              })
        return rowsFrom([
          ["Duty", duty],
          ["LMTD", lmtd],
          ["R", ratios.ok ? { ok: true, value: ratios.R ?? 0, unit: "—", substitution: "", lines: [] } : ratios],
          ["Ft", ft],
          ["Outside area", area],
          ["Reynolds number", re.ok ? { ok: true, value: re.Re ?? re.value, unit: "—", substitution: "", lines: [] } : re],
        ])
      },
    },
  },
]

questions.push(...moreQuestions)

export const questionById = new Map(questions.map((question) => [question.id, question]))
