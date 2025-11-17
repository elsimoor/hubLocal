"use client"
import React, { useEffect, useMemo, useState } from "react"
import { Render } from "@measured/puck"
import { config } from "@/lib/puck/config"
import { ActionStateProvider } from "@/lib/puck/actions"
import { hydrateGroupProps, summarizeGroupTree } from "@/lib/puck/group-helpers"

/**
 * Wrapper around Puck's <Render /> so server pages can delegate
 * published rendering to the canonical component definitions.
 * Assumes data shape: { root: {...}, ... } as saved by editor.
 */
export default function PuckRenderWrapper({ data }: { data: any }) {
  const [groups, setGroups] = useState<any[]>([])
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const load = async () => {
      try {
        const res = await fetch("/api/groups", { cache: "no-store", signal: controller.signal })
        if (!res.ok) throw new Error("Failed to load groups")
        const json = await res.json()
        if (!active) return
        const list = Array.isArray(json?.groups) ? json.groups : []
        setGroups(list)
        try {
          const summaries = list.map((g: any) => {
            const { contentCount, childTypes } = summarizeGroupTree(g?.tree)
            return { id: g?._id, name: g?.name, contentCount, childTypes }
          })
          console.log('[GroupDebug] (Published) Loaded groups summary:', summaries)
        } catch {}
      } catch (err) {
        if (!active) return
        console.error('[GroupDebug] Failed to load groups for published render', err)
        setGroups([])
      }
    }
    load()
    return () => {
      active = false
      controller.abort()
    }
  }, [])

  if (!data) return null
  const mergedConfig = useMemo(() => {
    const nextConfig: any = {
      ...config,
      categories: { ...(config as any).categories },
      components: { ...(config as any).components },
    }
    if (!nextConfig.categories.groups) {
      nextConfig.categories.groups = { title: "Saved Groups", components: [], defaultExpanded: true }
    }
    if (Array.isArray(groups)) {
      groups.forEach((g: any) => {
        const key = `Group_${String(g?._id)}`
        if (!nextConfig.categories.groups.components.includes(key)) {
          nextConfig.categories.groups.components.push(key)
        }
        if (!nextConfig.components[key]) {
          const hydrateProps = (props: any = {}) =>
            hydrateGroupProps(g?.tree, props, { title: g?.name, groupId: String(g?._id || "") })
          nextConfig.components[key] = {
            label: String(g?.name || "Group"),
            inline: true,
            fields: {
              title: { type: "text", label: "Title", defaultValue: g?.name || "Group" },
              background: { type: "text", label: "Background", defaultValue: "" },
              padding: { type: "number", label: "Padding (px)", defaultValue: 16 },
              borderRadius: { type: "number", label: "Radius (px)", defaultValue: 12 },
              content: { type: "slot", label: "Content" },
            },
            defaultProps: {
              title: g?.name || "Group",
              background: "",
              padding: 16,
              borderRadius: 12,
              content: [],
            },
            resolveData: async ({ props }: { props: any }) => {
              const nextProps = hydrateProps(props)
              return { props: nextProps }
            },
            render: ({ title, background, padding, borderRadius, content: ContentSlot }: any) => {
              const { contentCount, childTypes } = summarizeGroupTree(g?.tree)
              const style: React.CSSProperties = {
                width: "100%",
                background: background || undefined,
                padding: typeof padding === "number" ? `${padding}px` : undefined,
                borderRadius: typeof borderRadius === "number" ? `${borderRadius}px` : undefined,
                border: "1px solid #e5e7eb",
              }
              try {
                console.log('[GroupDebug] (Published) Rendering group slot', String(g?._id || ''), {
                  name: g?.name,
                  version: g?.version,
                  contentCount,
                  childTypes,
                })
              } catch {}
              const contentNode = typeof ContentSlot === 'function' ? <ContentSlot /> : null
              return (
                <div style={style} data-group-id={g?._id ? String(g._id) : undefined}>
                  <div style={{ paddingBottom: 8, fontWeight: 700 }}>{title || g?.name || "Group"}</div>
                  {contentNode || (
                    <div
                      style={{
                        padding: '12px',
                        border: '1px dashed #cbd5f5',
                        borderRadius: 8,
                        color: '#6b7280',
                        fontSize: 12,
                        background: '#f8fafc',
                      }}
                    >
                      Saved group <strong>{g?.name || 'Untitled'}</strong> currently has no blocks.
                    </div>
                  )}
                </div>
              )
            },
          }
        }
      })
    }
    return nextConfig
  }, [groups])

  const pageFont = typeof data?.root?.props?.pageFont === 'string' ? data.root.props.pageFont : undefined
  return (
    <ActionStateProvider allowCustomJS={String(data?.root?.props?.allowCustomJS) === 'true'}>
      <div style={{ fontFamily: pageFont }}>
        <Render config={mergedConfig as any} data={data} />
      </div>
    </ActionStateProvider>
  )
}
