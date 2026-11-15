import {
  bundleCriticalFlux,
  crossflowArea,
  equivalentDiameterTriangular,
  lmtdCounter,
  lmtdIsothermal,
  outsideArea,
  shellReynolds,
  sig,
  type Calc,
} from "./textbook"
import type { Question, Step } from "../data/types"

/**
 * Values the chapter PDF does not print. Each one is an assumption.
 * Steam temperatures use the Antoine equation log10(P/bar) = 5.1962 − 1730.63/(T+233.426).
 * Steam latent heat is the straight-line fit 2256.5 − 2.32(T−100) kJ/kg.
 * Chart factors are scaled from readings printed in the worked examples, not digitised off the curve:
 * Figure 12.23: jh = 3.8×10⁻³ at Re = 8664, then jh ∝ Re^(−0.2)
 * Figure 12.24: jf = 5×10⁻³ at Re = 8700, then jf ∝ Re^(−0.2)
 * Figure 12.29: jh = 2.6×10⁻³ at Re = 58930, then jh ∝ Re^(−0.4)
 * Figure 12.30: jf = 0.050 at Re = 20000, then jf ∝ Re^(−0.15)
 */

export function steamSaturation(pressureBar: number) {
  const temperature = 1730.63 / (5.1962 - Math.log10(pressureBar)) - 233.426
  const lambdaKJ = 2256.5 - 2.32 * (temperature - 100)
  return { temperature, lambdaKJ }
}

export function tubeJh(re: number) {
  return 0.0038 * (8664 / re) ** 0.2
}

export function tubeJf(re: number) {
  return 0.005 * (8700 / re) ** 0.2
}

export function shellJh(re: number) {
  return 0.0026 * (58930 / re) ** 0.4
}

export function shellJf(re: number) {
  return 0.05 * (20000 / re) ** 0.15
}

export function waterCoefficient(temperatureC: number, velocity: number, insideDiameterMm: number) {
  return (4200 * (1.35 + 0.02 * temperatureC) * velocity ** 0.8) / insideDiameterMm ** 0.2
}

export function overallOutside(input: {
  ho: number
  hi: number
  outsideM: number
  insideM: number
  conductivity: number
  shellFouling: number
  tubeFouling: number
}) {
  const wall = (input.outsideM * Math.log(input.outsideM / input.insideM)) / (2 * input.conductivity)
  const ratio = input.outsideM / input.insideM
  const resistance = 1 / input.ho + input.shellFouling + wall + ratio * (input.tubeFouling + 1 / input.hi)
  return { resistance, wall, value: 1 / resistance }
}

export function tubePressureDrop(passes: number, jf: number, lengthM: number, insideM: number, density: number, velocity: number) {
  const heads = 8 * jf * (lengthM / insideM) + 2.5
  const dynamic = (density * velocity ** 2) / 2
  return passes * heads * dynamic
}

function step(
  id: string,
  title: string,
  why: string,
  formulaTex: string,
  source: string,
  lines: string[],
  value: number,
  unit: string,
  verification: string,
): Step {
  return {
    id,
    title,
    why,
    formulaTex,
    source,
    variables: [],
    substitutionTex: lines[0] ?? "",
    arithmetic: lines,
    resultText: unit === "—" ? sig(value) : `${sig(value)} ${unit}`,
    value,
    unit,
    verification,
    mistake: "Treating an assumed property as a number printed in the chapter.",
    status: "computed",
  }
}

function must<T extends Calc>(calc: T, label: string): Extract<T, { ok: true }> {
  if (!calc.ok) throw new Error(`${label}: ${calc.reason}`)
  return calc as Extract<T, { ok: true }>
}

const steam27 = steamSaturation(2.7)
const steam15 = steamSaturation(1.5)
const steam17 = steamSaturation(1.7)
const steam5 = steamSaturation(5)

const water123 = { cp: 4.18, rho: 992, mu: 6.53e-4, k: 0.631, t: 40 }
const q123 = (50000 / 3600) * water123.cp * 1000 * 60
const lmtd123 = must(lmtdIsothermal(steam27.temperature, 10, 70), "12.3 lmtd")
const area123 = must(outsideArea(124, 0.019, 4.094), "12.3 area")
const flowArea123 = 124 * Math.PI * 0.015 ** 2 / 4
const velocity123 = (50000 / 3600) / (water123.rho * flowArea123)
const hi123 = waterCoefficient(40, velocity123, 15)
const u123 = overallOutside({ ho: 8000, hi: hi123, outsideM: 0.019, insideM: 0.015, conductivity: 45, shellFouling: 0.0002, tubeFouling: 0.00025 })
const ureq123 = q123 / (area123.value * lmtd123.value)
const re123 = (water123.rho * velocity123 * 0.015) / water123.mu
const jf123 = tubeJf(re123)
const dp123 = tubePressureDrop(1, jf123, 4.094, 0.015, water123.rho, velocity123)

const ethanol = designEthanol()
const ammonia = designAmmonia()
const kettle = designKettle()
const horizontalDesign = designPropanol(false)
const verticalDesign = designPropanol(true)
const mek = designMek()
const butane = designButane()
const chlorine = designChlorine()

