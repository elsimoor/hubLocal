import React from 'react';
import type { AppPuckConfig } from './config';

// Higher-order helpers for injecting dynamic grid / flex placement fields
// following patterns from the advanced layouts blog post.
// Example usage (when assembling config before export):
// const cardEnhancements = withGridPlacement('Card', config.components.Card);
// config.components = { ...config.components, ...cardEnhancements };

export function withGridPlacement<T extends Record<string, any>>(name: string, component: T) {
  const next: any = { ...component };
  const prevResolve = (component as any).resolveFields;
  next.inline = true; // treat as direct grid child
  next.resolveFields = (data: any, ctx: any) => {
    let fields = prevResolve ? prevResolve(data, ctx) : (component.fields || {});
    const parent = ctx?.parent;
    if (parent?.type === 'Grid' || parent?.type === 'ResponsiveGrid') {
      fields = {
        ...fields,
        columns: { type: 'number', label: 'Grid column span', defaultValue: 1 },
        rows: { type: 'number', label: 'Grid row span', defaultValue: 1 },
      };
    }
    return fields;
  };
  const prevRender = (component as any).render;
  next.render = (props: any) => {
    const { columns, rows, puck } = props || {};
    const parentType = puck?.parent?.type;
    const inGrid = parentType === 'Grid' || parentType === 'ResponsiveGrid';
    const style: React.CSSProperties = inGrid ? {
      gridColumn: `span ${columns || 1}`,
      gridRow: `span ${rows || 1}`,
    } : {};
    return (
      <div ref={puck?.dragRef} style={style}>
        {prevRender ? prevRender(props) : null}
      </div>
    );
  };
  return { [name]: next } as Record<string, any>;
}

export function withFlexPlacement<T extends Record<string, any>>(name: string, component: T) {
  const next: any = { ...component };
  const prevResolve = (component as any).resolveFields;
  next.inline = true;
  next.resolveFields = (data: any, ctx: any) => {
    let fields = prevResolve ? prevResolve(data, ctx) : (component.fields || {});
    const parent = ctx?.parent;
    if (parent?.type === 'FlexContainer' || parent?.type === 'ResponsiveFlex' || parent?.type === 'Stack') {
      fields = {
        ...fields,
        flexGrow: { type: 'number', label: 'Flex grow', defaultValue: 0 },
        flexShrink: { type: 'number', label: 'Flex shrink', defaultValue: 1 },
        flexBasis: { type: 'text', label: 'Flex basis', defaultValue: 'auto' },
      };
    }
    return fields;
  };
  const prevRender = (component as any).render;
  next.render = (props: any) => {
    const { flexGrow, flexShrink, flexBasis, puck } = props || {};
    const parentType = puck?.parent?.type;
    const inFlex = parentType === 'FlexContainer' || parentType === 'ResponsiveFlex' || parentType === 'Stack';
    const style: React.CSSProperties = inFlex ? {
      flexGrow: typeof flexGrow === 'number' ? flexGrow : undefined,
      flexShrink: typeof flexShrink === 'number' ? flexShrink : undefined,
      flexBasis: flexBasis || undefined,
    } : {};
    return (
      <div ref={puck?.dragRef} style={style}>
        {prevRender ? prevRender(props) : null}
      </div>
    );
  };
  return { [name]: next } as Record<string, any>;
}

export function withGridAndFlexPlacement<T extends Record<string, any>>(name: string, component: T) {
  return withFlexPlacement(name, (withGridPlacement(name, component) as any)[name])[name];
}
