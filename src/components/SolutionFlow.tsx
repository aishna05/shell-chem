import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import type { Step } from "../data/types"

export function SolutionFlow({ steps, activeId, onSelect }: { steps: Step[]; activeId: string; onSelect: (id: string) => void }) {
  const nodes: Node[] = steps.map((step, index) => ({
    id: step.id,
    position: { x: 40, y: index * 92 },
    data: { label: `${index + 1}. ${step.title}` },
    style: {
      width: 280,
      fontSize: 12,
      color: "#0f172a",
      background: step.id === activeId ? "#22d3ee" : step.status === "blocked" ? "#fde68a" : step.status === "chart" ? "#bfdbfe" : "#ffffff",
      border: "1px solid #0f172a",
    },
  }))
  const edges: Edge[] = steps.slice(0, -1).map((step, index) => ({
    id: `${step.id}-${steps[index + 1].id}`,
    source: step.id,
    target: steps[index + 1].id,
  }))
  return (
    <div className="h-[520px] rounded-lg border border-line">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        onNodeClick={(_, node) => onSelect(node.id)}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
