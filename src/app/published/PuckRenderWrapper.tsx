"use client"
import React from "react"
import { Render } from "@measured/puck"
import { config } from "@/lib/puck/config"
import { ActionStateProvider } from "@/lib/puck/actions"

/**
 * Wrapper around Puck's <Render /> so server pages can delegate
 * published rendering to the canonical component definitions.
 * Assumes data shape: { root: {...}, ... } as saved by editor.
 */
export default function PuckRenderWrapper({ data }: { data: any }) {
  if (!data) return null
  // Wrap in ActionStateProvider so components using useActionState won't throw.
  // We disable custom JS for published pages for safety.
  const mutableConfig: any = config // cast to satisfy Render's expected mutable arrays
  return (
    <ActionStateProvider allowCustomJS={false}>
      <Render config={mutableConfig} data={data} />
    </ActionStateProvider>
  )
}
