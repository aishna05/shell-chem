export type Variable = {
  symbol: string
  meaning: string
}

export type StepStatus = "computed" | "blocked" | "chart"

export type BookFigure = {
  src: string
  caption: string
  reading: string
}

export type Step = {
  id: string
  title: string
  why: string
  formulaTex: string
  source: string
  variables: Variable[]
  substitutionTex: string
  arithmetic: string[]
  resultText: string
  value: number | null
  unit: string
  verification: string
  mistake: string
  status: StepStatus
  figures?: BookFigure[]
}

export type GivenRow = {
  quantity: string
  symbol: string
  value: string
  unit: string
}

export type PracticeItem = {
  id: string
  prompt: string
  expected: number
  unit: string
  relTolerance: number
  absTolerance: number
  hints: [string, string, string]
}

export type MistakeItem = {
  id: string
  prompt: string
  wrongWorking: string
  correctId: string
  explanation: string
}

export type CalculatorInput = {
  key: string
  label: string
  unit: string
  textbook: number
}

export type CalculatorRow = {
  label: string
  text: string
  status: StepStatus
}

export type Question = {
  id: string
  title: string
  kind: "Rating" | "Design" | "Condenser" | "Reboiler"
  bookPages: string
  pdfPages: string
  statement: string[]
  understand: {
    asking: string
    type: string
    provided: string
    calculate: string
    procedure: string
    why: string
    strategy: string[]
  }
  given: GivenRow[]
  conversions: string[]
  assumptions: string[]
  missing: string[]
  formulaIds: string[]
  steps: Step[]
  verification: "Independently calculated and checked" | "Incomplete due to missing source information" | "Requires chart or source verification" | "Completed with stated assumptions"
  verificationNote: string
  finals: { label: string; text: string }[]
  diagram:
    | "fixed-e"
    | "multipass-e"
    | "kettle"
    | "horizontal-condenser"
    | "vertical-condenser"
    | "partial-condenser"
    | "thermosyphon"
    | "immersed"
  practice: PracticeItem[]
  mistakes: MistakeItem[]
  revision: {
    objective: string
    formulas: string[]
    sequence: string[]
    intermediates: string[]
    mistakes: string[]
    finalAnswer: string
  }
  checklist: string[]
  calculator: {
    inputs: CalculatorInput[]
    run: (values: Record<string, number>) => CalculatorRow[]
  }
}

export type Formula = {
  id: string
  number: string
  name: string
  tex: string
  section: string
  page: string
  variables: { symbol: string; meaning: string; unit: string }[]
  conditions: string
  questionIds: string[]
  mistakes: string[]
}
