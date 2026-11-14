export const G = 9.81

export type Ok = {
  ok: true
  value: number
  unit: string
  substitution: string
  lines: string[]
}

export type Blocked = {
  ok: false
  reason: string
  lines: string[]
}

export type Calc = Ok | Blocked

export function sig(value: number, digits = 6): string {
  if (!Number.isFinite(value)) return "undefined"
  if (value === 0) return "0"
  const abs = Math.abs(value)
  if (abs >= 1e7 || abs < 1e-3) {
    return value.toExponential(4).replace(/(\.\d*?)0+e/, "$1e").replace(/\.e/, "e")
  }
  return String(Number(value.toPrecision(digits)))
}

function ok(value: number, unit: string, substitution: string, lines: string[]): Ok {
  return { ok: true, value, unit, substitution, lines }
}

function blocked(reason: string, lines: string[] = []): Blocked {
  return { ok: false, reason, lines }
}

export function requirePositive(name: string, value: number): string | null {
  if (!Number.isFinite(value)) return `${name} is not a finite number.`
  if (value <= 0) return `${name} must be greater than zero.`
  return null
}

export function sensibleDuty(input: {
  massFlowKgH: number
  cpKJ: number
  hotIn: number
  hotOut: number
}): Calc {
  const flowError = requirePositive("mass flow", input.massFlowKgH)
  const cpError = requirePositive("specific heat", input.cpKJ)
  if (flowError) return blocked(flowError)
  if (cpError) return blocked(cpError)
  const m = input.massFlowKgH / 3600
  const delta = input.hotIn - input.hotOut
  if (delta === 0) return blocked("The temperature change is zero, so the sensible duty is zero.")
  const qW = m * input.cpKJ * 1000 * delta
  return ok(qW, "W", `Q = (${sig(input.massFlowKgH)}/3600) \\times ${sig(input.cpKJ)} \\times (${sig(input.hotIn)}-${sig(input.hotOut)})`, [
    `${sig(input.massFlowKgH)}/3600 = ${sig(m)} kg/s`,
    `${sig(input.hotIn)} - ${sig(input.hotOut)} = ${sig(delta)} °C`,
    `${sig(m)} × ${sig(input.cpKJ)} × ${sig(delta)} = ${sig(qW / 1000)} kW`,
    `${sig(qW / 1000)} kW = ${sig(qW)} W`,
  ])
}

export function latentDuty(massFlowKgH: number, lambdaKJ: number): Calc {
  const flowError = requirePositive("mass flow", massFlowKgH)
  const latentError = requirePositive("latent heat", lambdaKJ)
  if (flowError) return blocked(flowError)
  if (latentError) return blocked(latentError)
  const m = massFlowKgH / 3600
  const qW = m * lambdaKJ * 1000
  return ok(qW, "W", `Q = (${sig(massFlowKgH)}/3600) \\times ${sig(lambdaKJ)}`, [
    `${sig(massFlowKgH)}/3600 = ${sig(m)} kg/s`,
    `${sig(m)} × ${sig(lambdaKJ)} = ${sig(qW / 1000)} kW`,
  ])
}

export function massFlowFromKgPerS(massFlowKgS: number, lambdaKJ: number): Calc {
  const flowError = requirePositive("mass flow", massFlowKgS)
  const latentError = requirePositive("latent heat", lambdaKJ)
  if (flowError) return blocked(flowError)
  if (latentError) return blocked(latentError)
  const qW = massFlowKgS * lambdaKJ * 1000
  return ok(qW, "W", `Q = ${sig(massFlowKgS)} \\times ${sig(lambdaKJ)}`, [
    `${sig(massFlowKgS)} × ${sig(lambdaKJ)} = ${sig(qW / 1000)} kW`,
  ])
}

export function linearInterpolation(x: number, x1: number, y1: number, x2: number, y2: number): Calc {
  if (x2 === x1) return blocked("The two table pressures are identical, so the slope is undefined.")
  if (x < Math.min(x1, x2) || x > Math.max(x1, x2)) {
    return blocked("The requested value lies outside the two adjacent table entries. Extrapolation is not used.")
  }
  const y = y1 + ((x - x1) / (x2 - x1)) * (y2 - y1)
  return ok(y, "°C", `T = ${sig(y1)} + \\dfrac{${sig(x)}-${sig(x1)}}{${sig(x2)}-${sig(x1)}}(${sig(y2)}-${sig(y1)})`, [
    `(${sig(x)} - ${sig(x1)}) / (${sig(x2)} - ${sig(x1)}) = ${sig((x - x1) / (x2 - x1))}`,
    `${sig(y1)} + ${sig((x - x1) / (x2 - x1))} × (${sig(y2)} - ${sig(y1)}) = ${sig(y)} °C`,
  ])
}

