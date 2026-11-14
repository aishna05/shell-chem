import {
  bundleCriticalFlux,
  chlorineVapourPressure,
  latentDuty,
  linearInterpolation,
  massFlowFromKgPerS,
  outsideArea,
  sensibleDuty,
  sig,
  zuberFlux,
  type Calc,
} from "../calculations/textbook"
import type { Question, Step } from "./types"

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

function must<T extends Calc>(calc: T, label: string): Extract<T, { ok: true }> {
  if (!calc.ok) throw new Error(`${label}: ${calc.reason}`)
  return calc as Extract<T, { ok: true }>
}

const tsat = must(linearInterpolation(6, 5, 50, 6.4, 60), "Tsat")
const sensible = must(sensibleDuty({ massFlowKgH: 10000, cpKJ: 2.6, hotIn: tsat.value, hotOut: 20 }), "sensible")
const latent = must(latentDuty(10000, 322), "latent")
const area = must(outsideArea(50, 0.03, 4.8), "area")
const q = sensible.value + latent.value
const flux = q / area.value
const zuber = must(zuberFlux(322e3, 0.85, 535, 14.4), "zuber")
const qcb50 = must(
  bundleCriticalFlux({ kb: 0.44, pitchM: 0.045, outsideDiameterM: 0.03, lambdaJ: 322e3, tubeCountForFlux: 50, surfaceTension: 0.85, liquidDensity: 535, vapourDensity: 14.4 }),
  "50",
)
const qcb100 = must(
  bundleCriticalFlux({ kb: 0.44, pitchM: 0.045, outsideDiameterM: 0.03, lambdaJ: 322e3, tubeCountForFlux: 100, surfaceTension: 0.85, liquidDensity: 535, vapourDensity: 14.4 }),
  "100",
)
const duty10 = must(massFlowFromKgPerS(5, 828), "10")
const tube10 = must(outsideArea(1, 0.025, 4), "tube10")
const duty11 = must(latentDuty(10000, 260), "11")
const vapour = must(chlorineVapourPressure(10), "vp")
const zuber11 = must(zuberFlux(260e3, 0.013, 1440, 16.3), "z11")

const totalDuty: Extract<Calc, { ok: true }> = {
  ok: true,
  value: q,
  unit: "W",
  substitution: `Q = ${sig(sensible.value)} + ${sig(latent.value)}`,
  lines: [
    `Sensible heat = ${sig(sensible.value / 1000)} kW`,
    `Latent heat = ${sig(latent.value / 1000)} kW`,
    `Q = ${sig(q / 1000)} kW`,
  ],
}
const requiredFlux: Extract<Calc, { ok: true }> = {
  ok: true,
  value: flux,
  unit: "W/m²",
  substitution: `q = ${sig(q)}/${sig(area.value)}`,
  lines: [`${sig(q)} / ${sig(area.value)} = ${sig(flux)} W/m²`],
}

