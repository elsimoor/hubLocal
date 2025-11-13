# Additional Components Checklist

This checklist tracks new components and tasks identified from further research into Puck’s ecosystem, including community plugins and related editor libraries. It is separate from the original `FEATURES_CHECKLIST.md`, which contains the core features delivered from the initial quote. Each task is given an identifier (TASK‑###) and marked as pending, in progress or done.

Legend: [ ] Pending · [~] In Progress · [x] Done

## Summary (manual)

The deep‑dive research uncovered several advanced patterns, plugins and APIs in the Puck ecosystem.  In total **16** tasks have been identified.  Three tasks are already complete (Accordion, Switch and Slider).  The remaining **13** tasks are pending implementation and will enrich your editor with dynamic fields, external data sources, tabs, custom fields, internal APIs, plugins, UI overrides, composition patterns, field transforms, advanced grid/flex layouts and state management.

- Total tasks: 16
- Pending: 13
- In Progress: 0
- Done: 3

## New Components and Tasks

| ID | Task | Status | Notes |
|----|------|--------|-------|
| TASK‑001 | Implement **Accordion** component | [x] | Inspired by design systems that use accordions to toggle the visibility of sections and reduce clutter【243256177162445†L136-L142】. Added `Accordion` component with `allowMultiple` option and array of items each containing a title and slot content. When editing, all panels remain open for ease of editing. |
| TASK‑002 | Implement **Switch** component | [x] | Based on UX guidelines where switches toggle the state of a single setting【720273760266879†L37-L42】. Added `Switch` component that toggles a specified ActionState flag and syncs with existing flag values. Editors can set the default state and label. |
| TASK‑003 | Implement **Slider** component | [x] | Inspired by slider components which allow selection of a value from a range【263366092288640†L169-L176】. Added `Slider` component with configurable min, max, step and default value. Displays the current value beside the range input. |

| TASK‑004 | Implement **BeverageSelector** component with dynamic fields | [ ] | Use `resolveFields` to conditionally add fields based on another field’s value.  For example, if the selected drink is “water”, display a `waterType` field; otherwise show nothing【864712094827224†L160-L193】.  This will demonstrate how dynamic field definitions can adapt to user choices. |
| TASK‑005 | Implement **DataSelector** component using external data source | [ ] | Leverage the `external` field type to fetch a list of items from an API.  Use `fetchList` and `filterFields` to let editors search and select entries; integrate the selected data into the render【842255565044950†L165-L205】. |
| TASK‑006 | Implement **Tabs** component with interactive editing | [ ] | Create a `Tabs` component that renders multiple tab panels.  Use `registerOverlayPortal` to allow users to interact with tab headers inside the editor without triggering Puck’s overlay【736969420473527†L155-L177】.  Include fields for an array of tabs (title + content) and a field to control which tab is active by default. |
| TASK‑007 | Implement **ColorPickerBox** custom field | [ ] | Add a custom field type that renders an `<input type="color">` along with a `FieldLabel` to integrate with Puck’s UI【197836489341458†L153-L176】.  Use `onChange` to update the selected colour in the component props. |
| TASK‑008 | Implement **SelectedInfo** component using the internal Puck API | [ ] | Use the `usePuck` hook to access the current selection or app state inside a component and display relevant information (e.g., selected component name)【519436900760412†L153-L204】.  This will demonstrate how to read Puck’s internal state from custom components. |
| TASK‑009 | Evaluate and integrate **emotion‑cache plugin** | [ ] | Assess the `@measured/puck-plugin-emotion-cache` plugin, which injects an emotion cache into the Puck iframe【204482118556107†L2-L23】.  Configure the plugin with a custom key (e.g., for Chakra UI) and add it to the `plugins` array in your editor. |
| TASK‑010 | Evaluate and integrate **heading-analyzer plugin** | [ ] | Assess the `@measured/puck-plugin-heading-analyzer` plugin, which visualises the heading outline structure and identifies missing heading levels【34693498632025†L0-L3】.  Add the plugin to the editor to display a heading outline and verify WCAG compliance. |
| TASK‑011 | Evaluate and integrate **field‑contentful plugin** | [ ] | Investigate the `@measured/puck-field-contentful` package for selecting entries from Contentful.  Use its API to create a field that lets editors pick content from a Contentful space (requires `space` and `accessToken`)【276189018223484†L0-L31】.  Determine whether integration is feasible within your application. |
| TASK‑012 | Implement **UI overrides** for customising the editor interface | [ ] | Use the `overrides` prop to customise Puck’s UI, such as reordering drawer items, renaming categories, or changing field types【533453032365298†L165-L214】.  Create an example override that changes the default icons or hides unused categories. |
| TASK‑013 | Implement **custom editor composition** | [ ] | Compose a bespoke editor interface using Puck’s compositional components like `<Puck.Components>`, `<Puck.Fields>`, `<Puck.Outline>` and `<Puck.Preview>`【106692535116724†L158-L207】.  Build a layout with a collapsible drawer, an outline panel and a preview pane, giving content editors more flexibility. |
| TASK‑014 | Implement **field transforms** for computed props | [ ] | Use the `fieldTransforms` API to modify props before they are passed to components【784174765768891†L155-L207】.  For example, automatically convert a number input to a percentage string, or synchronise two related fields. |
| TASK‑015 | Implement **advanced grid and flex patterns** | [ ] | Extend the existing grid and flex components to include additional patterns described in the Puck blog.  Implement a **grid layout pattern** that lets editors choose from predefined layouts (e.g., two‑column vs three‑column)【994289787293651†L494-L552】.  Add a **flex item** component with fields for `flex-grow`, `flex-shrink` and `flex-basis` and restrict them to flex containers【994289787293651†L664-L765】. |
| TASK‑016 | Use React context or state library for shared state | [ ] | Since Puck is “just React,” you can use any state management library or the React Context API to share data across Puck components【461273456511398†L57-L60】.  Create an example where multiple components read and update shared state via context. |

## Notes

- These tasks were derived from reviewing additional resources recommended by the user, such as the awesome‑puck list and component libraries. The implementations use plain HTML to avoid external dependencies.