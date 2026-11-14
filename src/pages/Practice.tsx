import { useState } from "react"
import { questions } from "../data/questions"
import { formulas } from "../data/formulas"

function closeEnough(input: number, expected: number, rel: number, abs: number) {
  return Number.isFinite(input) && Math.abs(input - expected) <= Math.max(abs, Math.abs(expected) * rel)
}

export function Practice() {
  const [questionId, setQuestionId] = useState("12.5")
  const [mode, setMode] = useState<"guided" | "independent" | "formula" | "mistake">("guided")
  const question = questions.find((item) => item.id === questionId) ?? questions[0]
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Exam practice</h2>
      <div className="flex flex-wrap gap-2">
        <select value={questionId} onChange={(event) => setQuestionId(event.target.value)} className="rounded-md border border-line bg-surface px-2 py-1">
          {questions.map((item) => <option key={item.id} value={item.id}>{item.id} {item.title}</option>)}
        </select>
        {(["guided", "independent", "formula", "mistake"] as const).map((item) => (
          <button key={item} type="button" onClick={() => setMode(item)} className={`rounded-md px-3 py-1.5 text-sm ${mode === item ? "bg-accent text-slate-950" : "border border-line"}`}>{item}</button>
        ))}
      </div>
      <p className="text-sm text-muted">A numerical answer is accepted when it is within the larger of the absolute tolerance and the relative tolerance printed beside the box. Hints stop before the final value.</p>
      {mode === "guided" || mode === "independent" ? <NumericMode questionId={question.id} hideStatement={mode === "guided"} /> : null}
      {mode === "formula" ? <FormulaMode questionId={question.id} /> : null}
      {mode === "mistake" ? <MistakeMode questionId={question.id} /> : null}
      {question.practice.length === 0 && (mode === "guided" || mode === "independent") ? <p>This exercise has no completed numerical target in the PDF, so there is no answer to mark.</p> : null}
    </div>
  )
}

function NumericMode({ questionId, hideStatement }: { questionId: string; hideStatement: boolean }) {
  const question = questions.find((item) => item.id === questionId)!
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [hints, setHints] = useState<Record<string, number>>({})
  const [marks, setMarks] = useState<Record<string, string>>({})
  return (
    <div className="space-y-4">
      {hideStatement ? null : question.statement.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      {question.practice.map((item) => (
        <article key={item.id} className="rounded-xl border border-line bg-surface p-4">
          <p>{item.prompt}</p>
          <p className="text-xs text-muted">Tolerance: absolute {item.absTolerance} {item.unit}, or relative {(item.relTolerance * 100).toFixed(1)}%, whichever is larger.</p>
          <input className="num mt-2 rounded-md border border-line bg-bg px-2 py-1" value={answers[item.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [item.id]: event.target.value }))} />
          <button
            type="button"
            className="ml-2 rounded-md bg-accent px-3 py-1 text-sm text-slate-950"
            onClick={() => {
              const value = Number(answers[item.id])
              setMarks((current) => ({ ...current, [item.id]: closeEnough(value, item.expected, item.relTolerance, item.absTolerance) ? "Within tolerance." : "Outside tolerance. Use a hint before trying again." }))
            }}
          >
            Check
          </button>
          <button type="button" className="ml-2 text-sm text-accent" onClick={() => setHints((current) => ({ ...current, [item.id]: Math.min(3, (current[item.id] ?? 0) + 1) }))}>Hint</button>
          <p className="mt-2 text-sm">{marks[item.id]}</p>
          <ol className="mt-2 list-decimal pl-5 text-sm text-muted">
            {item.hints.slice(0, hints[item.id] ?? 0).map((hint) => <li key={hint}>{hint}</li>)}
          </ol>
        </article>
      ))}
    </div>
  )
}

function FormulaMode({ questionId }: { questionId: string }) {
  const question = questions.find((item) => item.id === questionId)!
  const correct = formulas.find((formula) => formula.id === question.formulaIds[0])
  const options = formulas.filter((formula) => formula.id === question.formulaIds[0] || formula.id === "12.1" || formula.id === "12.4" || formula.id === "12.64")
  const [choice, setChoice] = useState("")
  if (!correct) return <p>No equation is attached to this exercise yet.</p>
  return (
    <article className="rounded-xl border border-line bg-surface p-4">
      <p>Which printed equation is the first one listed for this exercise?</p>
      <div className="mt-3 space-y-2">
        {options.map((formula) => (
          <label key={formula.id} className="block text-sm">
            <input type="radio" name="formula" value={formula.id} onChange={() => setChoice(formula.id)} /> Equation {formula.number}: {formula.name}
          </label>
        ))}
      </div>
      {choice ? <p className="mt-3 text-sm">{choice === correct.id ? "That equation is on this exercise’s list." : `The first listed equation for this exercise is ${correct.number}.`}</p> : null}
    </article>
  )
}

function MistakeMode({ questionId }: { questionId: string }) {
  const question = questions.find((item) => item.id === questionId)!
  const [open, setOpen] = useState<string | null>(null)
  if (question.mistakes.length === 0) return <p>No authored mistake is stored for this exercise, because it has no completed numerical target.</p>
  return (
    <div className="space-y-3">
      {question.mistakes.map((mistake) => (
        <article key={mistake.id} className="rounded-xl border border-line bg-surface p-4">
          <p>{mistake.prompt}</p>
          <pre className="num mt-2 whitespace-pre-wrap text-sm">{mistake.wrongWorking}</pre>
          <button type="button" className="mt-2 text-sm text-accent" onClick={() => setOpen(mistake.id)}>Show the mistake</button>
          {open === mistake.id ? <p className="mt-2 text-sm">{mistake.explanation}</p> : null}
        </article>
      ))}
    </div>
  )
}
