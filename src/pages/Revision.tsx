import { Link } from "react-router-dom"
import { MathText } from "../components/MathText"
import { formulas } from "../data/formulas"
import { questions } from "../data/questions"
import { masteryLabel, useProgress, type Mastery } from "../hooks/useProgress"

export function Revision() {
  const { store, setMastery } = useProgress()
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Final revision</h2>
      <section className="rounded-xl border border-line bg-surface p-4">
        <h3 className="font-semibold">Master formula sheet</h3>
        <div className="mt-3 space-y-3">
          {formulas.map((formula) => (
            <p key={formula.id}><strong>{formula.number}. </strong><MathText tex={formula.tex} /> <span className="text-sm text-muted">p. {formula.page}. {formula.conditions}</span></p>
          ))}
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        {questions.map((question) => (
          <article key={question.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold">{question.id}. {question.revision.objective}</h3>
              <Link to={`/exercises/${question.id}`} className="text-sm text-accent">Open</Link>
            </div>
            <p className="mt-2 text-sm"><strong>Formulas: </strong>{question.revision.formulas.join("; ")}</p>
            <p className="mt-1 text-sm"><strong>Sequence: </strong>{question.revision.sequence.join(" → ")}</p>
            <p className="mt-1 text-sm"><strong>Intermediates: </strong>{question.revision.intermediates.join("; ")}</p>
            <p className="mt-1 text-sm"><strong>Mistakes: </strong>{question.revision.mistakes.join(" ")}</p>
            <p className="mt-1 text-sm"><strong>Final answer: </strong>{question.revision.finalAnswer}</p>
            <ul className="mt-2 list-disc pl-5 text-sm">{question.checklist.map((item) => <li key={item}>{item}</li>)}</ul>
            <label className="mt-3 block text-sm">
              Mastery
              <select className="mt-1 w-full rounded-md border border-line bg-bg px-2 py-1" value={store.mastery[question.id] ?? "not-started"} onChange={(event) => setMastery(question.id, event.target.value as Mastery)}>
                {["not-started", "learning", "practiced", "solved-independently", "needs-revision"].map((value) => (
                  <option key={value} value={value}>{masteryLabel(value as Mastery)}</option>
                ))}
              </select>
            </label>
          </article>
        ))}
      </section>
    </div>
  )
}