/** Equation 12.4, counter-current terminal differences. */
export function lmtdCounter(T1: number, T2: number, t1: number, t2: number): Calc {
  const left = T1 - t2
  const right = T2 - t1
  if (left <= 0 || right <= 0) {
    return blocked("A terminal temperature difference is zero or negative. Equation 12.4 is not defined for a temperature cross of that sign.", [
      `T1 - t2 = ${sig(left)} °C`,
      `T2 - t1 = ${sig(right)} °C`,
    ])
  }
  if (Math.abs(left - right) < 1e-9) {
    return ok(left, "°C", `\\Delta T_{lm} = ${sig(left)}`, [
      "The two terminal differences are equal, so the logarithmic mean equals that difference.",
    ])
  }
  const value = (left - right) / Math.log(left / right)
  return ok(value, "°C", `\\Delta T_{lm} = \\dfrac{(${sig(T1)}-${sig(t2)})-(${sig(T2)}-${sig(t1)})}{\\ln\\left(\\dfrac{${sig(T1)}-${sig(t2)}}{${sig(T2)}-${sig(t1)}}\\right)}`, [
    `T1 - t2 = ${sig(left)} °C`,
    `T2 - t1 = ${sig(right)} °C`,
    `ln(${sig(left)}/${sig(right)}) = ln(${sig(left / right)}) = ${sig(Math.log(left / right))}`,
    `(${sig(left)} - ${sig(right)}) / ${sig(Math.log(left / right))} = ${sig(value)} °C`,
  ])
}

/** Equation 12.57 for isothermal condensation. */
export function lmtdIsothermal(Tsat: number, t1: number, t2: number): Calc {
  const a = Tsat - t1
  const b = Tsat - t2
  if (a <= 0 || b <= 0) return blocked("A coolant temperature reaches or passes the saturation temperature.")
  if (Math.abs(t2 - t1) < 1e-12) return blocked("The coolant temperature rise is zero.")
  const value = (t2 - t1) / Math.log(a / b)
  return ok(value, "°C", `\\Delta T_{lm} = \\dfrac{${sig(t2)}-${sig(t1)}}{\\ln\\left(\\dfrac{${sig(Tsat)}-${sig(t1)}}{${sig(Tsat)}-${sig(t2)}}\\right)}`, [
    `t2 - t1 = ${sig(t2 - t1)} °C`,
    `Tsat - t1 = ${sig(a)} °C`,
    `Tsat - t2 = ${sig(b)} °C`,
    `${sig(t2 - t1)} / ln(${sig(a)}/${sig(b)}) = ${sig(value)} °C`,
  ])
}

export function temperatureRatios(T1: number, T2: number, t1: number, t2: number): Calc & { R?: number; S?: number } {
  const shellRise = t2 - t1
  const hotDrop = T1 - T2
  const approach = T1 - t1
  if (shellRise === 0 || approach === 0) {
    return blocked("R or S has a zero denominator. Check which fluid is on the shell side before using equations 12.6 and 12.7.")
  }
  const R = hotDrop / shellRise
  const S = shellRise / approach
  return {
    ok: true,
    value: R,
    unit: "—",
    substitution: `R = (${sig(T1)}-${sig(T2)})/(${sig(t2)}-${sig(t1)}),\\ S = (${sig(t2)}-${sig(t1)})/(${sig(T1)}-${sig(t1)})`,
    lines: [`R = ${sig(hotDrop)}/${sig(shellRise)} = ${sig(R)}`, `S = ${sig(shellRise)}/${sig(approach)} = ${sig(S)}`],
    R,
    S,
  }
}