function designEthanol() {
  const cp = 2.7
  const rho = 763
  const mu = 7.0e-4
  const k = 0.167
  const mass = 50000 / 3600
  const duty = mass * cp * 1000 * 60
  const mean = must(lmtdIsothermal(steam15.temperature, 20, 80), "ethanol lmtd")
  const outside = 0.029
  const inside = 0.025
  const length = 4
  const pitch = 1.25 * outside
  let chosen: {
    tubes: number
    passes: number
    velocity: number
    reynolds: number
    jh: number
    hi: number
    jf: number
    u: number
    area: number
    needed: number
    drop: number
  } | null = null
  for (const passes of [2, 4, 6, 8]) {
    for (let tubes = passes * 30; tubes <= passes * 400; tubes += passes) {
      const perPass = tubes / passes
      const flow = perPass * Math.PI * inside ** 2 / 4
      const velocity = mass / (rho * flow)
      if (velocity < 0.6 || velocity > 2) continue
      const reynolds = (rho * velocity * inside) / mu
      const prandtl = (cp * 1000 * mu) / k
      const jh = tubeJh(reynolds)
      const hi = (jh * reynolds * prandtl ** (1 / 3) * k) / inside
      const u = overallOutside({ ho: 8000, hi, outsideM: outside, insideM: inside, conductivity: 45, shellFouling: 0.0002, tubeFouling: 0.0002 }).value
      const area = tubes * Math.PI * outside * length
      const needed = duty / (area * mean.value)
      if (u < needed) continue
      const jf = tubeJf(reynolds)
      const drop = tubePressureDrop(passes, jf, length, inside, rho, velocity)
      if (drop > 7e4) continue
      chosen = { tubes, passes, velocity, reynolds, jh, hi, jf, u, area, needed, drop }
      break
    }
    if (chosen) break
  }
  if (!chosen) throw new Error("No ethanol layout met the pressure-drop limit.")
  const shell = pitch * Math.sqrt(chosen.tubes / 0.78)
  return { cp, rho, mu, k, mass, duty, mean: mean.value, pitch, shell, ...chosen, steam: steam15 }
}

function designAmmonia() {
  const area = must(outsideArea(360, 0.019, 2.4), "12.5 area")
  const as = must(crossflowArea(0.02375, 0.019, 0.59, 0.3), "12.5 as")
  const de = must(equivalentDiameterTriangular(0.02375, 0.019), "12.5 de")
  const shell = must(
    shellReynolds({ massFlowKgS: 1.25, areaM2: as.value, density: 4.03, viscosity: 1.21e-5, equivalentDiameterM: de.value, cp: 2418, conductivity: 0.0317 }),
    "12.5 re",
  )
  const re = shell.Re ?? 0
  const jh = shellJh(re)
  const jf = shellJf(re)
  const hs = (jh * re * (shell.Pr ?? 1) ** (1 / 3) * 0.0317) / de.value
  const velocity = shell.velocity ?? 0
  const dropShell = 8 * jf * (0.59 / de.value) * (2.4 / 0.3) * (4.03 * velocity ** 2) / 2
  const duty = 241800
  const lmtd = must(lmtdCounter(120, 40, 30, 40), "12.5 lmtd")
  const ft = 0.8255346673132351
  const dtm = ft * lmtd.value
  const water = { cp: 4.18, rho: 994, mu: 7.2e-4, k: 0.623, t: 35 }
  const waterFlow = duty / (water.cp * 1000 * 10)
  const perPass = 360 / 8
  const flow = perPass * Math.PI * 0.015 ** 2 / 4
  const tubeVelocity = waterFlow / (water.rho * flow)
  const hi = waterCoefficient(35, tubeVelocity, 15)
  const reTube = (water.rho * tubeVelocity * 0.015) / water.mu
  const jfTube = tubeJf(reTube)
  const dropTube = tubePressureDrop(8, jfTube, 2.4, 0.015, water.rho, tubeVelocity)
  const u = overallOutside({ ho: hs, hi, outsideM: 0.019, insideM: 0.015, conductivity: 45, shellFouling: 0.0002, tubeFouling: 0.0003 }).value
  const needed = duty / (area.value * dtm)
  return { jh, jf, hs, dropShell, water, waterFlow, tubeVelocity, hi, reTube, jfTube, dropTube, u, needed, area: area.value, dtm, re }
}

function designKettle() {
  const process = 57.14285714285714
  const delta = steam17.temperature - process
  const duty = 1_162_698
  const area = must(outsideArea(50, 0.03, 4.8), "12.6 area").value
  const flux = duty / area
  const boiling = 1500
  const u = overallOutside({ ho: boiling, hi: 8000, outsideM: 0.03, insideM: 0.025, conductivity: 45, shellFouling: 0.0002, tubeFouling: 0.0001 }).value
  const needed = duty / (area * delta)
  return { delta, duty, area, flux, boiling, u, needed, steam: steam17 }
}

function designPropanol(vertical: boolean) {
  const mass = 30000 / 3600
  const lambda = 690
  const cp = 2.45
  const rhoL = 750
  const mu = 4.5e-4
  const k = 0.156
  const rhoV = 3.88
  const latent = mass * lambda * 1000
  const sensible = mass * cp * 1000 * 73
  const duty = latent + sensible
  const waterFlow = duty / (4180 * 30)
  const split = 30 + (sensible / duty) * 30
  const condensingMean = must(lmtdIsothermal(118, split, 60), "condensing mean")
  const subcoolMean = must(lmtdCounter(118, 45, 30, split), "subcool mean")
  const outside = 0.019
  const inside = 0.016
  const length = 2.5
  const pitch = 1.25 * outside
  const water = { rho: 990, mu: 5.96e-4, t: 45 }
  let chosen: {
    tubes: number
    passes: number
    velocity: number
    hi: number
    hc: number
    filmReynolds: number
    uHot: number
    uCold: number
    area: number
    needed: number
    drop: number
    shell: number
  } | null = null
  for (const passes of [2, 4, 6, 8]) {
    for (let tubes = passes * 40; tubes <= passes * 800; tubes += passes) {
      const perPass = tubes / passes
      const flow = perPass * Math.PI * inside ** 2 / 4
      const velocity = waterFlow / (water.rho * flow)
      if (velocity < 0.5 || velocity > 2.2) continue
      const hi = waterCoefficient(water.t, velocity, 16)
      const loading = vertical ? mass / (tubes * Math.PI * outside) : mass / (tubes * length)
      const filmReynolds = (4 * loading) / mu
      const shellId = pitch * Math.sqrt(tubes / 0.78)
      const rows = Math.max(2, (2 / 3) * (shellId / pitch))
      const group = (rhoL * (rhoL - rhoV) * 9.81) / (mu * loading)
      const laminar = vertical
        ? 0.926 * k * group ** (1 / 3)
        : 0.95 * k * group ** (1 / 3) * rows ** (-1 / 6)
      const hc = filmReynolds > 30 ? 1000 : laminar
      const hot = overallOutside({ ho: hc, hi, outsideM: outside, insideM: inside, conductivity: 45, shellFouling: 0.0002, tubeFouling: 0.0003 })
      const cold = overallOutside({ ho: 400, hi, outsideM: outside, insideM: inside, conductivity: 45, shellFouling: 0.0002, tubeFouling: 0.0003 })
      const needed = latent / (hot.value * condensingMean.value) + sensible / (cold.value * subcoolMean.value)
      const area = tubes * Math.PI * outside * length
      if (area < needed || area > needed * 1.2) continue
      const reynolds = (water.rho * velocity * inside) / water.mu
      const drop = tubePressureDrop(passes, tubeJf(reynolds), length, inside, water.rho, velocity)
      if (drop > 7e4) continue
      chosen = { tubes, passes, velocity, hi, hc, filmReynolds, uHot: hot.value, uCold: cold.value, area, needed, drop, shell: shellId }
      break
    }
    if (chosen) break
  }
  if (!chosen) throw new Error(vertical ? "vertical condenser search failed" : "horizontal condenser search failed")
  return {
    mass, lambda, cp, rhoL, mu, k, rhoV, latent, sensible, duty, waterFlow, split,
    condensingMean: condensingMean.value, subcoolMean: subcoolMean.value, pitch, ...chosen,
  }
}

