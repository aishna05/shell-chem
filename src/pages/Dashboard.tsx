import { Link } from "react-router-dom"
import { questions } from "../data/questions"
import { masteryLabel, useProgress } from "../hooks/useProgress"

const order = ["12.5", "12.3", "12.6", "12.11", "12.10", "12.4", "12.7", "12.8", "12.9"]

export function Dashboard() {
  const { store } = useProgress()
  const computed = questions.filter((question) => question.steps.some((step) => step.status === "computed")).length
  const incomplete = questions.filter((question) => question.finals.some((item) => item.text.toLowerCase().includes("not") || item.text.toLowerCase().includes("incomplete"))).length
  const chart = questions.filter((question) => question.steps.some((step) => step.status === "chart")).length
  const practiced = Object.values(store.mastery).filter((value) => value === "solved-independently").length
  const notStarted = questions.filter((question) => !store.mastery[question.id] || store.mastery[question.id] === "not-started").length
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-surface p-6 shadow-[var(--shadow)]">
        <p className="text-sm text-accent">Chapter 12, Heat-transfer Equipment</p>
        <h2 className="mt-1 text-2xl font-semibold">Shell-and-tube examination workspace</h2>
        <p className="mt-3 max-w-3xl text-muted">
          Nine approved exercises are loaded from the uploaded chapter. Every number on a solution page is either calculated from a printed equation or stopped where the PDF does not contain the next value. Nothing has been checked against a textbook answer key, because this chapter does not contain one.
        </p>
        <Link to={`/exercises/${store.lastQuestionId}`} className="mt-5 inline-block rounded-md bg-accent px-4 py-2 font-medium text-slate-950">
          Continue studying
        </Link>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Selected exercises" value="9" />
        <Stat label="Questions with recalculated steps" value={String(computed)} />
        <Stat label="Questions still missing a final result" value={String(incomplete)} />
        <Stat label="Verified against an answer key" value="0" />
        <Stat label="Questions that still need a chart reading" value={String(chart)} />
        <Stat label="Marked solved independently" value={String(practiced)} />
        <Stat label="Not yet practiced" value={String(notStarted)} />
        <Stat label="Excluded exercises" value="3" />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-5">
          <h3 className="font-semibold">Recommended order</h3>
          <p className="mt-1 text-sm text-muted">Start where the PDF itself contains the properties. The later exercises teach the method and show exactly which number is missing.</p>
          <ol className="mt-3 space-y-2">
            {order.map((id, index) => {
              const question = questions.find((item) => item.id === id)
              return (
                <li key={id}>
                  <Link to={`/exercises/${id}`} className="flex items-baseline justify-between gap-3 rounded-md px-2 py-1 hover:bg-surface-2">
                    <span>{index + 1}. {id} {question?.title}</span>
                    <span className="text-xs text-muted">{masteryLabel(store.mastery[id])}</span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <h3 className="font-semibold">Syllabus filter</h3>
          <p className="mt-2 text-sm">Included: 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10, 12.11.</p>
          <p className="mt-2 text-sm">Excluded: 12.1 and 12.2 are double-pipe exchangers. 12.12 is a gasketed-plate exchanger.</p>
          <p className="mt-2 text-sm text-muted">Worked Examples 12.1 to 12.15 stay as method references. They are not extra exercises.</p>
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="num mt-1 text-3xl text-accent">{value}</p>
    </div>
  )
}
