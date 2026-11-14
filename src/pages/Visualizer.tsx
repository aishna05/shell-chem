import { useState } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { correctionFactor, lmtdCounter, sig } from "../calculations/textbook"
import { ExchangerDiagram } from "../components/Diagrams"
import { MathText } from "../components/MathText"

export function Visualizer() {
  const [T1, setT1] = useState(120)
  const [T2, setT2] = useState(40)
  const [t1, setTcold1] = useState(30)
  const [t2, setTcold2] = useState(40)
  const lmtd = lmtdCounter(T1, T2, t1, t2)
  const R = t2 === t1 ? null : (T1 - T2) / (t2 - t1)
  const S = T1 === t1 ? null : (t2 - t1) / (T1 - t1)
  const ft = R === null || S === null ? null : correctionFactor(R, S)
  const profile = [
    { position: "Hot inlet", hot: T1, cold: t2 },
    { position: "Hot outlet", hot: T2, cold: t1 },
  ]
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Engineering visualizer</h2>
      <p className="max-w-3xl text-muted">The diagrams use the arrangements named in the exercises and in Sections 12.5, 12.10 and 12.11. The graphs evaluate equations 12.4 and 12.8. They do not add a correlation that the chapter does not print.</p>
      <ExchangerDiagram kind="multipass-e" />
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-4">
          <h3 className="font-semibold">LMTD explorer, equation 12.4</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <NumberField label="T1 hot inlet" value={T1} setValue={setT1} />
            <NumberField label="T2 hot outlet" value={T2} setValue={setT2} />
            <NumberField label="t1 cold inlet" value={t1} setValue={setTcold1} />
            <NumberField label="t2 cold outlet" value={t2} setValue={setTcold2} />
          </div>
          <p className="num mt-3">{lmtd.ok ? `ΔTlm = ${sig(lmtd.value)} °C` : lmtd.reason}</p>
          <MathText tex="\Delta T_{lm}=\frac{(T_1-t_2)-(T_2-t_1)}{\ln[(T_1-t_2)/(T_2-t_1)]}" display />
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <h3 className="font-semibold">Correction factor, equation 12.8</h3>
          <p className="mt-2 text-sm text-muted">R uses the hot fluid as the shell fluid and the cold fluid as the tube fluid, which is the assignment in Problem 12.5.</p>
          <p className="num mt-3">{R === null || S === null ? "R or S is undefined." : `R = ${sig(R)}, S = ${sig(S)}`}</p>
          <p className="num">{ft ? (ft.ok ? `Ft = ${sig(ft.value)}. Corrected mean = ${lmtd.ok ? sig(ft.value * lmtd.value) : "—"} °C.` : ft.reason) : null}</p>
          <p className="mt-2 text-sm">The book treats Ft below about 0.75 as too low for an economic one-shell design.</p>
        </div>
      </section>
      <section className="rounded-xl border border-line bg-surface p-4">
        <h3 className="font-semibold">Terminal temperatures</h3>
        <p className="mb-3 text-sm text-muted">The two ends are the counter-current terminals used by equation 12.4. This is not a calculated internal multipass profile.</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={profile}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="position" />
              <YAxis unit="°C" />
              <Tooltip />
              <Line dataKey="hot" name="Hot fluid" stroke="#f97316" strokeWidth={2} />
              <Line dataKey="cold" name="Cold fluid" stroke="#22d3ee" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="rounded-xl border border-line bg-surface p-4">
        <h3 className="font-semibold">Resistances in equation 12.2</h3>
        <p className="mt-2 text-sm">Outside film, outside fouling, tube wall, inside fouling scaled by do/di, and inside film scaled by do/di. No numerical split is shown where a film coefficient has not been calculated.</p>
        <div className="mt-3 grid gap-2 text-sm md:grid-cols-5">
          {["1/ho", "1/hod", "do ln(do/di)/(2 kw)", "(do/di)/hid", "(do/di)/hi"].map((item) => (
            <div key={item} className="rounded-md border border-line px-2 py-3 text-center">{item}</div>
          ))}
        </div>
      </section>
    </div>
  )
}

function NumberField({ label, value, setValue }: { label: string; value: number; setValue: (value: number) => void }) {
  return (
    <label className="text-sm">
      {label}
      <input className="num mt-1 w-full rounded-md border border-line bg-bg px-2 py-1" value={value} onChange={(event) => setValue(Number(event.target.value))} />
    </label>
  )
}
