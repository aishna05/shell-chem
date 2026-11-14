import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AppShell } from "./components/layout/AppShell"
import { Dashboard } from "./pages/Dashboard"
import { ExerciseList } from "./pages/ExerciseList"
import { FormulaLibrary } from "./pages/FormulaLibrary"
import { Practice } from "./pages/Practice"
import { QuestionPage } from "./pages/QuestionPage"
import { Revision } from "./pages/Revision"
import { Visualizer } from "./pages/Visualizer"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="exercises" element={<ExerciseList />} />
          <Route path="exercises/:id" element={<QuestionPage />} />
          <Route path="formulas" element={<FormulaLibrary />} />
          <Route path="visualizer" element={<Visualizer />} />
          <Route path="practice" element={<Practice />} />
          <Route path="revision" element={<Revision />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
