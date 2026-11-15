import { useCallback, useEffect, useState } from "react"

export type Mastery = "not-started" | "learning" | "practiced" | "solved-independently" | "needs-revision"

type Store = {
  mastery: Record<string, Mastery>
  lastQuestionId: string
  theme: "dark" | "light"
}

const KEY = "shell-tube-exam-progress-v2"

const initial: Store = {
  mastery: {},
  lastQuestionId: "12.5",
  theme: "light",
}

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initial
    return { ...initial, ...(JSON.parse(raw) as Store) }
  } catch {
    return initial
  }
}

export function useProgress() {
  const [store, setStore] = useState<Store>(read)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(store))
    document.documentElement.dataset.theme = store.theme
  }, [store])

  const setMastery = useCallback((id: string, mastery: Mastery) => {
    setStore((current) => ({
      ...current,
      lastQuestionId: id,
      mastery: { ...current.mastery, [id]: mastery },
    }))
  }, [])
  const visit = useCallback((id: string) => {
    setStore((current) => (current.lastQuestionId === id ? current : { ...current, lastQuestionId: id }))
  }, [])
  const toggleTheme = useCallback(() => {
    setStore((current) => ({ ...current, theme: current.theme === "dark" ? "light" : "dark" }))
  }, [])
  return { store, setMastery, visit, toggleTheme }
}

export function masteryLabel(value: Mastery | undefined) {
  if (value === "learning") return "Learning"
  if (value === "practiced") return "Practiced"
  if (value === "solved-independently") return "Solved independently"
  if (value === "needs-revision") return "Needs revision"
  return "Not started"
}