export const moreQuestions: Question[] = [
  {
    id: "12.6",
    title: "Check a spare kettle reboiler",
    kind: "Reboiler",
    bookPages: "791",
    pdfPages: "158",
    statement: [
      "A vaporiser is required to evaporate 10,000 kg/h of a process fluid, at 6 bar. The liquid is fed to the vaporiser at 20°C.",
      "The plant has a spare kettle reboiler available with the following specification. U-tube bundle, 50 tubes, mean length 4.8 m, end to end. Carbon steel tubes, inside diameter 25 mm, outside diameter 30 mm, square pitch 45 mm.",
      "Steam at 1.7 bara will be used for heating.",
      "Check if this reboiler would be suitable for the duty specified. Only check the thermal design. You may take it that the shell will handle the vapour rate.",
      "Liquid: density 535 kg/m³, specific heat 2.6 kJ/kg°C, thermal conductivity 0.094 W/m°C, viscosity 0.12 mN m⁻² s, surface tension 0.85 N/m, heat of vaporisation 322 kJ/kg.",
      "Vapour density 14.4 kg/m³.",
      "Vapour pressure: 5.0 bar at 50°C, 6.4 bar at 60°C, with further points printed from 70°C to 120°C.",
    ],
    understand: {
      asking: "The question asks whether the spare kettle can supply the stated vaporisation rate. Only the thermal design is required. The shell vapour capacity is given as acceptable.",
      type: "Kettle reboiler rating. Section 12.11.6 treats a kettle as a submerged bundle and uses pool-boiling limits.",
      provided: "Flow, feed temperature, pressure, bundle geometry, and the liquid and vapour properties, including a vapour-pressure table.",
      calculate: "Boiling temperature by interpolation, sensible and latent duty, outside area, required flux, single-tube critical flux, and bundle critical flux. The steam temperature at 1.7 bara is not available, so the available temperature difference is not calculated.",
      procedure: "Section 12.11.6. Equation 12.64 is Zuber’s single-tube limit. Equation 12.74 is the bundle limit, with Kb = 0.44 for square pitch and a factor of safety of 0.7.",
      why: "The equipment is a U-tube kettle. The chapter says single-tube boiling coefficients may be used for the bundle coefficient, while the critical flux must be reduced for the bundle.",
      strategy: [
        "Locate 6 bar between the printed vapour pressures and interpolate the boiling temperature.",
        "Add the sensible heat from 20°C to that temperature and the latent heat.",
        "Calculate the outside area of the 50 stated tubes.",
        "Compare the required flux with 0.7 times equation 12.74.",
        "Stop before the steam-side temperature difference.",
      ],
    },
    given: [
      { quantity: "Feed rate", symbol: "m", value: "10000", unit: "kg/h" },
      { quantity: "Feed temperature", symbol: "Tf", value: "20", unit: "°C" },
      { quantity: "Operating pressure", symbol: "P", value: "6", unit: "bar" },
      { quantity: "Tubes", symbol: "Nt", value: "50", unit: "—" },
      { quantity: "Mean length", symbol: "L", value: "4.8", unit: "m" },
      { quantity: "Inside diameter", symbol: "di", value: "25", unit: "mm" },
      { quantity: "Outside diameter", symbol: "do", value: "30", unit: "mm" },
      { quantity: "Pitch", symbol: "pt", value: "45", unit: "mm" },
      { quantity: "Steam pressure", symbol: "Ps", value: "1.7", unit: "bara" },
      { quantity: "Liquid density", symbol: "ρL", value: "535", unit: "kg/m³" },
      { quantity: "Specific heat", symbol: "cp", value: "2.6", unit: "kJ/kg°C" },
      { quantity: "Conductivity", symbol: "kL", value: "0.094", unit: "W/m°C" },
      { quantity: "Viscosity", symbol: "μL", value: "0.12", unit: "mN s/m²" },
      { quantity: "Surface tension", symbol: "σ", value: "0.85", unit: "N/m" },
      { quantity: "Latent heat", symbol: "λ", value: "322", unit: "kJ/kg" },
      { quantity: "Vapour density", symbol: "ρv", value: "14.4", unit: "kg/m³" },
    ],
    conversions: ["10000 kg/h = 2.7778 kg/s", "30 mm = 0.030 m", "45 mm = 0.045 m", "0.12 mN s/m² = 1.2×10⁻⁴ N s/m²", "322 kJ/kg = 322000 J/kg"],
    assumptions: [
      "The boiling temperature is interpolated linearly in pressure between the two adjacent printed points, 5.0 bar at 50°C and 6.4 bar at 60°C. The chapter does not give a vapour-pressure equation for this fluid.",
      "The area is based on 50 tubes of 4.8 m mean length, which is the wording printed in the problem.",
      "Equation 12.74’s note says that for U-tubes Nt is twice the number of actual U-tubes. The problem says “50 tubes” and does not say “50 U-tubes”, so both Nt = 50 and Nt = 100 are shown.",
    ],
    missing: ["Saturation temperature of the steam at 1.7 bara.", "Critical pressure of the process fluid, which equation 12.63 would need.", "Wall temperature, which equation 12.62 would need."],
    formulaIds: ["12.64", "12.74", "12.75"],
    steps: [
      computed("tsat", "Boiling temperature at 6 bar", "The duty’s sensible part ends at the boiling temperature. Six bar lies between the printed entries 5.0 bar and 6.4 bar.", "T = 50 + \\dfrac{6.0-5.0}{6.4-5.0}(60-50)", "Problem 12.3’s vapour-pressure table on p. 791. Linear interpolation is stated because no equation is printed.", [{ symbol: "P", meaning: "6 bar" }], tsat, "6.0 is between 5.0 and 6.4, so this is interpolation, not extrapolation. The result, 57.14°C, lies between 50 and 60.", "Using the 60°C entry without interpolation."),
      computed("sensible", "Sensible heat to the boiling point", "The feed is sub-cooled at 20°C, so it must be heated before vaporisation.", "Q_s = m c_p (T_{sat}-20)", "Specific heat printed in Problem 12.6.", [{ symbol: "c_p", meaning: "2.6 kJ/kg°C" }], sensible, "The temperature rise is 37.14°C, so the sensible load is smaller than the latent load.", "Using 50°C as the boiling point."),
      computed("latent", "Latent heat", "The required product is vapour, so the latent heat of the whole feed is included.", "Q_\\lambda = m \\lambda", "Latent heat printed as 322 kJ/kg.", [{ symbol: "\\lambda", meaning: "322 kJ/kg" }], latent, "894.4 kW is the larger part of the duty.", "Leaving λ in kJ and the flow in kg/h."),
      computed("total", "Total thermal duty", "The reboiler must supply both parts. The problem does not add a heat-loss allowance, so none is added.", "Q = Q_s + Q_\\lambda", "Problem 12.6. Example 12.12 adds 5 per cent for losses, but that instruction is not in this problem.", [{ symbol: "Q_s", meaning: "sensible part" }, { symbol: "Q_\\lambda", meaning: "latent part" }], totalDuty, "No 5 per cent has been added, because Problem 12.6 does not ask for it.", "Copying the 5 per cent loss allowance from Example 12.12."),
      computed("area", "Outside area of the stated bundle", "The required flux is the duty divided by the installed outside area.", "A_o = 50 \\pi d_o L", "Problem statement: 50 tubes, mean length 4.8 m, outside diameter 30 mm.", [{ symbol: "d_o", meaning: "0.030 m" }, { symbol: "L", meaning: "4.8 m" }], area, "About 22.6 m² follows from 50 × π × 0.03 × 4.8.", "Taking 4.8 m as the straight length of one leg and doubling it again."),
      computed("flux", "Required heat flux", "Section 12.11.6 compares the operating flux with the critical flux.", "q = Q/A_o", "Definition used with equations 12.64 and 12.74.", [{ symbol: "Q", meaning: sig(q) + " W" }, { symbol: "A_o", meaning: sig(area.value) + " m²" }], requiredFlux, "About 51.4 kW/m². Kern’s older commercial limit quoted in this section is 37.9 kW/m², so the result is above that older limit and must be compared with equation 12.74 rather than stopped at Kern’s figure.", "Comparing the flux with Kern’s 37,900 W/m² and ignoring the equation the section then adopts."),
      computed("zuber", "Single-tube critical flux", "Equation 12.64 is the single-tube limit that equation 12.74 modifies.", "q_c = 0.131\\lambda[\\sigma g(\\rho_L-\\rho_v)\\rho_v^2]^{1/4}", "Equation 12.64, p. 733. g = 9.81 m/s².", [{ symbol: "\\sigma", meaning: "0.85 N/m, the printed value" }, { symbol: "\\lambda", meaning: "322000 J/kg" }], zuber, "The printed surface tension, 0.85 N/m, is much larger than a typical organic value. It is used because it is printed. The critical flux is very sensitive to it.", "Replacing 0.85 N/m with a “more typical” surface tension."),
      computed("qcb50", "Bundle critical flux if Nt = 50", "Equation 12.74 uses the square-pitch constant and the tube count. This case takes the printed “50 tubes” as Nt.", "q_{cb}=0.44(p_t/d_o)(\\lambda/\\sqrt{50})[\\cdots]^{0.25}", "Equation 12.74, p. 751. Kb = 0.44 for square pitch.", [{ symbol: "p_t/d_o", meaning: "45/30 = 1.5" }], qcb50, `0.7 × qcb = ${sig(0.7 * qcb50.value)} W/m². The required flux, ${sig(flux)} W/m², is below that safety limit.`, "Forgetting the 0.7 safety factor."),
      computed("qcb100", "Bundle critical flux if Nt = 100", "The note under equation 12.74 says that for U-tubes Nt equals twice the number of actual U-tubes. If the 50 tubes are 50 U-tubes, Nt is 100.", "q_{cb}=0.44(p_t/d_o)(\\lambda/\\sqrt{100})[\\cdots]^{0.25}", "Note to equation 12.74, p. 751.", [{ symbol: "N_t", meaning: "100" }], qcb100, `0.7 × qcb = ${sig(0.7 * qcb100.value)} W/m², which is still above the required flux.`, "Using only one of the two interpretations without saying so."),
      blocked("steam", "Steam temperature difference", "Both sides of a single-component kettle heated by steam are isothermal once both saturation temperatures are known. The process temperature is known. The steam temperature is not.", "\\Delta T = T_{steam}-T_{sat}", "Section 12.11.6, mean temperature differences. Steam at 1.7 bara is not given a temperature in this PDF.", [{ symbol: "T_{steam}", meaning: "Not printed" }], "The saturation temperature of steam at 1.7 bara is not in this PDF.", "Taking the steam temperature from Example 12.12."),
    ],
    verification: "Incomplete due to missing source information",
    verificationNote: "Duty, area, required flux and both critical-flux interpretations were recalculated from the printed properties and equations 12.64 and 12.74. The required flux is below 0.7 qcb in both tube-count interpretations. Suitability is still incomplete because the steam temperature is absent, so the exchanger has not been shown to transfer the duty. The printed surface tension was not altered. There is no answer key.",
    finals: [
      { label: "Boiling temperature", text: "57.14°C by linear interpolation" },
      { label: "Duty", text: `${sig(q / 1000)} kW` },
      { label: "Outside area", text: `${sig(area.value)} m²` },
      { label: "Required flux", text: `${sig(flux)} W/m²` },
      { label: "0.7 qcb, Nt = 50", text: `${sig(0.7 * qcb50.value)} W/m²` },
      { label: "0.7 qcb, Nt = 100", text: `${sig(0.7 * qcb100.value)} W/m²` },
      { label: "Suitable?", text: "Critical-flux check passes for both Nt readings. The steam temperature difference is not available." },
    ],
    diagram: "kettle",
    practice: [
      { id: "tsat", prompt: "Interpolate the boiling temperature at 6 bar, in °C.", expected: tsat.value, unit: "°C", relTolerance: 0.005, absTolerance: 0.05, hints: ["Use the two neighbouring table points.", "T = 50 + (6−5)/(6.4−5)×(60−50).", "The fraction is 1/1.4."] },
      { id: "flux", prompt: "Calculate the required heat flux in W/m² for 50 tubes.", expected: flux, unit: "W/m²", relTolerance: 0.01, absTolerance: 50, hints: ["Add sensible and latent heat.", "Area = 50 π × 0.03 × 4.8.", "Divide Q by that area."] },
    ],
    mistakes: [
      { id: "loss", prompt: "Find the mistake.", wrongWorking: "Q = 1.05 × (sensible + latent), because Example 12.12 adds 5 per cent.", correctId: "total", explanation: "Example 12.12 is a different problem. Problem 12.6 does not ask for a heat-loss allowance." },
    ],
    revision: {
      objective: "Check the kettle flux limit without inventing the steam temperature.",
      formulas: ["Linear interpolation", "Q = m cp ΔT + mλ", "Equations 12.64 and 12.74"],
      sequence: ["Tsat", "Duty", "Area", "Flux", "Critical flux", "Stop at the steam temperature"],
      intermediates: [`Tsat = ${sig(tsat.value)} °C`, `Q = ${sig(q / 1000)} kW`, `q = ${sig(flux)} W/m²`],
      mistakes: ["Changing the printed surface tension.", "Adding Example 12.12’s 5 per cent.", "Hiding the U-tube Nt ambiguity."],
      finalAnswer: "Required flux is below 0.7 qcb. Steam ΔT is unknown.",
    },
    checklist: ["Is 6 bar inside the two table points used?", "Is λ in J/kg in equation 12.64?", "Were both U-tube counts shown?", "Was 0.7 applied to qcb?"],
    calculator: {
      inputs: [
        { key: "flow", label: "Flow", unit: "kg/h", textbook: 10000 },
        { key: "cp", label: "Specific heat", unit: "kJ/kg°C", textbook: 2.6 },
        { key: "tin", label: "Feed temperature", unit: "°C", textbook: 20 },
        { key: "tsat", label: "Boiling temperature", unit: "°C", textbook: tsat.value },
        { key: "lambda", label: "Latent heat", unit: "kJ/kg", textbook: 322 },
        { key: "nt", label: "Tubes", unit: "—", textbook: 50 },
        { key: "do", label: "Outside diameter", unit: "m", textbook: 0.03 },
        { key: "L", label: "Mean length", unit: "m", textbook: 4.8 },
      ],
      run(v) {
        const sensibleDutyResult = sensibleDuty({ massFlowKgH: v.flow, cpKJ: v.cp, hotIn: v.tsat, hotOut: v.tin })
        const latentDutyResult = latentDuty(v.flow, v.lambda)
        const areaResult = outsideArea(v.nt, v.do, v.L)
        const total = sensibleDutyResult.ok && latentDutyResult.ok ? sensibleDutyResult.value + latentDutyResult.value : null
        const fluxResult: Calc = total !== null && areaResult.ok ? { ok: true, value: total / areaResult.value, unit: "W/m²", substitution: "", lines: [] } : { ok: false, reason: "Duty or area is invalid.", lines: [] }
        return [
          { label: "Sensible duty", status: sensibleDutyResult.ok ? "computed" : "blocked", text: sensibleDutyResult.ok ? `${sig(sensibleDutyResult.value)} W` : sensibleDutyResult.reason },
          { label: "Latent duty", status: latentDutyResult.ok ? "computed" : "blocked", text: latentDutyResult.ok ? `${sig(latentDutyResult.value)} W` : latentDutyResult.reason },
          { label: "Required flux", status: fluxResult.ok ? "computed" : "blocked", text: fluxResult.ok ? `${sig(fluxResult.value)} W/m²` : fluxResult.reason },
        ]
      },
    },
  },
  {
    id: "12.7",
    title: "Design a horizontal n-propanol condenser",
    kind: "Condenser",
    bookPages: "791–792",
    pdfPages: "158–159",
    statement: [
      "A condenser is required to condense n-propanol vapour leaving the top of a distillation column. The n-propanol is essentially pure, and is a saturated vapour at a pressure of 2.1 bara. The condensate needs to be sub-cooled to 45°C.",
      "Design a horizontal shell and tube condenser capable of handling a vapour rate of 30,000 kg/h. Cooling water is available at 30°C and the temperature rise is to be limited to 30°C. The pressure drop on the vapour stream is to be less than 50 kN/m², and on the water stream less than 70 kN/m². The preferred tube size is 16 mm inside diameter, 19 mm outside diameter, and 2.5 m long.",
      "Take the saturation temperature of n-propanol at 2.1 bar as 118°C. The other physical properties required can be found in the literature, or estimated.",
    ],
    understand: {
      asking: "The question asks for a horizontal shell-and-tube condenser design that both condenses and sub-cools pure n-propanol.",
      type: "Horizontal condenser with desuperheating absent and sub-cooling required. Section 12.10.7 says the temperature profile must be divided into zones.",
      provided: "Vapour rate, pressure, saturation temperature, sub-cooled outlet, coolant inlet and allowed rise, pressure-drop limits, and the preferred tube size.",
      calculate: "Condensing duty, sub-cooling duty, zone mean temperature differences, area, and both pressure drops. The latent heat and liquid properties are not in the PDF, so the duties cannot be started.",
      procedure: "Section 12.10.2 for horizontal shell-side condensation is the chapter’s usual horizontal arrangement. Equation 12.50 is Kern’s bundle coefficient. Sub-cooling is Section 12.10.7. Equation 12.57 applies only to the isothermal condensing zone.",
      why: "The problem names a horizontal shell-and-tube condenser. The chapter says horizontal condensation on the shell, with coolant in the tubes, is the usual arrangement. The problem itself does not assign the sides, so that usual arrangement has to be stated as a choice.",
      strategy: ["Split the duty into condensation at 118°C and liquid cooling from 118°C to 45°C.", "Find each zone’s mean temperature difference.", "Size the tubes and check equation 12.50.", "Check the two pressure-drop limits."],
    },
    given: [
      { quantity: "Vapour rate", symbol: "m", value: "30000", unit: "kg/h" },
      { quantity: "Pressure", symbol: "P", value: "2.1", unit: "bara" },
      { quantity: "Saturation temperature", symbol: "Tsat", value: "118", unit: "°C" },
      { quantity: "Condensate outlet", symbol: "Tc", value: "45", unit: "°C" },
      { quantity: "Cooling-water inlet", symbol: "t1", value: "30", unit: "°C" },
      { quantity: "Maximum water rise", symbol: "Δt", value: "30", unit: "°C" },
      { quantity: "Vapour pressure-drop limit", symbol: "ΔPv", value: "50", unit: "kN/m²" },
      { quantity: "Water pressure-drop limit", symbol: "ΔPw", value: "70", unit: "kN/m²" },
      { quantity: "Preferred inside diameter", symbol: "di", value: "16", unit: "mm" },
      { quantity: "Preferred outside diameter", symbol: "do", value: "19", unit: "mm" },
      { quantity: "Preferred length", symbol: "L", value: "2.5", unit: "m" },
    ],
    conversions: ["30000 kg/h = 8.333 kg/s", "16 mm = 0.016 m", "19 mm = 0.019 m"],
    assumptions: ["The usual horizontal arrangement in Section 12.10 is condensation on the shell and water in the tubes. The problem does not state this explicitly."],
    missing: ["Latent heat of n-propanol.", "Liquid specific heat, density, viscosity and conductivity.", "Vapour density.", "Water specific heat, if the water flow is required."],
    formulaIds: ["12.50", "12.57"],
    steps: [
      blocked("duty", "Condensing and sub-cooling duties", "Section 12.10.7 requires the latent load and the sensible sub-cooling load to be kept separate.", "Q_\\lambda = m\\lambda,\\quad Q_s = m c_p(118-45)", "Problem 12.7, pp. 791–792, says the other properties are in the literature or are to be estimated. Estimation is not a value printed in the PDF.", [{ symbol: "\\lambda", meaning: "Not printed" }, { symbol: "c_p", meaning: "Not printed" }], "Latent heat and liquid specific heat are not in this PDF.", "Using one isothermal LMTD from 118°C against the full water rise and ignoring sub-cooling."),
    ],
    verification: "Incomplete due to missing source information",
    verificationNote: "The saturation temperature and the tube size were checked against the printed problem. No area or coefficient is reported. There is no answer key.",
    finals: [{ label: "Design", text: "Incomplete. n-propanol properties other than Tsat = 118°C are not in the PDF." }],
    diagram: "horizontal-condenser",
    practice: [],
    mistakes: [],
    revision: {
      objective: "Recognise a two-zone horizontal condenser and the missing properties.",
      formulas: ["Equation 12.50", "Equation 12.57 for the condensing zone only"],
      sequence: ["Split the duty", "Zone LMTDs", "Bundle coefficient", "Pressure drops"],
      intermediates: ["Tsat = 118°C", "Water outlet is at most 60°C", "Sub-cooling range = 118 − 45 = 73°C"],
      mistakes: ["Treating the whole exchanger as isothermal.", "Using the vertical-tube equation."],
      finalAnswer: "No numerical design is claimed.",
    },
    checklist: ["Are condensation and sub-cooling separate?", "Is equation 12.50 the horizontal equation?", "Is every property printed?"],
    calculator: { inputs: [], run: () => [{ label: "Duty", status: "blocked", text: "n-propanol latent heat is not in the PDF." }] },
  },
  {
    id: "12.8",
    title: "Design a vertical n-propanol condenser",
    kind: "Condenser",
    bookPages: "792",
    pdfPages: "159",
    statement: [
      "Design a vertical shell and tube condenser for the duty given in question 12.7. Use the same preferred tube size.",
    ],
    understand: {
      asking: "The question repeats Problem 12.7’s duty and changes the orientation to vertical, with the same 16/19 mm tubes, 2.5 m long.",
      type: "Vertical shell-and-tube condenser with condensation and sub-cooling.",
      provided: "Everything in Problem 12.7, plus the instruction to keep the tube size.",
      calculate: "The same duties as 12.7, then a vertical-film coefficient from equation 12.51 or Figure 12.43. The duties are blocked by the same missing properties.",
      procedure: "Section 12.10.3. Equation 12.51 applies to laminar film condensation inside or outside vertical tubes. Above a film Reynolds number of about 30, Figure 12.43 is required.",
      why: "The problem explicitly says vertical shell and tube. The horizontal row correction in equation 12.50 does not belong to this orientation.",
      strategy: ["Carry the same two-zone duty split as 12.7.", "Evaluate the vertical loading Γv = Wc/(Nt π d).", "Use equation 12.51 only while the film Reynolds number is below about 30."],
    },
    given: [
      { quantity: "Duty source", symbol: "—", value: "Problem 12.7", unit: "—" },
      { quantity: "Preferred tube size", symbol: "di, do, L", value: "16 mm, 19 mm, 2.5 m", unit: "—" },
    ],
    conversions: ["Same conversions as Problem 12.7."],
    assumptions: ["The duty, pressure limits and water temperatures are exactly those printed in Problem 12.7."],
    missing: ["The same n-propanol and water properties missing from Problem 12.7."],
    formulaIds: ["12.51", "12.57"],
    steps: [
      blocked("duty", "Duty carried from Problem 12.7", "A vertical design still needs the condensing and sub-cooling loads before any tube count can be chosen.", "Q_\\lambda = m\\lambda", "Problem 12.8, p. 792, refers to question 12.7.", [{ symbol: "\\lambda", meaning: "Not printed" }], "The latent heat required by Problem 12.7 is not in this PDF.", "Designing the vertical condenser with equation 12.50."),
    ],
    verification: "Incomplete due to missing source information",
    verificationNote: "The cross-reference to Problem 12.7 and the tube size were checked. No numerical condenser is claimed. There is no answer key.",
    finals: [{ label: "Design", text: "Incomplete for the same missing properties as Problem 12.7." }],
    diagram: "vertical-condenser",
    practice: [],
    mistakes: [],
    revision: {
      objective: "Change the condensation equation from horizontal to vertical without inventing properties.",
      formulas: ["Equation 12.51", "Figure 12.43 when Rec is above about 30"],
      sequence: ["Same duty split as 12.7", "Vertical loading", "Film Reynolds number", "Coefficient"],
      intermediates: ["Tube size remains 16/19 mm by 2.5 m"],
      mistakes: ["Keeping Nr^(−1/6) from the horizontal equation."],
      finalAnswer: "No numerical design is claimed.",
    },
    checklist: ["Is the vertical equation 12.51 selected?", "Is sub-cooling still a separate zone?"],
    calculator: { inputs: [], run: () => [{ label: "Duty", status: "blocked", text: "The Problem 12.7 properties are not in the PDF." }] },
  },
  {
    id: "12.9",
    title: "Preliminary design of an MEK partial condenser",
    kind: "Condenser",
    bookPages: "792",
    pdfPages: "159",
    statement: [
      "In the manufacture of methyl ethyl ketone from 2-butanol, the reactor products are precooled and then partially condensed in a shell and tube exchanger.",
      "A typical analysis of the stream entering the condenser is, mol fractions: MEK 0.47, unreacted alcohol 0.06, hydrogen 0.47. Only 85 per cent of the MEK and alcohol are condensed. The hydrogen is non-condensable.",
      "The vapours enter the condenser at 125°C and the condensate and uncondensed material leave at 27°C. The condenser pressure is maintained at 1.1 bara.",
      "Make a preliminary design of this condenser, for a feed rate of 1500 kg/h. Chilled water will be used as the coolant, at an inlet temperature of 10°C and allowable temperature rise of 30°C.",
      "Any of the physical properties of the components not available in Appendix C, or the general literature, should be estimated.",
    ],
    understand: {
      asking: "The question asks for a preliminary shell-and-tube design of a partial condenser with a large non-condensable fraction.",
      type: "Multicomponent partial condenser. Section 12.10.8 is the chapter’s method. Appendix C is not part of this PDF.",
      provided: "Feed composition, the 85 per cent condensation of MEK and alcohol, temperatures, pressure, feed rate, and the chilled-water temperatures.",
      calculate: "Component flows, condensed fraction, heat-release curve, and a zoned condenser design. None of that can be quantified without component properties.",
      procedure: "Section 12.10.8. The chapter requires the heat-transfer and temperature profile to be divided where both sensible and latent heat are transferred. A non-condensable reduces the condensing coefficient.",
      why: "The problem says the stream is partially condensed in a shell-and-tube exchanger and points to Appendix C. That appendix is not in the uploaded chapter.",
      strategy: ["Convert the feed to component mass flows.", "Condense 85 per cent of the MEK and alcohol and none of the hydrogen.", "Build the condensing curve from the missing properties.", "Size the exchanger zone by zone."],
    },
    given: [
      { quantity: "MEK mole fraction", symbol: "y", value: "0.47", unit: "—" },
      { quantity: "Alcohol mole fraction", symbol: "y", value: "0.06", unit: "—" },
      { quantity: "Hydrogen mole fraction", symbol: "y", value: "0.47", unit: "—" },
      { quantity: "Fraction of MEK and alcohol condensed", symbol: "—", value: "0.85", unit: "—" },
      { quantity: "Inlet temperature", symbol: "T1", value: "125", unit: "°C" },
      { quantity: "Outlet temperature", symbol: "T2", value: "27", unit: "°C" },
      { quantity: "Pressure", symbol: "P", value: "1.1", unit: "bara" },
      { quantity: "Feed rate", symbol: "m", value: "1500", unit: "kg/h" },
      { quantity: "Chilled-water inlet", symbol: "t1", value: "10", unit: "°C" },
      { quantity: "Allowed water rise", symbol: "Δt", value: "30", unit: "°C" },
    ],
    conversions: ["1500 kg/h = 0.4167 kg/s"],
    assumptions: ["Hydrogen remains entirely in the vapour, as the problem states.", "85 per cent applies to both MEK and the alcohol."],
    missing: ["Appendix C, which is not in this PDF.", "Molecular weights, latent heats, heat capacities and vapour-liquid equilibrium data."],
    formulaIds: ["12.1", "12.57"],
    steps: [
      blocked("components", "Component flows", "A partial-condenser duty starts from the condensed mass of each component. The feed is given as a mass flow and mole fractions, so molecular weights are required before the component mass flows exist.", "n_i = y_i m / M", "Problem 12.9, p. 792. Appendix C is named by the problem and is not included in this chapter PDF.", [{ symbol: "M", meaning: "Molecular weights are not printed" }], "Appendix C is not in the uploaded PDF, so the component mass balance is not completed.", "Assuming molecular weights and presenting them as textbook data."),
    ],
    verification: "Incomplete due to missing source information",
    verificationNote: "The composition, temperatures, pressure and flow were checked against p. 792. No heat duty is reported. There is no answer key.",
    finals: [{ label: "Preliminary design", text: "Incomplete. Appendix C is not in this PDF." }],
    diagram: "partial-condenser",
    practice: [],
    mistakes: [],
    revision: {
      objective: "Identify a non-condensable partial condenser and the missing appendix.",
      formulas: ["Section 12.10.8 zoned balance", "Equation 12.1 after the heat-release curve exists"],
      sequence: ["Component split", "Condensed fraction", "Heat-release curve", "Zoned area"],
      intermediates: ["Hydrogen is not condensed.", "Water may rise from 10°C to 40°C."],
      mistakes: ["Condensing part of the hydrogen.", "Using a single LMTD across 125°C to 27°C."],
      finalAnswer: "No numerical design is claimed.",
    },
    checklist: ["Is hydrogen excluded from the condensate?", "Is 85 per cent applied only to MEK and alcohol?", "Are molecular weights taken from this PDF?"],
    calculator: { inputs: [], run: () => [{ label: "Component flow", status: "blocked", text: "Appendix C is not in this PDF." }] },
  },
  {
    id: "12.10",
    title: "Estimate tubes for an n-butane thermosyphon",
    kind: "Reboiler",
    bookPages: "792",
    pdfPages: "159",
    statement: [
      "A vertical thermosyphon reboiler is required for a column. The liquid at the base of the column is essentially pure n-butane. A vapour rate of 5 kg/s is required.",
      "The pressure at the base of the column is 20.9 bar. Saturated steam at 5 bar will be used for heating.",
      "Estimate the number of 25 mm outside diameter, 22 mm inside diameter, 4 m long, tubes needed.",
      "At 20.9 bar the saturation temperature of n-butane is 117°C and the heat of vaporisation 828 kJ/kg.",
    ],
    understand: {
      asking: "The question asks for a tube count. The tube diameter and length are fixed, and the vapour rate is fixed.",
      type: "Vertical thermosyphon preliminary estimate. Section 12.11.5 gives Frank and Prickett’s Figure 12.59 for that estimate.",
      provided: "Vapour rate, column pressure, boiling temperature, latent heat, steam pressure, and the tube size.",
      calculate: "The latent duty and the outside area of one tube can be calculated. The tube count needs a design flux. Figure 12.59 needs the reduced temperature and the overall temperature difference.",
      procedure: "Figure 12.59 and equations 12.72 onward, illustrated by Example 12.10. The figure’s stated basis includes tube lengths of 2.5 to 3.7 m and a standard length of 2.44 m.",
      why: "The problem asks for an estimate of the tube count, which is what Example 12.10 obtains from the Frank–Prickett flux. The data needed to enter the figure are not all printed.",
      strategy: ["Calculate the latent duty.", "Calculate one tube’s outside area.", "The tube count is Q/(q Ao,one).", "Stop because Tr and the steam temperature are absent, and because 4 m lies outside the figure’s stated length range."],
    },
    given: [
      { quantity: "Vapour rate", symbol: "m", value: "5", unit: "kg/s" },
      { quantity: "Column pressure", symbol: "P", value: "20.9", unit: "bar" },
      { quantity: "Saturation temperature", symbol: "Tsat", value: "117", unit: "°C" },
      { quantity: "Latent heat", symbol: "λ", value: "828", unit: "kJ/kg" },
      { quantity: "Steam pressure", symbol: "Ps", value: "5", unit: "bar" },
      { quantity: "Outside diameter", symbol: "do", value: "25", unit: "mm" },
      { quantity: "Inside diameter", symbol: "di", value: "22", unit: "mm" },
      { quantity: "Tube length", symbol: "L", value: "4", unit: "m" },
    ],
    conversions: ["25 mm = 0.025 m", "22 mm = 0.022 m", "828 kJ/kg = 828000 J/kg"],
    assumptions: ["No liquid specific heat is printed, and the problem does not say the feed is sub-cooled, so the calculated duty is the latent duty only."],
    missing: ["Critical temperature of n-butane, so the reduced temperature for Figure 12.59 cannot be formed.", "Saturation temperature of steam at 5 bar, so ΔT cannot be formed.", "The 4 m tube is longer than the 2.5–3.7 m basis printed under Figure 12.59. The book says extrapolation is not recommended."],
    formulaIds: ["12.1"],
    steps: [
      computed("duty", "Latent duty", "The only enthalpy change printed is the latent heat, and the required result is a vapour rate.", "Q = m\\lambda", "Problem 12.10, p. 792.", [{ symbol: "m", meaning: "5 kg/s" }, { symbol: "\\lambda", meaning: "828 kJ/kg" }], duty10, "5 × 828 = 4140 kJ/s = 4140 kW. The units close.", "Dividing 5 kg/s by 3600."),
      computed("tube", "Outside area of one tube", "Once a design flux is known, the tube count is the total area divided by this area.", "A_1 = \\pi d_o L", "Tube size printed in the problem.", [{ symbol: "d_o", meaning: "0.025 m" }, { symbol: "L", meaning: "4 m" }], tube10, "π × 0.025 × 4 = 0.314 m².", "Using the inside diameter for the boiling area."),
      blocked("count", "Number of tubes", "Nt = Q/(q A1). Figure 12.59 supplies q only after Tr and ΔT are known. Tr needs the critical temperature. ΔT needs the steam saturation temperature. The printed tube length is also outside the figure’s stated basis.", "N_t = Q/(q A_1)", "Section 12.11.5 and Figure 12.59, pp. 742–743. Example 12.10 reads the flux from that figure.", [{ symbol: "T_r", meaning: "Not available" }, { symbol: "\\Delta T", meaning: "Not available" }], "Critical temperature and the steam temperature at 5 bar are not in this PDF. Figure 12.59 is therefore not read.", "Reading a flux from Figure 12.59 without a reduced temperature, or extending the 2.5–3.7 m basis to 4 m."),
    ],
    verification: "Incomplete due to missing source information",
    verificationNote: "The latent duty and one-tube area were recalculated from the printed values. The tube count is not given. There is no answer key.",
    finals: [
      { label: "Latent duty", text: "4140 kW" },
      { label: "Area of one tube", text: `${sig(tube10.value)} m²` },
      { label: "Number of tubes", text: "Not calculated." },
    ],
    diagram: "thermosyphon",
    practice: [
      { id: "duty", prompt: "Calculate the latent duty in kW.", expected: 4140, unit: "kW", relTolerance: 0.002, absTolerance: 1, hints: ["The flow is already in kg/s.", "Multiply by 828 kJ/kg.", "5 × 828."] },
    ],
    mistakes: [
      { id: "hour", prompt: "Find the mistake.", wrongWorking: "Q = (5/3600) × 828 = 1.15 kW.", correctId: "duty", explanation: "5 kg/s is already a mass flow per second. Dividing by 3600 again makes the duty one hour too small." },
    ],
    revision: {
      objective: "Get the thermosyphon duty right and know why Figure 12.59 cannot yet be entered.",
      formulas: ["Q = mλ", "A1 = π do L", "Figure 12.59"],
      sequence: ["Duty", "One-tube area", "Stop"],
      intermediates: ["Q = 4140 kW", `A1 = ${sig(tube10.value)} m²`],
      mistakes: ["Dividing kg/s by 3600.", "Extrapolating Figure 12.59 to a 4 m tube."],
      finalAnswer: "4140 kW. Tube count not determined.",
    },
    checklist: ["Is the flow already in kg/s?", "Is the tube length inside the figure’s stated range?", "Are Tr and ΔT both printed?"],
    calculator: {
      inputs: [
        { key: "flow", label: "Vapour rate", unit: "kg/s", textbook: 5 },
        { key: "lambda", label: "Latent heat", unit: "kJ/kg", textbook: 828 },
        { key: "do", label: "Outside diameter", unit: "m", textbook: 0.025 },
        { key: "L", label: "Length", unit: "m", textbook: 4 },
      ],
      run(v) {
        const duty = massFlowFromKgPerS(v.flow, v.lambda)
        const tube = outsideArea(1, v.do, v.L)
        return [
          { label: "Duty", status: duty.ok ? "computed" : "blocked", text: duty.ok ? `${sig(duty.value)} W` : duty.reason },
          { label: "One-tube area", status: tube.ok ? "computed" : "blocked", text: tube.ok ? `${sig(tube.value)} m²` : tube.reason },
          { label: "Tube count", status: "blocked", text: "Figure 12.59 cannot be entered without Tr and the steam temperature." },
        ]
      },
    },
  },
  {
    id: "12.11",
    title: "Design a chlorine immersed-bundle vaporiser",
    kind: "Reboiler",
    bookPages: "792",
    pdfPages: "159",
    statement: [
      "An immersed bundle vaporiser is to be used to supply chlorine vapour to a chlorination reactor, at a rate of 10,000 kg/h. The chlorine vapour is required at 5 bar pressure. The minimum temperature of the chlorine feed will be 10°C. Hot water at 50°C is available for heating. The pressure drop on the water side must not exceed 0.8 bar.",
      "Design a vaporiser for this duty. Use stainless steel U-tubes, 6 m long, 21 mm inside diameter, 25 mm outside diameter, on a square pitch of 40 mm.",
      "The physical properties of chlorine at 5 bar are: saturation temperature 10°C, heat of vaporisation 260 kJ/kg, specific heat 0.99 kJ/kg°C, thermal conductivity 0.13 W/m°C, density 1440 kg/m³, viscosity 0.3 mN m⁻² s, surface tension 0.013 N/m, vapour density 16.3 kg/m³.",
      "The vapour pressure can be estimated from ln(P) = 9.34 − 1978/(T + 246), with P in bar and T in °C.",
    ],
    understand: {
      asking: "The question asks for a vaporiser design. The tube diameter, length and pitch are fixed. The number of U-tubes is not.",
      type: "Immersed U-tube bundle. Section 12.11.6 applies the kettle method to submerged bundles.",
      provided: "Flow, pressure, the minimum feed temperature, water inlet temperature, pressure-drop limit, tube geometry, a full property set, and a vapour-pressure equation.",
      calculate: "At the minimum feed temperature the sensible load is zero because the feed and the boiling point are both 10°C. The latent duty, the vapour-pressure check, the single-tube critical flux, and the pitch ratio can be calculated. The tube count still needs a boiling coefficient and a water-side temperature rise.",
      procedure: "Section 12.11.6, equations 12.64 and 12.74. The pitch guide in that section is 1.5 to 2.0 tube diameters. Stainless-steel conductivity in Table 12.6 is 16 W/m°C.",
      why: "An immersed bundle is the submerged-bundle equipment described at the start of Section 12.11.6.",
      strategy: ["Check the vapour-pressure equation at 10°C against the stated 5 bar.", "Calculate the minimum-feed duty as latent heat only.", "Check the pitch ratio.", "Calculate the single-tube critical flux.", "Leave the tube count until a water outlet temperature and a boiling coefficient can be fixed from printed data."],
    },
    given: [
      { quantity: "Chlorine rate", symbol: "m", value: "10000", unit: "kg/h" },
      { quantity: "Pressure", symbol: "P", value: "5", unit: "bar" },
      { quantity: "Minimum feed temperature", symbol: "Tf", value: "10", unit: "°C" },
      { quantity: "Water temperature", symbol: "tw", value: "50", unit: "°C" },
      { quantity: "Water pressure-drop limit", symbol: "ΔP", value: "0.8", unit: "bar" },
      { quantity: "Tube length", symbol: "L", value: "6", unit: "m" },
      { quantity: "Inside diameter", symbol: "di", value: "21", unit: "mm" },
      { quantity: "Outside diameter", symbol: "do", value: "25", unit: "mm" },
      { quantity: "Square pitch", symbol: "pt", value: "40", unit: "mm" },
      { quantity: "Saturation temperature", symbol: "Tsat", value: "10", unit: "°C" },
      { quantity: "Latent heat", symbol: "λ", value: "260", unit: "kJ/kg" },
      { quantity: "Specific heat", symbol: "cp", value: "0.99", unit: "kJ/kg°C" },
      { quantity: "Conductivity", symbol: "k", value: "0.13", unit: "W/m°C" },
      { quantity: "Liquid density", symbol: "ρL", value: "1440", unit: "kg/m³" },
      { quantity: "Viscosity", symbol: "μ", value: "0.3", unit: "mN s/m²" },
      { quantity: "Surface tension", symbol: "σ", value: "0.013", unit: "N/m" },
      { quantity: "Vapour density", symbol: "ρv", value: "16.3", unit: "kg/m³" },
    ],
    conversions: ["10000 kg/h = 2.7778 kg/s", "25 mm = 0.025 m", "40 mm = 0.040 m", "0.3 mN s/m² = 3.0×10⁻⁴ N s/m²"],
    assumptions: ["The controlling feed temperature is the stated minimum, 10°C. Because that equals Tsat, the sensible load at that condition is zero.", "Water outlet temperature is not printed, so the water flow is not fixed."],
    missing: ["Water outlet temperature or water flow.", "Critical pressure, if Mostinski’s equation 12.63 were to be used.", "A chosen tube count. Equation 12.74 cannot be evaluated until Nt is chosen, and choosing it requires the missing water-side temperatures."],
    formulaIds: ["12.64", "12.74", "12.75"],
    steps: [
      computed("pressure", "Check the vapour-pressure equation at 10°C", "The problem gives both Tsat = 10°C at 5 bar and an equation. The equation should be tested at the stated point before it is used anywhere else.", "\\ln P = 9.34 - 1978/(T+246)", "Equation printed in Problem 12.11, p. 792.", [{ symbol: "T", meaning: "10°C" }], vapour, "The equation returns 5.020 bar. The problem states 5 bar. The difference is 0.020 bar, so the printed equation and the printed saturation point agree to the precision of the stated pressure.", "Forcing the equation to return exactly 5 by changing 9.34 or 1978."),
      computed("duty", "Duty at the minimum feed temperature", "Feed at 10°C and boiling at 10°C means there is no sensible heat at the stated minimum condition. The specific heat is not needed for this case.", "Q = m\\lambda", "Latent heat and flow printed in the problem.", [{ symbol: "m", meaning: "10000 kg/h" }, { symbol: "\\lambda", meaning: "260 kJ/kg" }], duty11, "722.2 kW. If the feed were warmer than 10°C it would flash, but the problem gives 10°C as the minimum and the saturation temperature is also 10°C.", "Adding cp(50−10) by confusing the water temperature with the chlorine feed."),
      {
        id: "pitch",
        title: "Pitch ratio",
        why: "Section 12.11.6 says a pitch of 1.5 to 2.0 outside diameters should be used to avoid vapour blanketing.",
        formulaTex: "p_t/d_o",
        source: "Section 12.11.6, p. 751.",
        variables: [{ symbol: "p_t", meaning: "40 mm" }, { symbol: "d_o", meaning: "25 mm" }],
        substitutionTex: "40/25",
        arithmetic: ["40/25 = 1.60"],
        resultText: "1.60",
        value: 1.6,
        unit: "—",
        verification: "1.60 lies inside the printed interval 1.5 to 2.0.",
        mistake: "Comparing 40 mm with the inside diameter.",
        status: "computed",
      },
      computed("zuber", "Single-tube critical flux", "Any later tube count must keep the operating flux below the critical flux. Equation 12.64 can be evaluated now because every property in it is printed.", "q_c=0.131\\lambda[\\sigma g(\\rho_L-\\rho_v)\\rho_v^2]^{1/4}", "Equation 12.64, p. 733.", [{ symbol: "\\sigma", meaning: "0.013 N/m" }, { symbol: "\\lambda", meaning: "260000 J/kg" }], zuber11, `${sig(zuber11.value)} W/m² is the single-tube limit. The bundle limit, equation 12.74, is lower and needs Nt.`, "Using λ = 260 instead of 260000 J/kg."),
      blocked("count", "Number of U-tubes", "The area required is Q/(U ΔTm). The water temperature changes, and no outlet temperature is given, so ΔTm is not fixed. Equation 12.62 also needs the wall temperature.", "A = Q/(U\\Delta T_m)", "Section 12.11.6. Water outlet temperature is not printed.", [{ symbol: "t_{out}", meaning: "Not printed" }], "The hot-water outlet temperature is not in this PDF, so the tube count is not calculated.", "Assuming the water is isothermal at 50°C."),
    ],
    verification: "Incomplete due to missing source information",
    verificationNote: "The vapour-pressure check, latent duty, pitch ratio and Zuber flux were recalculated from the printed equation and properties. The tube count is not given. There is no answer key.",
    finals: [
      { label: "Vapour pressure at 10°C", text: `${sig(vapour.value)} bar` },
      { label: "Minimum-feed duty", text: `${sig(duty11.value / 1000)} kW` },
      { label: "Pitch ratio", text: "1.60" },
      { label: "Single-tube critical flux", text: `${sig(zuber11.value)} W/m²` },
      { label: "Tube count", text: "Not calculated." },
    ],
    diagram: "immersed",
    practice: [
      { id: "duty", prompt: "Calculate the minimum-feed duty in kW.", expected: duty11.value / 1000, unit: "kW", relTolerance: 0.005, absTolerance: 0.5, hints: ["At 10°C the sensible load is zero.", "Q = mλ.", "m = 10000/3600 kg/s and λ = 260 kJ/kg."] },
      { id: "pitch", prompt: "Calculate the pitch ratio pt/do.", expected: 1.6, unit: "—", relTolerance: 0.001, absTolerance: 0.01, hints: ["Use the outside diameter.", "40 mm and 25 mm.", "40/25."] },
    ],
    mistakes: [
      { id: "water", prompt: "Find the mistake.", wrongWorking: "Sensible duty = (10000/3600) × 0.99 × (50 − 10).", correctId: "duty", explanation: "50°C is the hot-water temperature, not a chlorine temperature. The chlorine feed and its boiling point are both 10°C at the stated minimum." },
    ],
    revision: {
      objective: "Close the chlorine duty and the vapour-pressure check, then stop before an unfixed water outlet.",
      formulas: ["Printed ln P equation", "Q = mλ", "Equation 12.64", "pt/do"],
      sequence: ["Vapour-pressure check", "Duty", "Pitch", "Critical flux", "Stop"],
      intermediates: [`P(10°C) = ${sig(vapour.value)} bar`, `Q = ${sig(duty11.value / 1000)} kW`, "pt/do = 1.60"],
      mistakes: ["Heating the chlorine from 10°C to 50°C.", "Entering λ in kJ/kg into equation 12.64."],
      finalAnswer: "722.2 kW. Tube count not determined.",
    },
    checklist: ["Does the vapour-pressure equation recover about 5 bar?", "Is the sensible load zero at 10°C?", "Is pt/do inside 1.5 to 2.0?", "Is λ in J/kg?"],
    calculator: {
      inputs: [
        { key: "flow", label: "Chlorine flow", unit: "kg/h", textbook: 10000 },
        { key: "lambda", label: "Latent heat", unit: "kJ/kg", textbook: 260 },
        { key: "T", label: "Temperature for the vapour-pressure equation", unit: "°C", textbook: 10 },
      ],
      run(v) {
        const duty = latentDuty(v.flow, v.lambda)
        const pressure = chlorineVapourPressure(v.T)
        return [
          { label: "Latent duty", status: duty.ok ? "computed" : "blocked", text: duty.ok ? `${sig(duty.value)} W` : duty.reason },
          { label: "Vapour pressure", status: pressure.ok ? "computed" : "blocked", text: pressure.ok ? `${sig(pressure.value)} bar` : pressure.reason },
        ]
      },
    },
  },
]
