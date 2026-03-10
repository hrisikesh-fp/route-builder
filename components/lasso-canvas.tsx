"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

interface LassoCanvasProps {
  isActive: boolean
  onSelectionComplete: (polygon: [number, number][]) => void
  onEscapePressed: () => void
}

export function LassoCanvas({ isActive, onSelectionComplete, onEscapePressed }: LassoCanvasProps) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [points, setPoints] = useState<[number, number][]>([])
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isActive) {
        console.log("[v0] ESC pressed, exiting lasso mode")
        onEscapePressed()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isActive, onEscapePressed])

  useEffect(() => {
    console.log("[v0] LassoCanvas isActive changed:", isActive)
    if (!isActive) {
      setPoints([])
      setIsDrawing(false)
    }
  }, [isActive])

  const handleMouseDown = (e: React.MouseEvent) => {
    console.log("[v0] Lasso mousedown at:", e.clientX, e.clientY)
    setIsDrawing(true)
    setPoints([[e.clientX, e.clientY]])
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return
    console.log("[v0] Lasso mousemove at:", e.clientX, e.clientY)
    setPoints((prev) => [...prev, [e.clientX, e.clientY]])
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing) return
    console.log("[v0] Lasso mouseup, total points:", points.length)
    setIsDrawing(false)

    if (points.length > 2) {
      onSelectionComplete(points)
    }

    setPoints([])
  }

  if (!isActive) return null

  const pathData = points.length > 0 ? `M ${points.map((p) => `${p[0]} ${p[1]}`).join(" L ")} Z` : ""

  return (
    <div
      ref={overlayRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="fixed inset-0 cursor-crosshair"
      style={{
        zIndex: 999,
        pointerEvents: "auto",
        touchAction: "none",
      }}
    >
      <svg
        className="w-full h-full"
        style={{
          pointerEvents: "none",
        }}
      >
        {points.length > 0 && (
          <path
            d={pathData}
            fill="rgba(250, 100, 0, 0.05)"
            stroke="#FA6400"
            strokeWidth="2"
            strokeDasharray="6 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: "drop-shadow(0 2px 15px rgba(250, 100, 0, 0.75))",
            }}
          />
        )}
      </svg>
    </div>
  )
}
