import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Link, useParams } from "react-router-dom"
import { ExchangerDiagram } from "../components/Diagrams"
import { MathText } from "../components/MathText"
import { SolutionFlow } from "../components/SolutionFlow"
import { questions } from "../data/questions"
import type { Question } from "../data/types"
import { masteryLabel, useProgress, type Mastery } from "../hooks/useProgress"

const sections = ["Statement", "Understand", "Given data", "Flowchart", "Solution", "Specification", "Calculator", "Exam sheet"]

export function QuestionPage() {
  const { id = "12.5" } = useParams()
  const question = questions.find((item) => item.id === id)
  const { store, setMastery, visit } = useProgress()
  const [section, setSection] = useState("Solution")
  const [stepId, setStepId] = useState(question?.steps[0]?.id ?? "")
  const [exam, setExam] = useState(false)
  const [showWhy, setShowWhy] = useState(true)
  const [inputs, setInputs] = useState<Record<string, number>>({})

  useEffect(() => {
    if (question) {
      visit(question.id)
      setStepId(question.steps[0]?.id ?? "")
      setInputs(Object.fromEntries(question.calculator.inputs.map((input) => [input.key, input.textbook])))
    }
  }, [question, visit])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!question) return
      const index = question.steps.findIndex((step) => step.id === stepId)
      if (event.key === "ArrowDown" || event.key === "j") setStepId(question.steps[Math.min(question.steps.length - 1, index + 1)]?.id ?? stepId)
      if (event.key === "ArrowUp" || event.key === "k") setStepId(question.steps[Math.max(0, index - 1)]?.id ?? stepId)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [question, stepId])

  const results = useMemo(() => (question ? question.calculator.run(inputs) : []), [inputs, question])
  if (!question) return <p>That exercise is not in the approved set.</p>
  const step = question.steps.find((item) => item.id === stepId) ?? question.steps[0]
  const index = questions.findIndex((item) => item.id === question.id)

  async function copy(text: string) {
    await navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-accent">Exercise {question.id}</p>
          <h2 className="text-2xl font-semibold">{question.title}</h2>
          <p className="text-sm text-muted">Book pp. {question.bookPages}. PDF pp. {question.pdfPages}. {question.verification}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-md bg-accent px-3 py-2 text-sm text-slate-950" onClick={() => setExam(true)}>
            Show exam-ready solution
          </button>
          <Link className="rounded-md border border-line px-3 py-2 text-sm" to={`/exercises/${questions[Math.max(0, index - 1)].id}`}>Previous</Link>
          <Link className="rounded-md border border-line px-3 py-2 text-sm" to={`/exercises/${questions[Math.min(questions.length - 1, index + 1)].id}`}>Next</Link>
        </div>
      </div>
      <div className="no-print flex gap-2 overflow-x-auto">
        {sections.map((item) => (
          <button key={item} type="button" onClick={() => { setSection(item); setExam(false) }} className={`rounded-md px-3 py-1.5 text-sm ${section === item && !exam ? "bg-surface-2 text-accent" : "border border-line"}`}>
            {item}
          </button>
        ))}
      </div>
      {exam ? <ExamSheet questionId={question.id} /> : null}
      {!exam && section === "Statement" ? (
        <article className="space-y-3 rounded-xl border border-line bg-surface p-5">
          {question.statement.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <ExchangerDiagram kind={question.diagram} />
        </article>
      ) : null}
      {!exam && section === "Understand" ? (
        <article className="space-y-3 rounded-xl border border-line bg-surface p-5">
          <Field label="What is the question asking?" text={question.understand.asking} />
          <Field label="What type of problem is this?" text={question.understand.type} />
          <Field label="What information has been provided?" text={question.understand.provided} />
          <Field label="What needs to be calculated?" text={question.understand.calculate} />
          <Field label="Which textbook procedure applies?" text={question.understand.procedure} />
          <Field label="Why is that procedure applicable?" text={question.understand.why} />
          <div>
            <h3 className="font-medium">Overall strategy</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5">{question.understand.strategy.map((item) => <li key={item}>{item}</li>)}</ol>
          </div>
        </article>
      ) : null}
      {!exam && section === "Given data" ? (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-surface-2"><tr><th className="px-3 py-2">Quantity</th><th className="px-3 py-2">Symbol</th><th className="px-3 py-2">Given value</th><th className="px-3 py-2">Unit</th></tr></thead>
              <tbody>
                {question.given.map((row) => (
                  <tr key={`${row.quantity}-${row.symbol}`} className="border-t border-line bg-surface">
                    <td className="px-3 py-2">{row.quantity}</td>
                    <td className="px-3 py-2"><MathText tex={row.symbol} /></td>
                    <td className="num px-3 py-2">{row.value}</td>
                    <td className="px-3 py-2">{row.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Panel title="Unit conversions">{question.conversions.map((item) => <p key={item} className="num">{item}</p>)}</Panel>
          <Panel title="Assumptions stated for the working">{question.assumptions.map((item) => <p key={item}>{item}</p>)}</Panel>
          <Panel title="Missing from this PDF">{question.missing.map((item) => <p key={item}>{item}</p>)}</Panel>
        </div>
      ) : null}
      {!exam && section === "Specification" ? <Specification question={question} /> : null}
      {!exam && section === "Flowchart" ? (
        <div className="space-y-3">
          <SolutionFlow steps={question.steps} activeId={step.id} onSelect={setStepId} />
          <StepCard step={step} showWhy={showWhy} />
        </div>
      ) : null}
      {!exam && section === "Solution" ? (
        <div className="grid gap-4 xl:grid-cols-[220px_1fr]">
          <aside className="no-print space-y-1">
            {question.steps.map((item, stepIndex) => (
              <button key={item.id} type="button" onClick={() => setStepId(item.id)} className={`block w-full rounded-md px-2 py-1.5 text-left text-sm ${item.id === step.id ? "bg-accent text-slate-950" : "bg-surface"}`}>
                {stepIndex + 1}. {item.title}
              </button>
            ))}
            <button type="button" className="mt-3 text-sm text-accent" onClick={() => setShowWhy((value) => !value)}>{showWhy ? "Hide explanations" : "Show explanations"}</button>
          </aside>
          <div className="space-y-3">
            <div className="no-print flex gap-2">
              <button type="button" onClick={() => setStepId(question.steps[Math.max(0, question.steps.findIndex((item) => item.id === step.id) - 1)].id)}>Previous step</button>
              <button type="button" onClick={() => setStepId(question.steps[Math.min(question.steps.length - 1, question.steps.findIndex((item) => item.id === step.id) + 1)].id)}>Next step</button>
            </div>
            {question.steps.map((item) => (
              <div key={item.id} className={item.id === step.id ? "" : "opacity-70"}>
                <StepCard step={item} showWhy={showWhy} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {!exam && section === "Calculator" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <form className="space-y-3 rounded-xl border border-line bg-surface p-4" onSubmit={(event) => event.preventDefault()}>
            <p className="text-sm text-muted">Experimental inputs do not replace the textbook solution above. Restore returns the printed values.</p>
            {question.calculator.inputs.length === 0 ? <p>This exercise has no numerical input that the PDF can support.</p> : null}
            {question.calculator.inputs.map((input) => (
              <label key={input.key} className="block text-sm">
                {input.label} ({input.unit})
                <input
                  className="num mt-1 w-full rounded-md border border-line bg-bg px-2 py-1"
                  value={inputs[input.key] ?? ""}
                  onChange={(event) => setInputs((current) => ({ ...current, [input.key]: Number(event.target.value) }))}
                />
              </label>
            ))}
            <button type="button" className="rounded-md border border-line px-3 py-1.5 text-sm" onClick={() => setInputs(Object.fromEntries(question.calculator.inputs.map((input) => [input.key, input.textbook])))}>
              Restore textbook data
            </button>
          </form>
          <div className="space-y-2 rounded-xl border border-line bg-surface p-4">
            {results.map((row) => (
              <p key={row.label}><span className="text-muted">{row.label}: </span><span className="num">{row.text}</span></p>
            ))}
          </div>
        </div>
      ) : null}
      {!exam && section === "Exam sheet" ? <ExamSheet questionId={question.id} /> : null}
      <div className="no-print rounded-xl border border-line bg-surface p-4">
        <p className="text-sm text-muted">Mastery is set only when you choose it. Opening this page does not count as solving the exercise. Current mark: {masteryLabel(store.mastery[question.id])}.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["learning", "practiced", "solved-independently", "needs-revision"] as Mastery[]).map((value) => (
            <button key={value} type="button" className="rounded-md border border-line px-2 py-1 text-sm" onClick={() => setMastery(question.id, value)}>
              {masteryLabel(value)}
            </button>
          ))}
        </div>
        <button type="button" className="mt-3 text-sm text-accent" onClick={() => copy(question.steps.map((item) => item.formulaTex).join("\n"))}>Copy formulas</button>
      </div>
    </div>
  )
}

function Field({ label, text }: { label: string; text: string }) {
  return <div><h3 className="font-medium">{label}</h3><p className="mt-1 text-muted">{text}</p></div>
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-xl border border-line bg-surface p-4"><h3 className="font-medium">{title}</h3><div className="mt-2 space-y-1 text-sm">{children}</div></section>
}

function StepCard({ step, showWhy }: { step: { id: string; title: string; why: string; formulaTex: string; source: string; variables: { symbol: string; meaning: string }[]; substitutionTex: string; arithmetic: string[]; resultText: string; verification: string; mistake: string; status: string; figures?: { src: string; caption: string; reading: string }[] }; showWhy: boolean }) {
  return (
    <article id={step.id} className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{step.title}</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs ${step.status === "computed" ? "bg-emerald-500/15 text-ok" : "bg-amber-500/15 text-warn"}`}>{step.status}</span>
      </div>
      {showWhy ? <p className="mt-2"><strong>Why: </strong>{step.why}</p> : null}
      <div className="mt-3"><MathText tex={step.formulaTex} display /></div>
      <p className="text-sm text-muted"><strong>Source: </strong>{step.source}</p>
      <ul className="mt-2 text-sm">{step.variables.map((variable) => <li key={variable.symbol}><MathText tex={variable.symbol} /> — {variable.meaning}</li>)}</ul>
      <div className="mt-2"><MathText tex={step.substitutionTex} display /></div>
      <ol className="num mt-2 list-decimal space-y-1 pl-5 text-sm">{step.arithmetic.map((line) => <li key={line}>{line}</li>)}</ol>
      <p className="mt-3 font-medium">Result: <span className="num">{step.resultText}</span></p>
      {step.figures?.map((figure) => (
        <figure key={figure.src} className="mt-4 overflow-hidden rounded-lg border border-line bg-white text-slate-900">
          <img src={figure.src} alt={figure.caption} className="max-h-[34rem] w-full object-contain" />
          <figcaption className="space-y-1 border-t border-slate-200 px-3 py-2 text-sm">
            <p className="font-medium">{figure.caption}</p>
            <p>{figure.reading}</p>
          </figcaption>
        </figure>
      ))}
      <p className="mt-1 text-sm"><strong>Verification: </strong>{step.verification}</p>
      <p className="mt-1 text-sm"><strong>Common mistake: </strong>{step.mistake}</p>
    </article>
  )
}

const specRows = [
  ["Shell ID", "Ds"],
  ["Baffle spacing", "lB"],
  ["Baffle cut", "Bc"],
  ["Tube OD", "do"],
  ["Tube ID", "di"],
  ["Tube length", "L"],
  ["Number of tubes", "Nt"],
  ["Pitch", "pt"],
  ["Passes", "Np"],
] as const

function givenValue(question: Question, symbol: string) {
  const row = question.given.find((item) => item.symbol === symbol)
  return row ? `${row.value} ${row.unit}` : "Chosen in the design. See the results below."
}

function Specification({ question }: { question: Question }) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-3">
        <h3 className="font-semibold">Specification summary</h3>
        <p className="text-sm text-muted">Printed geometry is copied from the problem. A blank dimension was chosen in the design and is listed in the results. Assumed properties are marked in the solution.</p>
      </div>
      <table className="w-full text-left text-sm">
        <tbody>
          {specRows.map(([label, symbol]) => (
            <tr key={symbol} className="border-t border-line">
              <th className="px-4 py-2 font-medium">{label}</th>
              <td className="num px-4 py-2">{givenValue(question, symbol)}</td>
            </tr>
          ))}
          {question.finals.map((item) => (
            <tr key={item.label} className="border-t border-line">
              <th className="px-4 py-2 font-medium">{item.label}</th>
              <td className="num px-4 py-2">{item.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export function ExamSheet({ questionId }: { questionId: string }) {
  const question = questions.find((item) => item.id === questionId)
  if (!question) return null
  const text = question.steps.map((step, index) => `${index + 1}. ${step.title}\n${step.arithmetic.join("\n")}\n${step.resultText}`).join("\n\n")
  return (
    <article className="print-sheet space-y-3 rounded-xl border border-line p-6">
      <h2 className="text-xl font-semibold">Exercise {question.id}</h2>
      <p><strong>Given: </strong>{question.given.map((row) => `${row.quantity} = ${row.value} ${row.unit}`).join("; ")}</p>
      <p><strong>To find: </strong>{question.finals.map((item) => item.label).join(", ")}</p>
      {question.steps.map((step, index) => (
        <section key={step.id}>
          <h3 className="font-medium">{index + 1}. {step.title}</h3>
          <MathText tex={step.formulaTex} display />
          <p className="num text-sm">{step.arithmetic.join(" · ")}</p>
          <p><strong>Result: </strong><span className="num">{step.resultText}</span></p>
          {step.figures?.map((figure) => (
            <figure key={figure.src} className="mt-2 bg-white text-slate-900">
              <img src={figure.src} alt={figure.caption} className="max-h-80 w-full object-contain" />
              <figcaption className="px-2 py-1 text-sm">{figure.caption} {figure.reading}</figcaption>
            </figure>
          ))}
        </section>
      ))}
      <Specification question={question} />
      <div>
        <h3 className="font-medium">Final answer</h3>
        {question.finals.map((item) => <p key={item.label}><strong>{item.label}: </strong><span className="num">{item.text}</span></p>)}
      </div>
      <p className="text-sm">{question.verification}. {question.verificationNote}</p>
      <div className="no-print flex gap-2">
        <button type="button" onClick={() => window.print()} className="rounded-md bg-accent px-3 py-1.5 text-sm text-slate-950">Print / save as PDF</button>
        <button type="button" className="rounded-md border border-line px-3 py-1.5 text-sm" onClick={() => navigator.clipboard.writeText(text)}>Copy numerical steps</button>
      </div>
    </article>
  )
}