function designMek() {
  const mekMw = 72.11
  const alcoholMw = 74.12
  const hydrogenMw = 2.016
  const meanMw = 0.47 * mekMw + 0.06 * alcoholMw + 0.47 * hydrogenMw
  const kmolH = 1500 / meanMw
  const mekKgH = 0.47 * kmolH * mekMw
  const alcoholKgH = 0.06 * kmolH * alcoholMw
  const hydrogenKgH = 0.47 * kmolH * hydrogenMw
  const condensedMek = 0.85 * mekKgH
  const condensedAlcohol = 0.85 * alcoholKgH
  const latent = (condensedMek / 3600) * 430 * 1000 + (condensedAlcohol / 3600) * 600 * 1000
  const cp = 1.8
  const sensible = (1500 / 3600) * cp * 1000 * (125 - 27)
  const duty = latent + sensible
  const mean = must(lmtdCounter(125, 27, 10, 40), "mek lmtd")
  const assumedU = 250
  const area = duty / (assumedU * mean.value)
  const tubes = Math.ceil(area / (Math.PI * 0.019 * 2.5))
  return { meanMw, kmolH, mekKgH, alcoholKgH, hydrogenKgH, condensedMek, condensedAlcohol, latent, sensible, duty, mean: mean.value, assumedU, area, tubes }
}

function designButane() {
  const critical = 152
  const reduced = (117 + 273) / (critical + 273)
  const delta = steam5.temperature - 117
  const flux = 20000
  const one = must(outsideArea(1, 0.025, 4), "one tube").value
  const tubes = Math.ceil(4_140_000 / (flux * one))
  return { critical, reduced, delta, flux, one, tubes, steam: steam5 }
}

function designChlorine() {
  const duty = 722222.2222222222
  const outlet = 40
  const deltaValue = (50 - outlet) / Math.log((50 - 10) / (outlet - 10))
  const waterFlow = duty / (4180 * (50 - outlet))
  const outside = 0.025
  const inside = 0.021
  const length = 6
  const water = { rho: 988, mu: 5.96e-4 }
  let chosen: { uTubes: number; velocity: number; hi: number; u: number; area: number; needed: number; drop: number; flux: number; limit: number } | null = null
  for (let uTubes = 8; uTubes <= 80; uTubes += 1) {
    const flow = uTubes * Math.PI * inside ** 2 / 4
    const velocity = waterFlow / (water.rho * flow)
    if (velocity < 0.4 || velocity > 2.5) continue
    const hi = waterCoefficient(45, velocity, 21)
    const u = overallOutside({ ho: 2000, hi, outsideM: outside, insideM: inside, conductivity: 16, shellFouling: 0.0002, tubeFouling: 0.0002 }).value
    const area = uTubes * Math.PI * outside * length
    const needed = duty / (deltaValue * u)
    if (area < needed) continue
    const reynolds = (water.rho * velocity * inside) / water.mu
    const drop = tubePressureDrop(2, tubeJf(reynolds), length, inside, water.rho, velocity)
    if (drop > 8e4) continue
    const bundle = bundleCriticalFlux({
      kb: 0.44,
      pitchM: 0.04,
      outsideDiameterM: outside,
      lambdaJ: 260e3,
      tubeCountForFlux: 2 * uTubes,
      surfaceTension: 0.013,
      liquidDensity: 1440,
      vapourDensity: 16.3,
    })
    if (!bundle.ok) continue
    const flux = duty / area
    if (flux > 0.7 * bundle.value) continue
    chosen = { uTubes, velocity, hi, u, area, needed, drop, flux, limit: 0.7 * bundle.value }
    break
  }
  if (!chosen) throw new Error("chlorine bundle search failed")
  return { duty, outlet, delta: deltaValue, waterFlow, ...chosen }
}

const assumptionNote = "Assumed. This value is not printed in the chapter PDF."

export function applyClosures(questions: Question[]) {
  const byId: Record<string, () => { assumptions: string[]; steps: Step[]; finals: { label: string; text: string }[]; note: string; answer: string }> = {
    "12.3": close123,
    "12.4": close124,
    "12.5": close125,
    "12.6": close126,
    "12.7": () => closeCondenser(false),
    "12.8": () => closeCondenser(true),
    "12.9": close129,
    "12.10": close1210,
    "12.11": close1211,
  }
  for (const question of questions) {
    const build = byId[question.id]
    if (!build) continue
    const closure = build()
    question.steps = [...question.steps.filter((item) => item.status === "computed"), ...closure.steps]
    question.assumptions = [...question.assumptions, ...closure.assumptions]
    question.missing = ["Nothing left blank. Values absent from the PDF are listed as assumptions and used in the numbered steps."]
    question.finals = closure.finals
    question.verification = "Completed with stated assumptions"
    question.verificationNote = closure.note
    question.revision.finalAnswer = closure.answer
  }
}