/** Equation 12.8. Valid for one shell pass and an even number of tube passes. */
export function correctionFactor(R: number, S: number): Calc {
  if (!Number.isFinite(R) || !Number.isFinite(S)) return blocked("R and S must be finite.")
  if (S <= 0 || S >= 1) return blocked("S is outside the open interval (0, 1), so equation 12.8 does not give a usable correction factor.")
  const root = Math.sqrt(R * R + 1)
  const firstNumerator = 1 - S
  const firstDenominator = 1 - R * S
  if (firstDenominator <= 0 || firstNumerator <= 0) {
    return blocked("The argument (1-S)/(1-RS) is not positive. On Figure 12.19 this is the region where a one-shell-pass curve does not give a correction factor. Another shell arrangement is required.")
  }
  const secondNumerator = 2 - S * (R + 1 - root)
  const secondDenominator = 2 - S * (R + 1 + root)
  if (secondNumerator <= 0 || secondDenominator <= 0) {
    return blocked("A logarithm argument in equation 12.8 is not positive. The book’s Figure 12.19 has no intersection for this (R, S) pair on one shell pass.")
  }
  if (Math.abs(R - 1) < 1e-8) {
    const limitDenominator = (1 - S) * Math.log(secondNumerator / secondDenominator)
    const value = (S * Math.SQRT2) / limitDenominator
    return ok(value, "—", "R = 1 limit of equation 12.8", [
      "R is within 1e-8 of 1, so the 0/0 form is replaced by its limit.",
      `Ft = ${sig(value)}`,
    ])
  }
  const numerator = root * Math.log(firstNumerator / firstDenominator)
  const denominator = (R - 1) * Math.log(secondNumerator / secondDenominator)
  if (denominator === 0) return blocked("The denominator of equation 12.8 is zero.")
  const value = numerator / denominator
  return ok(value, "—", `F_t = \\dfrac{\\sqrt{R^2+1}\\ln[(1-S)/(1-RS)]}{(R-1)\\ln\\left[\\dfrac{2-S(R+1-\\sqrt{R^2+1})}{2-S(R+1+\\sqrt{R^2+1})}\\right]}`, [
    `√(R²+1) = ${sig(root)}`,
    `(1-S)/(1-RS) = ${sig(firstNumerator / firstDenominator)}`,
    `ln[(1-S)/(1-RS)] = ${sig(Math.log(firstNumerator / firstDenominator))}`,
    `numerator = ${sig(numerator)}`,
    `fraction inside the second logarithm = ${sig(secondNumerator / secondDenominator)}`,
    `denominator = ${sig(denominator)}`,
    `Ft = ${sig(numerator)}/${sig(denominator)} = ${sig(value)}`,
  ])
}

export function outsideArea(tubeCount: number, outsideDiameterM: number, lengthM: number): Calc {
  const a = requirePositive("tube count", tubeCount)
  const b = requirePositive("outside diameter", outsideDiameterM)
  const c = requirePositive("tube length", lengthM)
  if (a || b || c) return blocked(a ?? b ?? c ?? "Invalid geometry.")
  const value = tubeCount * Math.PI * outsideDiameterM * lengthM
  return ok(value, "m²", `A_o = ${sig(tubeCount)} \\times \\pi \\times ${sig(outsideDiameterM)} \\times ${sig(lengthM)}`, [
    `π × ${sig(outsideDiameterM)} × ${sig(lengthM)} = ${sig(Math.PI * outsideDiameterM * lengthM)} m² per tube`,
    `${sig(tubeCount)} × ${sig(Math.PI * outsideDiameterM * lengthM)} = ${sig(value)} m²`,
  ])
}

/** Equation 12.21. */
export function crossflowArea(pitchM: number, outsideDiameterM: number, shellIdM: number, baffleSpacingM: number): Calc {
  for (const [name, value] of [
    ["tube pitch", pitchM],
    ["outside diameter", outsideDiameterM],
    ["shell inside diameter", shellIdM],
    ["baffle spacing", baffleSpacingM],
  ] as const) {
    const error = requirePositive(name, value)
    if (error) return blocked(error)
  }
  if (pitchM <= outsideDiameterM) return blocked("Tube pitch is not greater than the tube outside diameter, so the cross-flow clearance is not positive.")
  const value = ((pitchM - outsideDiameterM) * shellIdM * baffleSpacingM) / pitchM
  return ok(value, "m²", `A_s = \\dfrac{(${sig(pitchM)}-${sig(outsideDiameterM)})}{${sig(pitchM)}} \\times ${sig(shellIdM)} \\times ${sig(baffleSpacingM)}`, [
    `pt - do = ${sig(pitchM - outsideDiameterM)} m`,
    `(pt - do)/pt = ${sig((pitchM - outsideDiameterM) / pitchM)}`,
    `${sig((pitchM - outsideDiameterM) / pitchM)} × ${sig(shellIdM)} × ${sig(baffleSpacingM)} = ${sig(value)} m²`,
  ])
}

