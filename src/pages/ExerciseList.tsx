import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { questions } from "../data/questions"
import { masteryLabel, useProgress } from "../hooks/useProgress"

export function ExerciseList() {
  const [query, setQuery] = useState("")
  const [kind, setKind] = useState("All")
  const { store } = useProgress()
  const kinds = ["All", "Rating", "Design", "Condenser", "Reboiler"]
  const visible = useMemo(
    () =>
      questions.filter((question) => {
        const matchesKind = kind === "All" || question.kind === kind
        const matchesQuery = `${question.id} ${question.title} ${question.statement.join(" ")}`.toLowerCase().includes(query.toLowerCase())
        return matchesKind && matchesQuery
      }),
    [kind, query],
  )
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exercises" className="rounded-md border border-line bg-surface px-3 py-2" />
        {kinds.map((item) => (
          <button key={item} type="button" onClick={() => setKind(item)} className={`rounded-md px-3 py-2 text-sm ${kind === item ? "bg-accent text-slate-950" : "border border-line"}`}>
            {item}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface-2 text-muted">
            <tr>
              <th className="px-3 py-2">Exercise</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Book page</th>
              <th className="px-3 py-2">Verification</th>
              <th className="px-3 py-2">Mastery</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((question) => (
              <tr key={question.id} className="border-t border-line bg-surface">
                <td className="px-3 py-3">
                  <Link to={`/exercises/${question.id}`} className="font-medium text-accent">
                    {question.id}
                  </Link>
                  <p>{question.title}</p>
                </td>
                <td className="px-3 py-3">{question.kind}</td>
                <td className="num px-3 py-3">{question.bookPages}</td>
                <td className="px-3 py-3">{question.verification}</td>
                <td className="px-3 py-3">{masteryLabel(store.mastery[question.id])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