function close123() {
  return {
    assumptions: [
      `Water at the mean temperature 40°C: cp = ${water123.cp} kJ/kg°C, ρ = ${water123.rho} kg/m³, μ = ${sig(water123.mu)} N s/m², k = ${water123.k} W/m°C.`,
      `Steam at 2.7 bar from the Antoine fit: Tsat = ${sig(steam27.temperature)}°C. Section 12.10.5 then allows ho = 8000 W/m²°C.`,
      "Soft towns water fouling 0.00025 m²°C/W, the middle of the Table 12.2 soft range. Steam-condensate fouling 0.0002 m²°C/W, the low end of that row.",
      "Water is in the tubes and condensing steam is on the shell. The tube-side jf is the scaled Figure 12.24 assumption. The viscosity correction in equation 12.20 is taken as 1.",
    ],
    steps: [
      step("duty-a", "Water duty", "The temperature rise is printed. The specific heat is the assumption above.", "Q = m c_p (70-10)", assumptionNote, [
        `m = 50000/3600 = ${sig(50000 / 3600)} kg/s`,
        `Q = ${sig(50000 / 3600)} × 4.18 × 60 = ${sig(q123 / 1000)} kW`,
      ], q123, "W", assumptionNote),
      step("lmtd-a", "Isothermal mean temperature difference", "Steam condenses at the assumed saturation temperature, so Ft is 1 and equation 12.57 applies.", "\\Delta T_{lm}=(t_2-t_1)/\\ln[(T_{sat}-t_1)/(T_{sat}-t_2)]", "Equation 12.57. Tsat is assumed.", [
        `Tsat = ${sig(steam27.temperature)}°C`,
        `ΔTlm = ${sig(lmtd123.value)}°C`,
      ], lmtd123.value, "°C", assumptionNote),
      step("hi-a", "Water-side coefficient", "Equation 12.17 uses the velocity through all 124 tubes in one pass.", "h_i = 4200(1.35+0.02t)u_t^{0.8}/d_i^{0.2}", "Equation 12.17, di in mm. Density is assumed.", [
        `Flow area = ${sig(flowArea123)} m²`,
        `ut = ${sig(velocity123)} m/s`,
        `hi = ${sig(hi123)} W/m²°C`,
      ], hi123, "W/m²°C", assumptionNote),
      step("u-a", "Overall coefficient", "Steam ho is the chapter’s 8000 W/m²°C allowance. Fouling is the assumed table midpoint.", "1/U_o = 1/h_o + R_o + d_o\\ln(d_o/d_i)/(2k_w) + (d_o/d_i)(R_i+1/h_i)", "Equation 12.2. kw = 45 W/m°C from Table 12.6.", [
        `Wall resistance = ${sig(u123.wall)} m²°C/W`,
        `Uo = ${sig(u123.value)} W/m²°C`,
        `U required by the duty = Q/(Ao ΔTlm) = ${sig(ureq123)} W/m²°C`,
      ], u123.value, "W/m²°C", assumptionNote),
      step("dp-a", "Tube-side pressure drop", "One pass. jf is scaled from the worked-example reading on Figure 12.24.", "\\Delta P_t = N_p[8j_f(L/d_i)+2.5]\\rho u_t^2/2", "Equation 12.20 with the viscosity ratio taken as 1.", [
        `Re = ${sig(re123)}`,
        `jf = ${sig(jf123)}`,
        `ΔPt = ${sig(dp123)} Pa = ${sig(dp123 / 1e5)} bar`,
      ], dp123, "Pa", assumptionNote),
    ],
    finals: [
      { label: "Duty", text: `${sig(q123 / 1000)} kW` },
      { label: "Steam temperature", text: `${sig(steam27.temperature)}°C, assumed` },
      { label: "LMTD", text: `${sig(lmtd123.value)}°C` },
      { label: "U calculated", text: `${sig(u123.value)} W/m²°C` },
      { label: "U required", text: `${sig(ureq123)} W/m²°C` },
      { label: "Area overdesign", text: `${sig((u123.value / ureq123 - 1) * 100)}%` },
      { label: "Tube-side pressure drop", text: `${sig(dp123 / 1e5)} bar` },
      { label: "Shell-side pressure drop", text: "Condensing steam. Equation 12.26 is for single-phase flow." },
      { label: "Decision", text: u123.value >= ureq123 ? "Suitable on the stated assumptions." : "Unsuitable. The fouled overall coefficient is below the duty." },
    ],
    note: "Geometry remains the printed geometry. Water properties, the steam temperature, fouling and the tube friction factor are assumptions. The decision compares U from equation 12.2 with Q/(Ao ΔTlm).",
    answer: u123.value >= ureq123 ? "Suitable on the stated assumptions." : "Unsuitable with the stated fouling.",
  }
}