/** Equation 12.23, equilateral triangular pitch. Diameters and pitch in metres. */
export function equivalentDiameterTriangular(pitchM: number, outsideDiameterM: number): Calc {
  const a = requirePositive("tube pitch", pitchM)
  const b = requirePositive("outside diameter", outsideDiameterM)
  if (a || b) return blocked(a ?? b ?? "Invalid pitch.")
  const inside = pitchM ** 2 - 0.917 * outsideDiameterM ** 2
  if (inside <= 0) return blocked("The equivalent-diameter term (pt² - 0.917 do²) is not positive.")
  const value = (1.1 / outsideDiameterM) * inside
  return ok(value, "m", `d_e = \\dfrac{1.10}{${sig(outsideDiameterM)}}(${sig(pitchM)}^2 - 0.917\\times${sig(outsideDiameterM)}^2)`, [
    `pt² = ${sig(pitchM ** 2)}`,
    `0.917 × do² = ${sig(0.917 * outsideDiameterM ** 2)}`,
    `pt² - 0.917 do² = ${sig(inside)}`,
    `1.10/do × that term = ${sig(value)} m`,
  ])
}

/** Equation 12.22, square pitch. */
export function equivalentDiameterSquare(pitchM: number, outsideDiameterM: number): Calc {
  const a = requirePositive("tube pitch", pitchM)
  const b = requirePositive("outside diameter", outsideDiameterM)
  if (a || b) return blocked(a ?? b ?? "Invalid pitch.")
  const inside = pitchM ** 2 - 0.785 * outsideDiameterM ** 2
  if (inside <= 0) return blocked("The equivalent-diameter term (pt² - 0.785 do²) is not positive.")
  const value = (1.27 / outsideDiameterM) * inside
  return ok(value, "m", `d_e = \\dfrac{1.27}{d_o}(p_t^2 - 0.785 d_o^2)`, [
    `pt² - 0.785 do² = ${sig(inside)}`,
    `de = ${sig(value)} m`,
  ])
}

export function shellReynolds(input: {
  massFlowKgS: number
  areaM2: number
  density: number
  viscosity: number
  equivalentDiameterM: number
  cp: number
  conductivity: number
}): Calc & { Re?: number; Pr?: number; velocity?: number; massVelocity?: number } {
  for (const [name, value] of [
    ["mass flow", input.massFlowKgS],
    ["cross-flow area", input.areaM2],
    ["density", input.density],
    ["viscosity", input.viscosity],
    ["equivalent diameter", input.equivalentDiameterM],
    ["specific heat", input.cp],
    ["thermal conductivity", input.conductivity],
  ] as const) {
    const error = requirePositive(name, value)
    if (error) return blocked(error)
  }
  const Gs = input.massFlowKgS / input.areaM2
  const velocity = Gs / input.density
  const Re = (Gs * input.equivalentDiameterM) / input.viscosity
  const Pr = (input.cp * input.viscosity) / input.conductivity
  return {
    ok: true,
    value: Re,
    unit: "—",
    substitution: "G_s = W_s/A_s,\\ Re = G_s d_e/\\mu,\\ Pr = c_p\\mu/k",
    lines: [
      `Gs = ${sig(input.massFlowKgS)}/${sig(input.areaM2)} = ${sig(Gs)} kg/(s·m²)`,
      `us = ${sig(Gs)}/${sig(input.density)} = ${sig(velocity)} m/s`,
      `Re = ${sig(Gs)} × ${sig(input.equivalentDiameterM)} / ${sig(input.viscosity)} = ${sig(Re)}`,
      `Pr = ${sig(input.cp)} × ${sig(input.viscosity)} / ${sig(input.conductivity)} = ${sig(Pr)}`,
    ],
    Re,
    Pr,
    velocity,
    massVelocity: Gs,
  }
}

