import { NavLink, Outlet } from "react-router-dom"
import { BookOpen, FlaskConical, LayoutDashboard, ListChecks, PenLine, Sigma } from "lucide-react"
import { useProgress } from "../../hooks/useProgress"

const primary = [
  { to: "/", label: "Design method", icon: Sigma },
  { to: "/exercises", label: "Solved problems", icon: BookOpen },
]

const study = [
  { to: "/dashboard", label: "Progress", icon: LayoutDashboard },
  { to: "/formulas", label: "Formula library", icon: Sigma },
  { to: "/visualizer", label: "Visualizer", icon: FlaskConical },
  { to: "/practice", label: "Exam practice", icon: PenLine },
  { to: "/revision", label: "Revision", icon: ListChecks },
]

export function AppShell() {
  const { store, toggleTheme } = useProgress()
  return (
    <div className="min-h-screen bg-bg text-ink md:grid md:grid-cols-[240px_1fr]">
      <aside className="no-print border-b border-line bg-surface md:min-h-screen md:border-r md:border-b-0">
        <div className="px-4 py-5">
          <p className="text-xs tracking-[0.16em] text-accent uppercase">Coulson & Richardson</p>
          <h1 className="mt-1 text-lg font-semibold">Shell-and-tube design</h1>
          <p className="mt-1 text-sm text-muted">Chapter 12, equations and charts from the book</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:block md:px-3">
          {primary.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${isActive ? "bg-surface-2 text-accent" : "text-ink hover:bg-surface-2"}`
              }
            >
              <link.icon size={16} />
              {link.label}
            </NavLink>
          ))}
          <p className="mt-4 mb-1 hidden px-3 text-xs tracking-wide text-muted uppercase md:block">Study tools</p>
          {study.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap ${isActive ? "bg-surface-2 text-accent" : "text-muted hover:bg-surface-2"}`
              }
            >
              <link.icon size={16} />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div>
        <header className="no-print flex items-center justify-between border-b border-line px-4 py-3 md:px-8">
          <p className="text-sm text-muted">Volume 6, 4th edition. Missing properties are labeled assumptions and the solutions are closed with them.</p>
          <button type="button" onClick={toggleTheme} className="rounded-md border border-line px-3 py-1.5 text-sm">
            {store.theme === "dark" ? "Light theme" : "Dark theme"}
          </button>
        </header>
        <main className="px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
