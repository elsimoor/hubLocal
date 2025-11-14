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
  const mutableConfig: any = config
  const pageFont = typeof data?.root?.props?.pageFont === 'string' ? data.root.props.pageFont : undefined
  return (
    <ActionStateProvider allowCustomJS={false}>
      <div style={{ fontFamily: pageFont }}>
        <Render config={mutableConfig} data={data} />
      </div>
    </ActionStateProvider>
  )
}