/** Equation 12.64. Latent heat in J/kg. */
export function zuberFlux(lambdaJ: number, surfaceTension: number, liquidDensity: number, vapourDensity: number): Calc {
  for (const [name, value] of [
    ["latent heat", lambdaJ],
    ["surface tension", surfaceTension],
    ["liquid density", liquidDensity],
    ["vapour density", vapourDensity],
  ] as const) {
    const error = requirePositive(name, value)
    if (error) return blocked(error)
  }
  if (liquidDensity <= vapourDensity) return blocked("Liquid density is not greater than vapour density.")
  const group = surfaceTension * G * (liquidDensity - vapourDensity) * vapourDensity ** 2
  const value = 0.131 * lambdaJ * group ** 0.25
  return ok(value, "W/m²", `q_c = 0.131\\lambda[\\sigma g(\\rho_L-\\rho_v)\\rho_v^2]^{1/4}`, [
    `σ g (ρL − ρv) ρv² = ${sig(group)}`,
    `[that group]^(1/4) = ${sig(group ** 0.25)}`,
    `0.131 × ${sig(lambdaJ)} × ${sig(group ** 0.25)} = ${sig(value)} W/m²`,
  ])
}

/** Equation 12.74. Kb is 0.44 for square pitch and 0.41 for triangular pitch. */
export function bundleCriticalFlux(input: {
  kb: number
  pitchM: number
  outsideDiameterM: number
  lambdaJ: number
  tubeCountForFlux: number
  surfaceTension: number
  liquidDensity: number
  vapourDensity: number
}): Calc {
  const single = zuberFlux(input.lambdaJ, input.surfaceTension, input.liquidDensity, input.vapourDensity)
  if (!single.ok) return single
  const countError = requirePositive("Nt", input.tubeCountForFlux)
  const pitchError = requirePositive("pitch", input.pitchM)
  const diameterError = requirePositive("outside diameter", input.outsideDiameterM)
  if (countError || pitchError || diameterError) return blocked(countError ?? pitchError ?? diameterError ?? "Invalid bundle data.")
  const group = input.surfaceTension * G * (input.liquidDensity - input.vapourDensity) * input.vapourDensity ** 2
  const value =
    input.kb *
    (input.pitchM / input.outsideDiameterM) *
    (input.lambdaJ / Math.sqrt(input.tubeCountForFlux)) *
    group ** 0.25
  return ok(value, "W/m²", `q_{cb} = K_b(p_t/d_o)(\\lambda/\\sqrt{N_t})[\\sigma g(\\rho_L-\\rho_v)\\rho_v^2]^{0.25}`, [
    `pt/do = ${sig(input.pitchM / input.outsideDiameterM)}`,
    `λ/√Nt = ${sig(input.lambdaJ / Math.sqrt(input.tubeCountForFlux))}`,
    `Kb × (pt/do) × (λ/√Nt) × [group]^0.25 = ${sig(value)} W/m²`,
    `0.7 × qcb = ${sig(0.7 * value)} W/m²`,
  ])
}

/** Problem 12.11 vapour-pressure equation. P in bar, T in °C. */
export function chlorineVapourPressure(temperatureC: number): Calc {
  const denominator = temperatureC + 246
  if (denominator === 0) return blocked("T + 246 is zero.")
  const lnP = 9.34 - 1978 / denominator
  const value = Math.exp(lnP)
  return ok(value, "bar", `\\ln P = 9.34 - 1978/(${sig(temperatureC)}+246)`, [
    `T + 246 = ${sig(denominator)}`,
    `1978/${sig(denominator)} = ${sig(1978 / denominator)}`,
    `ln P = 9.34 - ${sig(1978 / denominator)} = ${sig(lnP)}`,
    `P = e^{${sig(lnP)}} = ${sig(value)} bar`,
  ])
}

export function nozzleVelocity(massFlowKgS: number, density: number, diameterM: number): Calc {
  for (const [name, value] of [
    ["mass flow", massFlowKgS],
    ["density", density],
    ["nozzle diameter", diameterM],
  ] as const) {
    const error = requirePositive(name, value)
    if (error) return blocked(error)
  }
  const area = (Math.PI * diameterM ** 2) / 4
  const velocity = massFlowKgS / (density * area)
  const head = (density * velocity ** 2) / 2
  return ok(velocity, "m/s", `u = W/(\\rho A_n),\\ A_n = \\pi D^2/4`, [
    `An = π × ${sig(diameterM)}² / 4 = ${sig(area)} m²`,
    `u = ${sig(massFlowKgS)} / (${sig(density)} × ${sig(area)}) = ${sig(velocity)} m/s`,
    `one velocity head = ρu²/2 = ${sig(head)} Pa`,
  ])
}