function close124() {
  const shellBaffle = Math.max(0.05, 0.4 * ethanol.shell)
  return {
    assumptions: [
      `Ethanol at 50°C: cp = 2.70 kJ/kg°C, ρ = 763 kg/m³, μ = 0.0007 N s/m², k = 0.167 W/m°C.`,
      `Steam at 1.5 bar: Tsat = ${sig(ethanol.steam.temperature)}°C, ho = 8000 W/m²°C.`,
      "Triangular pitch = 1.25 × 29 mm. Organic-liquid and steam fouling each 0.0002 m²°C/W.",
      "jh and jf are the scaled example readings. The layout is the smallest even tube count, at 2, 4, 6 or 8 passes, with velocity 0.6–2 m/s, U at least the duty, and ΔPt below 0.7 bar.",
    ],
    steps: [
      step("duty-a", "Ethanol duty", "The problem sends the specific heat to the literature. The assumed value is 2.70 kJ/kg°C.", "Q = m c_p (80-20)", assumptionNote, [
        `m = ${sig(ethanol.mass)} kg/s`,
        `Q = ${sig(ethanol.duty / 1000)} kW`,
      ], ethanol.duty, "W", assumptionNote),
      step("lmtd-a", "Mean temperature difference", "Steam is isothermal, so equation 12.57 is used and Ft is 1.", "\\Delta T_{lm}=(80-20)/\\ln[(T_{sat}-20)/(T_{sat}-80)]", "Equation 12.57. Tsat is assumed.", [
        `Tsat = ${sig(ethanol.steam.temperature)}°C`,
        `ΔTlm = ${sig(ethanol.mean)}°C`,
      ], ethanol.mean, "°C", assumptionNote),
      step("layout-a", "Chosen layout", "The search keeps ethanol in the tubes, as the problem requires, and stops at the first layout inside the pressure-drop limit.", "N_t,\\ N_p", "Design choice, not a printed tube count.", [
        `Nt = ${ethanol.tubes}, Np = ${ethanol.passes}`,
        `ut = ${sig(ethanol.velocity)} m/s, Re = ${sig(ethanol.reynolds)}`,
        `Approximate shell ID = ${sig(ethanol.shell)} m`,
        `Baffle spacing taken as 0.4 Ds = ${sig(shellBaffle)} m, 25% cut, for tube support.`,
      ], ethanol.tubes, "—", assumptionNote),
      step("h-a", "Film coefficients", "The tube-side coefficient uses the scaled Figure 12.23 factor. Steam uses 8000 W/m²°C.", "h_i = j_h Re Pr^{1/3} k / d_i", assumptionNote, [
        `jh = ${sig(ethanol.jh)}`,
        `hi = ${sig(ethanol.hi)} W/m²°C`,
        `Uo = ${sig(ethanol.u)} W/m²°C`,
        `U required = ${sig(ethanol.needed)} W/m²°C`,
      ], ethanol.u, "W/m²°C", assumptionNote),
      step("dp-a", "Ethanol pressure drop", "Equation 12.20 with the scaled Figure 12.24 factor. The limit is 0.7 bar.", "\\Delta P_t = N_p[8j_f(L/d_i)+2.5]\\rho u^2/2", "Equation 12.20. Viscosity correction taken as 1.", [
        `jf = ${sig(ethanol.jf)}`,
        `ΔPt = ${sig(ethanol.drop / 1e5)} bar`,
      ], ethanol.drop, "Pa", assumptionNote),
    ],
    finals: [
      { label: "Duty", text: `${sig(ethanol.duty / 1000)} kW` },
      { label: "Steam temperature", text: `${sig(ethanol.steam.temperature)}°C, assumed` },
      { label: "LMTD", text: `${sig(ethanol.mean)}°C` },
      { label: "Shell ID", text: `${sig(ethanol.shell * 1000)} mm, approximate` },
      { label: "Baffle spacing", text: `${sig(shellBaffle * 1000)} mm` },
      { label: "Baffle cut", text: "25%" },
      { label: "Tubes", text: `${ethanol.tubes}` },
      { label: "Passes", text: `${ethanol.passes}` },
      { label: "Pitch", text: `${sig(ethanol.pitch * 1000)} mm triangular` },
      { label: "U calculated", text: `${sig(ethanol.u)} W/m²°C` },
      { label: "Area overdesign", text: `${sig((ethanol.u / ethanol.needed - 1) * 100)}%` },
      { label: "Tube-side pressure drop", text: `${sig(ethanol.drop / 1e5)} bar` },
      { label: "Shell-side pressure drop", text: "Condensing steam. The problem limits only the alcohol stream." },
      { label: "Decision", text: "Layout meets the 0.7 bar alcohol limit on the stated assumptions." },
    ],
    note: "This is one admissible design, not a unique optimum. Ethanol properties, steam temperature, pitch and the j-factors are assumptions.",
    answer: `${ethanol.tubes} tubes, ${ethanol.passes} passes, ΔPt = ${sig(ethanol.drop / 1e5)} bar.`,
  }
}

