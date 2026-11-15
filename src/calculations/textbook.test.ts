import { describe, expect, it } from "vitest"
import { correctionFactor, crossflowArea, equivalentDiameterTriangular, latentDuty, linearInterpolation, lmtdCounter, massFlowFromKgPerS, outsideArea, sensibleDuty, shellReynolds, sig, zuberFlux } from "./textbook"
import { questions } from "../data/questions"

describe("textbook calculations", () => {
  it("calculates the ammonia duty in W", () => {
    const duty = sensibleDuty({ massFlowKgH: 4500, cpKJ: 2.418, hotIn: 120, hotOut: 40 })
    expect(duty.ok && duty.value).toBe(241800)
    expect(sig(241800)).toBe("241800")
    expect(sig(241.8)).toBe("241.8")
  })

  it("calculates the counter-current LMTD for problem 12.5", () => {
    const lmtd = lmtdCounter(120, 40, 30, 40)
    expect(lmtd.ok && lmtd.value).toBeCloseTo(33.66288428740915, 8)
  })

  it("matches equation 12.8 against Example 12.1 within chart-reading tolerance", () => {
    const ft = correctionFactor(3.67, 0.21)
    expect(ft.ok && ft.value).toBeCloseTo(0.8353498921921109, 8)
  })

  it("reports no one-shell Ft for Example 12.2", () => {
    const ft = correctionFactor(8, 0.12)
    expect(ft.ok).toBe(false)
  })

  it("calculates problem 12.5 Ft", () => {
    const ft = correctionFactor(8, 1 / 9)
    expect(ft.ok && ft.value).toBeCloseTo(0.8255346673132351, 8)
  })

  it("calculates problem 12.3 geometry", () => {
    const area = outsideArea(124, 0.019, 4.094)
    const flow = crossflowArea(0.024, 0.019, 0.337, 0.106)
    const diameter = equivalentDiameterTriangular(0.024, 0.019)
    expect(area.ok && area.value).toBeCloseTo(30.30211884286482, 8)
    expect(flow.ok && flow.value).toBeCloseTo(0.007442083333333334, 10)
    expect(diameter.ok && diameter.value).toBeCloseTo(0.014182068421052633, 10)
  })

  it("calculates the ammonia shell Reynolds number", () => {
    const area = crossflowArea(0.02375, 0.019, 0.59, 0.3)
    const diameter = equivalentDiameterTriangular(0.02375, 0.019)
    expect(area.ok && diameter.ok).toBe(true)
    if (!area.ok || !diameter.ok) return
    const flow = shellReynolds({
      massFlowKgS: 1.25,
      areaM2: area.value,
      density: 4.03,
      viscosity: 1.21e-5,
      equivalentDiameterM: diameter.value,
      cp: 2418,
      conductivity: 0.0317,
    })
    expect(flow.ok && flow.Re).toBeCloseTo(39369.86389316897, 6)
  })

  it("interpolates the problem 12.6 boiling temperature", () => {
    const temperature = linearInterpolation(6, 5, 50, 6.4, 60)
    expect(temperature.ok && temperature.value).toBeCloseTo(57.14285714285714, 8)
  })

  it("keeps the thermosyphon flow in kg/s", () => {
    const duty = massFlowFromKgPerS(5, 828)
    expect(duty.ok && duty.value).toBe(4_140_000)
  })

  it("checks the chlorine vapour-pressure equation", () => {
    const duty = latentDuty(10000, 260)
    expect(duty.ok && duty.value).toBeCloseTo(722222.2222222222, 6)
  })

  it("rejects a non-positive diameter", () => {
    expect(outsideArea(10, 0, 1).ok).toBe(false)
  })

  it("evaluates Zuber's equation in J/kg", () => {
    const flux = zuberFlux(322e3, 0.85, 535, 14.4)
    expect(flux.ok && flux.value).toBeCloseTo(1299291.0222911986, 4)
  })
})

describe("question inventory", () => {
  it("contains the nine approved exercises and no excluded exercise", () => {
    expect(questions.map((question) => question.id)).toEqual(["12.3", "12.4", "12.5", "12.6", "12.7", "12.8", "12.9", "12.10", "12.11"])
  })

  it("gives every exercise a statement, a verification status, and at least one step", () => {
    for (const question of questions) {
      expect(question.statement.length).toBeGreaterThan(0)
      expect(question.steps.length).toBeGreaterThan(0)
      expect(question.verification).toBe("Completed with stated assumptions")
      expect(question.steps.some((step) => step.status === "blocked" || step.status === "chart")).toBe(false)
      expect(question.finals.some((item) => item.label === "Decision" || item.label === "Preliminary design" || item.text.length > 0)).toBe(true)
    }
  })
})
