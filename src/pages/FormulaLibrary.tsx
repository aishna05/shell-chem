import { Link } from "react-router-dom"
import { MathText } from "../components/MathText"
import { formulas } from "../data/formulas"

export function FormulaLibrary() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Formula library</h2>
      <p className="max-w-3xl text-muted">These are the chapter equations used by the approved exercises. The notation is the book’s notation.</p>
      {formulas.map((formula) => (
        <article key={formula.id} id={formula.id} className="rounded-xl border border-line bg-surface p-4">
          <p className="text-sm text-accent">Equation {formula.number}</p>
          <h3 className="font-semibold">{formula.name}</h3>
          <MathText tex={formula.tex} display />
          <p className="text-sm text-muted">Section {formula.section}, book p. {formula.page}. {formula.conditions}</p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="text-muted"><th>Symbol</th><th>Meaning</th><th>Unit</th></tr></thead>
              <tbody>
                {formula.variables.map((variable) => (
                  <tr key={variable.symbol} className="border-t border-line">
                    <td className="py-1 pr-3"><MathText tex={variable.symbol} /></td>
                    <td className="py-1 pr-3">{variable.meaning}</td>
                    <td className="num py-1">{variable.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm"><strong>Common substitution mistakes: </strong>{formula.mistakes.join(" ")}</p>
          <p className="mt-2 text-sm">Used in {formula.questionIds.map((id) => <Link key={id} className="mr-2 text-accent" to={`/exercises/${id}`}>{id}</Link>)}</p>
        </article>
      ))}
    </div>
  )
}