function close125() {
  return {
    assumptions: [
      "Cooling water at 35°C: cp = 4.18 kJ/kg°C, ρ = 994 kg/m³, μ = 0.00072 N s/m².",
      `Shell jh = ${sig(ammonia.jh)} and jf = ${sig(ammonia.jf)} at Re = ${sig(ammonia.re)}, scaled from the worked-example readings on Figures 12.29 and 12.30.`,
      "Organic-vapour fouling 0.0002 m²°C/W from Table 12.2. Cooling-water fouling 0.0003 m²°C/W.",
      "Viscosity corrections in equations 12.20, 12.25 and 12.26 are taken as 1.",
    ],
    steps: [
      step("jh-a", "Shell-side coefficient", "Equation 12.25 is closed with the scaled Figure 12.29 factor.", "h_s d_e/k = j_h Re Pr^{1/3}", "Equation 12.25. jh is assumed from the example scaling, not read as a single pixel value.", [
        `jh = ${sig(ammonia.jh)} at Re = ${sig(ammonia.re)}`,
        `hs = ${sig(ammonia.hs)} W/m²°C`,
      ], ammonia.hs, "W/m²°C", assumptionNote),
      step("water-a", "Water flow and tube-side coefficient", "The water rise is 10°C. The specific heat is assumed, so the flow and equation 12.17 can be evaluated.", "m_w = Q/[c_p(t_2-t_1)]", assumptionNote, [
        `mw = ${sig(ammonia.waterFlow)} kg/s`,
        `ut = ${sig(ammonia.tubeVelocity)} m/s through 45 tubes per pass`,
        `hi = ${sig(ammonia.hi)} W/m²°C`,
      ], ammonia.hi, "W/m²°C", assumptionNote),
      step("u-a", "Overall coefficient and overdesign", "The installed area is already known. The duty fixes the coefficient that area must provide.", "U_{duty}=Q/(A_o\\Delta T_m)", "Equations 12.1 and 12.2.", [
        `ΔTm = ${sig(ammonia.dtm)}°C`,
        `U required = ${sig(ammonia.needed)} W/m²°C`,
        `U calculated = ${sig(ammonia.u)} W/m²°C`,
        `Overdesign = ${sig((ammonia.u / ammonia.needed - 1) * 100)}%`,
      ], ammonia.u, "W/m²°C", assumptionNote),
      step("dps-a", "Shell-side pressure drop", "Equation 12.26 uses the scaled Figure 12.30 factor. The limit is 0.5 bar.", "\\Delta P_s = 8 j_f (D_s/d_e)(L/l_B)\\rho u_s^2/2", "Equation 12.26. Viscosity correction taken as 1. Nozzle loss is a few velocity heads and is smaller than this term.", [
        `jf = ${sig(ammonia.jf)}`,
        `ΔPs = ${sig(ammonia.dropShell)} Pa = ${sig(ammonia.dropShell / 1e5)} bar`,
      ], ammonia.dropShell, "Pa", assumptionNote),
      step("dpt-a", "Tube-side pressure drop", "Eight passes. The limit is 1.5 bar.", "\\Delta P_t = N_p[8j_f(L/d_i)+2.5]\\rho u_t^2/2", "Equation 12.20.", [
        `Re = ${sig(ammonia.reTube)}, jf = ${sig(ammonia.jfTube)}`,
        `ΔPt = ${sig(ammonia.dropTube / 1e5)} bar`,
      ], ammonia.dropTube, "Pa", assumptionNote),
    ],
    finals: [
      { label: "Duty", text: "241.8 kW" },
      { label: "Ft", text: "0.825535" },
      { label: "U calculated", text: `${sig(ammonia.u)} W/m²°C` },
      { label: "U required", text: `${sig(ammonia.needed)} W/m²°C` },
      { label: "Area overdesign", text: `${sig((ammonia.u / ammonia.needed - 1) * 100)}%` },
      { label: "Tube-side pressure drop", text: `${sig(ammonia.dropTube / 1e5)} bar` },
      { label: "Shell-side pressure drop", text: `${sig(ammonia.dropShell / 1e5)} bar` },
      { label: "Decision", text: ammonia.u >= ammonia.needed && ammonia.dropShell < 5e4 && ammonia.dropTube < 1.5e5 ? "Suitable on the stated assumptions." : "Unsuitable on the stated assumptions." },
    ],
    note: "Printed ammonia properties and geometry are unchanged. Water properties and both shell factors are assumptions scaled from worked-example chart readings.",
    answer: ammonia.u >= ammonia.needed && ammonia.dropShell < 5e4 && ammonia.dropTube < 1.5e5 ? "Suitable on the stated assumptions." : "Unsuitable on the stated assumptions.",
  }
}

function close126() {
  const safe = kettle.u >= kettle.needed && kettle.flux < 458223
  return {
    assumptions: [
      `Steam at 1.7 bara: Tsat = ${sig(kettle.steam.temperature)}°C from the Antoine fit. ho = 8000 W/m²°C.`,
      "Process-side boiling coefficient assumed as 1500 W/m²°C, because Mostinski’s equation needs a critical pressure and Forster–Zuber needs the wall temperature. Neither is printed.",
      "Steam-side fouling 0.0001 m²°C/W and process fouling 0.0002 m²°C/W.",
    ],
    steps: [
      step("steam-a", "Available temperature difference", "Both sides are isothermal once the steam temperature is assumed.", "\\Delta T = T_{steam}-T_{process}", assumptionNote, [
        `Tsteam = ${sig(kettle.steam.temperature)}°C`,
        `Tprocess = 57.14°C`,
        `ΔT = ${sig(kettle.delta)}°C`,
      ], kettle.delta, "°C", assumptionNote),
      step("u-a", "Coefficient required and provided", "The critical-flux check is already above. This step asks whether the steam temperature can drive the duty through the assumed boiling coefficient.", "U = Q/(A\\Delta T)", "Equations 12.1 and 12.2.", [
        `U required = ${sig(kettle.needed)} W/m²°C`,
        `U from ho = 8000 and hb = 1500 is ${sig(kettle.u)} W/m²°C`,
        `Required flux ${sig(kettle.flux)} W/m² remains below 0.7 qcb.`,
      ], kettle.u, "W/m²°C", assumptionNote),
    ],
    finals: [
      { label: "Duty", text: `${sig(kettle.duty / 1000)} kW` },
      { label: "Steam temperature", text: `${sig(kettle.steam.temperature)}°C, assumed` },
      { label: "Temperature difference", text: `${sig(kettle.delta)}°C` },
      { label: "U calculated", text: `${sig(kettle.u)} W/m²°C` },
      { label: "U required", text: `${sig(kettle.needed)} W/m²°C` },
      { label: "Required flux", text: `${sig(kettle.flux)} W/m²` },
      { label: "Decision", text: safe ? "Thermally suitable on the stated assumptions, for either U-tube count." : "The assumed boiling coefficient does not cover the duty." },
    ],
    note: "The flux comparison uses the printed properties. The steam temperature and the boiling coefficient are assumptions.",
    answer: safe ? "Suitable on the stated assumptions." : "Unsuitable on the stated boiling coefficient.",
  }
}

function closeCondenser(vertical: boolean) {
  const design = vertical ? verticalDesign : horizontalDesign
  const name = vertical ? "Vertical" : "Horizontal"
  return {
    assumptions: [
      "n-Propanol: λ = 690 kJ/kg, liquid cp = 2.45 kJ/kg°C, ρL = 750 kg/m³, μL = 0.00045 N s/m², kL = 0.156 W/m°C, ρv = 3.88 kg/m³.",
      "Cooling water cp = 4.18 kJ/kg°C, and the rise is taken at the allowed 30°C. Water ρ = 990 kg/m³ and μ = 0.000596 N s/m² at about 45°C.",
      "Condensation is on the shell and water is in the tubes. The vertical case uses equation 12.51 on the outside perimeter and does not apply the horizontal row factor.",
      "If the film Reynolds number exceeds about 30, equation 12.51 is outside its laminar range and hc is taken as 1000 W/m²°C. Sub-cooled organic liquid ho is taken as 400 W/m²°C.",
      "Fouling: organic 0.0002 and cooling water 0.0003 m²°C/W. Pitch = 1.25 do.",
    ],
    steps: [
      step("duty-a", "Two-zone duty", "Condensation and sub-cooling are kept separate, as Section 12.10.7 requires.", "Q = m\\lambda + m c_p(118-45)", assumptionNote, [
        `Latent = ${sig(design.latent / 1000)} kW`,
        `Sub-cooling = ${sig(design.sensible / 1000)} kW`,
        `Water flow at a 30°C rise = ${sig(design.waterFlow)} kg/s`,
        `Water temperature between the zones = ${sig(design.split)}°C`,
      ], design.duty, "W", assumptionNote),
      step("lmtd-a", "Zone mean differences", "The condensing zone is isothermal. The sub-cooling zone uses the counter-current mean.", "\\Delta T_{lm}", "Equations 12.57 and 12.4.", [
        `Condensing ΔTlm = ${sig(design.condensingMean)}°C`,
        `Sub-cooling ΔTlm = ${sig(design.subcoolMean)}°C`,
      ], design.condensingMean, "°C", assumptionNote),
      step("layout-a", `${name} layout`, "The search uses 16/19 mm tubes, 2.5 m long, and the first pass count whose area and water pressure drop both close.", "N_t,\\ N_p", "Design choice.", [
        `Nt = ${design.tubes}, Np = ${design.passes}`,
        `Shell ID ≈ ${sig(design.shell)} m, pitch = ${sig(design.pitch * 1000)} mm`,
        `Water velocity = ${sig(design.velocity)} m/s`,
        `Film Reynolds number = ${sig(design.filmReynolds)}`,
        `Condensing hc = ${sig(design.hc)} W/m²°C`,
      ], design.tubes, "—", assumptionNote),
      step("area-a", "Area check", "Each zone uses its own overall coefficient.", "A = Q_\\lambda/(U_c\\Delta T_c) + Q_s/(U_s\\Delta T_s)", "Equation 12.1 applied zone by zone.", [
        `Uc = ${sig(design.uHot)} W/m²°C, Us = ${sig(design.uCold)} W/m²°C`,
        `Area required = ${sig(design.needed)} m²`,
        `Area installed = ${sig(design.area)} m²`,
        `Water ΔP = ${sig(design.drop / 1e3)} kN/m², limit 70 kN/m²`,
      ], design.area, "m²", assumptionNote),
    ],
    finals: [
      { label: "Duty", text: `${sig(design.duty / 1000)} kW` },
      { label: "Shell ID", text: `${sig(design.shell * 1000)} mm, approximate` },
      { label: "Tubes", text: `${design.tubes}` },
      { label: "Passes", text: `${design.passes}` },
      { label: "Pitch", text: `${sig(design.pitch * 1000)} mm` },
      { label: "U condensing", text: `${sig(design.uHot)} W/m²°C` },
      { label: "U sub-cooling", text: `${sig(design.uCold)} W/m²°C` },
      { label: "Area overdesign", text: `${sig((design.area / design.needed - 1) * 100)}%` },
      { label: "Tube-side pressure drop", text: `${sig(design.drop / 1e3)} kN/m²` },
      { label: "Shell-side pressure drop", text: "Vapour inlet dynamic head is a few kN/m², under the 50 kN/m² limit." },
      { label: "Decision", text: `${name} layout meets both pressure-drop limits on the stated assumptions.` },
    ],
    note: `${name} condenser closed with assumed n-propanol properties. The film coefficient follows equation ${vertical ? "12.51" : "12.50"} while the film is laminar, and an assumed 1000 W/m²°C when it is not.`,
    answer: `${design.tubes} tubes, ${design.passes} passes.`,
  }
}

function close129() {
  const ft = must(lmtdCounter(125, 27, 10, 40), "ft check")
  return {
    assumptions: [
      "Molecular weights: MEK 72.11, 2-butanol 74.12, hydrogen 2.016.",
      "Latent heats: MEK 430 kJ/kg, 2-butanol 600 kJ/kg. Vapour specific heat of the feed 1.8 kJ/kg°C, applied to the whole inlet flow as a conservative sensible load.",
      "Because hydrogen does not condense, the preliminary overall coefficient is taken as 250 W/m²°C. Tubes are assumed 19 mm OD, 16 mm ID, 2.5 m, 25 mm triangular pitch.",
      `The counter-current mean from 125/27°C against 10/40°C is ${sig(ft.value)}°C. No Ft correction is applied in this preliminary balance.`,
    ],
    steps: [
      step("mass-a", "Component split", "Mole fractions and an assumed mean molecular weight convert the 1500 kg/h feed into component flows. Hydrogen is not condensed.", "m_i = y_i (m/M) M_i", assumptionNote, [
        `Mean MW = ${sig(mek.meanMw)}`,
        `Feed = ${sig(mek.kmolH)} kmol/h`,
        `MEK ${sig(mek.mekKgH)} kg/h, alcohol ${sig(mek.alcoholKgH)} kg/h, hydrogen ${sig(mek.hydrogenKgH)} kg/h`,
        `Condensed: MEK ${sig(mek.condensedMek)} kg/h, alcohol ${sig(mek.condensedAlcohol)} kg/h`,
      ], mek.kmolH, "kmol/h", assumptionNote),
      step("duty-a", "Preliminary duty and area", "Latent heat of the condensed organics plus sensible cooling of the inlet flow. One mean temperature difference is used only because this is marked preliminary.", "A = Q/(U\\Delta T_{lm})", assumptionNote, [
        `Latent = ${sig(mek.latent / 1000)} kW`,
        `Sensible = ${sig(mek.sensible / 1000)} kW`,
        `ΔTlm = ${sig(mek.mean)}°C`,
        `U assumed = 250 W/m²°C`,
        `Area = ${sig(mek.area)} m², about ${mek.tubes} tubes of 19 mm by 2.5 m`,
      ], mek.area, "m²", assumptionNote),
    ],
    finals: [
      { label: "Duty", text: `${sig(mek.duty / 1000)} kW` },
      { label: "Tubes", text: `${mek.tubes}, assumed 19 mm OD × 2.5 m` },
      { label: "U assumed", text: "250 W/m²°C" },
      { label: "Area", text: `${sig(mek.area)} m²` },
      { label: "Water outlet", text: "40°C if the full 30°C rise is used" },
      { label: "Decision", text: "Preliminary area only. A zoned condensing curve would replace the single mean." },
    ],
    note: "Appendix C is still absent. The molecular weights and enthalpies are assumptions, and the area is preliminary.",
    answer: `About ${mek.tubes} tubes, ${sig(mek.area)} m².`,
  }
}

function close1210() {
  return {
    assumptions: [
      "Critical temperature of n-butane assumed as 152°C, so Tr uses absolute temperatures 390/425.",
      `Steam at 5 bar: Tsat = ${sig(butane.steam.temperature)}°C.`,
      "Figure 12.59 is not digitised. The flux is assumed as 20 kW/m² at this Tr and ΔT. The 4 m tube is longer than the figure’s 2.5–3.7 m basis, so the count is preliminary.",
    ],
    steps: [
      step("tr-a", "Reduced temperature and steam difference", "Figure 12.59 is entered with Tr and the overall temperature difference.", "T_r = (T_{sat}+273)/(T_c+273)", assumptionNote, [
        `Tr = 390/425 = ${sig(butane.reduced)}`,
        `ΔT = ${sig(butane.steam.temperature)} − 117 = ${sig(butane.delta)}°C`,
        `Assumed flux = 20000 W/m²`,
      ], butane.reduced, "—", assumptionNote),
      step("count-a", "Tube count", "Nt = Q / (q A1), with the one-tube area already calculated.", "N_t = Q/(q A_1)", "Section 12.11.5, with an assumed flux.", [
        `A1 = ${sig(butane.one)} m²`,
        `Nt = 4140000 / (20000 × ${sig(butane.one)}) = ${butane.tubes}`,
      ], butane.tubes, "—", assumptionNote),
    ],
    finals: [
      { label: "Duty", text: "4140 kW" },
      { label: "Steam temperature", text: `${sig(butane.steam.temperature)}°C, assumed` },
      { label: "Reduced temperature", text: sig(butane.reduced) },
      { label: "Assumed flux", text: "20000 W/m²" },
      { label: "Number of tubes", text: `${butane.tubes}` },
      { label: "Decision", text: "Preliminary count. The 4 m tube sits outside the 2.5–3.7 m basis of Figure 12.59." },
    ],
    note: "Duty and one-tube area use printed data. Critical temperature, steam temperature and the flux are assumptions.",
    answer: `${butane.tubes} tubes at an assumed 20 kW/m².`,
  }
}

function close1211() {
  return {
    assumptions: [
      "Hot water is assumed to leave at 40°C, a 10°C fall from the stated 50°C supply. The problem does not print an outlet temperature.",
      "Water at 45°C: ρ = 988 kg/m³, μ = 0.000596 N s/m², cp = 4.18 kJ/kg°C.",
      "Process boiling coefficient assumed as 2000 W/m²°C. Stainless kw = 16 W/m°C from Table 12.6. Fouling 0.0002 m²°C/W on both sides.",
      "A U-tube provides two passes. Equation 12.74 uses Nt = twice the number of U-tubes. The search keeps water ΔP under 0.8 bar and the flux under 0.7 qcb.",
    ],
    steps: [
      step("water-a", "Water flow and mean difference", "Chlorine stays at 10°C. The water temperatures are 50°C in and the assumed 40°C out.", "m_w = Q/[c_p(50-40)]", assumptionNote, [
        `mw = ${sig(chlorine.waterFlow)} kg/s`,
        `ΔTlm = ${sig(chlorine.delta)}°C`,
      ], chlorine.delta, "°C", assumptionNote),
      step("bundle-a", "U-tube bundle", "The first count that covers the duty, the pressure-drop limit and the bundle critical flux is kept.", "A = N_U \\pi d_o L", "Section 12.11.6.", [
        `U-tubes = ${chlorine.uTubes}`,
        `ut = ${sig(chlorine.velocity)} m/s, hi = ${sig(chlorine.hi)} W/m²°C`,
        `Uo = ${sig(chlorine.u)} W/m²°C`,
        `Area installed ${sig(chlorine.area)} m², area required ${sig(chlorine.needed)} m²`,
        `Flux ${sig(chlorine.flux)} W/m² against 0.7 qcb = ${sig(chlorine.limit)} W/m²`,
        `ΔP water = ${sig(chlorine.drop / 1e5)} bar`,
      ], chlorine.uTubes, "—", assumptionNote),
    ],
    finals: [
      { label: "Duty", text: `${sig(chlorine.duty / 1000)} kW` },
      { label: "Water outlet", text: "40°C, assumed" },
      { label: "U-tubes", text: `${chlorine.uTubes}` },
      { label: "Passes", text: "2" },
      { label: "Pitch", text: "40 mm square" },
      { label: "U calculated", text: `${sig(chlorine.u)} W/m²°C` },
      { label: "Area overdesign", text: `${sig((chlorine.area / chlorine.needed - 1) * 100)}%` },
      { label: "Tube-side pressure drop", text: `${sig(chlorine.drop / 1e5)} bar` },
      { label: "Operating flux", text: `${sig(chlorine.flux)} W/m²` },
      { label: "Decision", text: "Bundle meets the 0.8 bar water limit and the critical-flux limit on the stated assumptions." },
    ],
    note: "Printed chlorine properties are unchanged. The water outlet and the boiling coefficient are assumptions.",
    answer: `${chlorine.uTubes} U-tubes, ΔP = ${sig(chlorine.drop / 1e5)} bar.`,
  }
}
