"use client";

/*
 * This page exposes a drag‑and‑drop editor powered by @craftjs/core.  The goal
 * is to provide a self‑contained interface for composing simple layouts
 * (containers, buttons and text) without relying on external UI libraries.
 *
 * When you visit /dashboard/craft in your Next.js app, you’ll see a three
 * column layout:
 *  1. A Toolbox on the left which lists components you can drag onto
 *     the canvas.  Each item uses `connectors.create` to add a new node.
 *  2. The central Canvas where you build your layout.  It’s wrapped in an
 *     <Editor> and uses <Frame> and <Element> to define an initial page.
 *  3. A Settings panel on the right that shows configurable props for the
 *     currently selected component and allows deletion.  A top bar
 *     provides a toggle to enable/disable editing and an Export button
 *     to log the page’s serialized JSON structure.
 *
 * To make this work you must install @craftjs/core in your project:
 *   npm install @craftjs/core
 */

import React, { useState, useEffect } from "react";
import {
  Editor,
  Frame,
  Element,
  useEditor,
  useNode,
} from "@craftjs/core";

/**
 * Text component
 *
 * Displays editable text.  When selected, clicking on the text toggles
 * contentEditable mode so you can change the text inline.  The font
 * size is controlled by the `fontSize` prop.  A corresponding
 * TextSettings related component (see below) is registered on
 * Text.craft.related to expose editable props in the settings panel.
 */
// Extend each component's type with an optional `craft` static property.  Craft.js
// attaches configuration to the component via a static property, which isn't
// defined on React.FC by default.  By intersecting the component type with
// `{ craft?: any }` we tell TypeScript that this property may exist.  Without
// this extension, assigning to `Text.craft` (and similar assignments for other
// components) causes a type error during the Next.js build.
const Text: React.FC<{ text?: string; fontSize?: number }> & { craft?: any } = ({
  text,
  fontSize,
}) => {
  // Retrieve connectors and selection state from Craft.js.  The
  // collector returns whether this node is currently selected in the
  // editor.  The `drag` connector makes the element draggable and the
  // `connect` connector registers it with Craft’s internal state.
  const {
    connectors: { connect, drag },
    isActive,
    actions: { setProp },
  } = useNode((node) => ({
    isActive: node.events.selected,
  }));

  // We keep an internal state to decide when the text should be editable.
  const [editable, setEditable] = useState(false);

  // When the node is deselected, turn off editing so the user can
  // re‑enable it with another click.
  useEffect(() => {
    if (!isActive) {
      setEditable(false);
    }
  }, [isActive]);

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      // When selected, clicking once toggles editing mode.  We stop
      // propagation to prevent the editor from changing selection on
      // subsequent clicks while editing.
      onClick={(e) => {
        e.stopPropagation();
        if (isActive) {
          setEditable(true);
        }
      }}
    >
      <p
        contentEditable={editable}
        suppressContentEditableWarning={true}
        style={{ fontSize: fontSize ? `${fontSize}px` : "16px", margin: 0 }}
        onInput={(e) => {
          const value = (e.target as HTMLElement).textContent;
          setProp((props: any) => {
            props.text = value ?? "";
          });
        }}
      >
        {text || "Text"}
      </p>
    </div>
  );
};

/**
 * Settings component for the Text component.  Appears in the Settings
 * panel when a Text node is selected.  Allows updating font size and
 * text content.
 */
const TextSettings: React.FC = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({ props: node.data.props }));
  return (
    <div className="flex flex-col gap-3 text-sm">
      <label className="flex flex-col gap-1">
        <span>Text</span>
        <input
          type="text"
          value={props.text || ""}
          onChange={(e) => setProp((p: any) => (p.text = e.target.value))}
          className="border rounded p-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Font size</span>
        <input
          type="range"
          min={10}
          max={72}
          value={props.fontSize || 16}
          onChange={(e) =>
            setProp((p: any) => (p.fontSize = parseInt(e.target.value)))
          }
        />
        <span className="text-xs text-gray-600">
          {props.fontSize || 16}px
        </span>
      </label>
    </div>
  );
};

Text.craft = {
  displayName: "Text",
  props: {
    text: "Text",
    fontSize: 16,
  },
  related: {
    settings: TextSettings,
  },
};

/**
 * Button component
 *
 * Renders a simple clickable button.  When a `link` prop is provided
 * and the editor is not in edit mode, clicking the button will
 * navigate to that link in a new tab.  In edit mode it does nothing,
 * preventing accidental navigation from the editor.
 */
const Button: React.FC<{ text?: string; color?: string; link?: string }> & { craft?: any } = ({
  text,
  color,
  link,
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  // Determine whether the editor is currently in edit mode.  We use
  // useEditor inside the component so we can decide what happens on
  // click based on the editor’s state.
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  return (
    <button
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      style={{
        padding: "8px 16px",
        background: color || "#6366f1",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
      }}
      onClick={(e) => {
        // Only navigate when not editing and a link exists
        if (!enabled && link) {
          e.preventDefault();
          e.stopPropagation();
          window?.open(link, "_blank", "noopener,noreferrer");
        }
      }}
    >
      {text || "Button"}
    </button>
  );
};

/**
 * Settings component for Button.  Allows editing of the label, color
 * and link URL.  Uses basic inputs since we don’t rely on external
 * UI libraries.
 */
const ButtonSettings: React.FC = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({ props: node.data.props }));
  return (
    <div className="flex flex-col gap-3 text-sm">
      <label className="flex flex-col gap-1">
        <span>Label</span>
        <input
          type="text"
          value={props.text || ""}
          onChange={(e) => setProp((p: any) => (p.text = e.target.value))}
          className="border rounded p-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Link (URL)</span>
        <input
          type="text"
          value={props.link || ""}
          onChange={(e) => setProp((p: any) => (p.link = e.target.value))}
          className="border rounded p-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Color</span>
        <input
          type="color"
          value={props.color || "#6366f1"}
          onChange={(e) => setProp((p: any) => (p.color = e.target.value))}
          className="border rounded p-1"
        />
      </label>
    </div>
  );
};

Button.craft = {
  displayName: "Button",
  props: {
    text: "Button",
    color: "#6366f1",
    link: "",
  },
  related: {
    settings: ButtonSettings,
  },
};

/**
 * Container component
 *
 * A simple wrapper that applies a background colour and padding around
 * its children.  It is also droppable when rendered via <Element
 * canvas>.  We use `connect` and `drag` to make the outer element
 * draggable.
 */
const Container: React.FC<{ background?: string; padding?: number; children?: React.ReactNode }> & { craft?: any } = ({
  background,
  padding,
  children,
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      style={{
        background: background || "#f9fafb",
        padding: `${padding ?? 10}px`,
        margin: "0.5rem 0",
        borderRadius: "0.5rem",
      }}
    >
      {children}
    </div>
  );
};

/**
 * Settings for Container.  Users can adjust the background colour and
 * padding using native HTML inputs.
 */
const ContainerSettings: React.FC = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({ props: node.data.props }));
  return (
    <div className="flex flex-col gap-3 text-sm">
      <label className="flex flex-col gap-1">
        <span>Background</span>
        <input
          type="color"
          value={props.background || "#f9fafb"}
          onChange={(e) => setProp((p: any) => (p.background = e.target.value))}
          className="border rounded p-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Padding</span>
        <input
          type="number"
          min={0}
          value={props.padding ?? 10}
          onChange={(e) => setProp((p: any) => (p.padding = parseInt(e.target.value)))}
          className="border rounded p-1"
        />
      </label>
    </div>
  );
};

Container.craft = {
  displayName: "Container",
  props: {
    background: "#f9fafb",
    padding: 10,
  },
  related: {
    settings: ContainerSettings,
  },
  rules: {
    canDrag: () => true,
  },
};

/**
 * TextOnlyContainer component
 *
 * A container that only allows Text components as its children.  It
 * shares the same appearance controls as Container but uses a
 * canMoveIn rule to restrict droppable nodes.
 */
const TextOnlyContainer: React.FC<{ background?: string; padding?: number; children?: React.ReactNode }> & { craft?: any } = ({
  background,
  padding,
  children,
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      style={{
        background: background || "#e0f7fa",
        padding: `${padding ?? 10}px`,
        margin: "0.5rem 0",
        borderRadius: "0.5rem",
      }}
    >
      {children}
    </div>
  );
};

const TextOnlyContainerSettings: React.FC = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({ props: node.data.props }));
  return (
    <div className="flex flex-col gap-3 text-sm">
      <label className="flex flex-col gap-1">
        <span>Background</span>
        <input
          type="color"
          value={props.background || "#e0f7fa"}
          onChange={(e) => setProp((p: any) => (p.background = e.target.value))}
          className="border rounded p-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Padding</span>
        <input
          type="number"
          min={0}
          value={props.padding ?? 10}
          onChange={(e) => setProp((p: any) => (p.padding = parseInt(e.target.value)))}
          className="border rounded p-1"
        />
      </label>
    </div>
  );
};

TextOnlyContainer.craft = {
  displayName: "TextOnlyContainer",
  props: {
    background: "#e0f7fa",
    padding: 10,
  },
  related: {
    settings: TextOnlyContainerSettings,
  },
  rules: {
    canMoveIn: (incoming: any[]) => {
      // Allow only Text components
      return incoming.every((node) => {
        const type = node.data.type;
        return type === Text;
      });
    },
  },
};

/**
 * ButtonOnlyContainer component
 *
 * A container that only accepts Button components as children.  Similar
 * to TextOnlyContainer but for Buttons.
 */
const ButtonOnlyContainer: React.FC<{ background?: string; padding?: number; children?: React.ReactNode }> & { craft?: any } = ({
  background,
  padding,
  children,
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      style={{
        background: background || "#fffde7",
        padding: `${padding ?? 10}px`,
        margin: "0.5rem 0",
        borderRadius: "0.5rem",
      }}
    >
      {children}
    </div>
  );
};

const ButtonOnlyContainerSettings: React.FC = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({ props: node.data.props }));
  return (
    <div className="flex flex-col gap-3 text-sm">
      <label className="flex flex-col gap-1">
        <span>Background</span>
        <input
          type="color"
          value={props.background || "#fffde7"}
          onChange={(e) => setProp((p: any) => (p.background = e.target.value))}
          className="border rounded p-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Padding</span>
        <input
          type="number"
          min={0}
          value={props.padding ?? 10}
          onChange={(e) => setProp((p: any) => (p.padding = parseInt(e.target.value)))}
          className="border rounded p-1"
        />
      </label>
    </div>
  );
};

ButtonOnlyContainer.craft = {
  displayName: "ButtonOnlyContainer",
  props: {
    background: "#fffde7",
    padding: 10,
  },
  related: {
    settings: ButtonOnlyContainerSettings,
  },
  rules: {
    canMoveIn: (incoming: any[]) => {
      return incoming.every((node) => {
        const type = node.data.type;
        return type === Button;
      });
    },
  },
};

/**
 * Card component
 *
 * Provides two droppable regions: a header area that accepts only Text
 * components and a footer area that accepts only Button components.
 * The Card itself can be dragged as a single unit and its
 * background colour is configurable.
 */
const Card: React.FC<{ background?: string }> & { craft?: any } = ({ background }) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      style={{
        background: background || "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "0.5rem",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      {/* Header - Text only */}
      <Element
        id="cardHeader"
        is={TextOnlyContainer}
        padding={10}
        background="#f0f9ff"
        canvas
      >
        <Text text="Card heading" fontSize={18} />
      </Element>
      {/* Footer - Button only */}
      <Element
        id="cardFooter"
        is={ButtonOnlyContainer}
        padding={10}
        background="#fff7ed"
        canvas
      >
        <Button text="Action" color="#6366f1" />
      </Element>
    </div>
  );
};

const CardSettings: React.FC = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({ props: node.data.props }));
  return (
    <div className="flex flex-col gap-3 text-sm">
      <label className="flex flex-col gap-1">
        <span>Background</span>
        <input
          type="color"
          value={props.background || "#ffffff"}
          onChange={(e) => setProp((p: any) => (p.background = e.target.value))}
          className="border rounded p-1"
        />
      </label>
    </div>
  );
};

Card.craft = {
  displayName: "Card",
  props: {
    background: "#ffffff",
  },
  related: {
    settings: CardSettings,
  },
};

/**
 * Toolbox component
 *
 * Shows a list of user components that can be dragged onto the canvas.
 * It leverages `connectors.create` to create nodes when an item is
 * dropped.
 */
const Toolbox: React.FC = () => {
  const { connectors } = useEditor();
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Toolbox</h2>
      <div className="flex flex-col gap-2">
        <button
          ref={(ref) => {
            if (ref) connectors.create(ref, <Text text="Text" fontSize={16} />);
          }}
          className="p-2 border rounded bg-white hover:bg-gray-50 text-left"
        >
          Text
        </button>
        <button
          ref={(ref) => {
            if (ref) connectors.create(ref, <Button text="Button" color="#6366f1" />);
          }}
          className="p-2 border rounded bg-white hover:bg-gray-50 text-left"
        >
          Button
        </button>
        <button
          ref={(ref) => {
            if (ref) connectors.create(ref, <Element is={Container} padding={10} canvas />);
          }}
          className="p-2 border rounded bg-white hover:bg-gray-50 text-left"
        >
          Container
        </button>
        <button
          ref={(ref) => {
            if (ref) connectors.create(ref, <Element is={TextOnlyContainer} padding={10} canvas />);
          }}
          className="p-2 border rounded bg-white hover:bg-gray-50 text-left"
        >
          Text‑only Container
        </button>
        <button
          ref={(ref) => {
            if (ref) connectors.create(ref, <Element is={ButtonOnlyContainer} padding={10} canvas />);
          }}
          className="p-2 border rounded bg-white hover:bg-gray-50 text-left"
        >
          Button‑only Container
        </button>
        <button
          ref={(ref) => {
            if (ref) connectors.create(ref, <Card />);
          }}
          className="p-2 border rounded bg-white hover:bg-gray-50 text-left"
        >
          Card
        </button>
      </div>
    </div>
  );
};

/**
 * Settings panel
 *
 * Displays controls for the currently selected node.  If a node
 * supplies a related settings component (via `craft.related.settings`),
 * it is rendered here.  The panel also exposes a Delete button when
 * the node is deletable.
 */
const SettingsPanel: React.FC = () => {
  const { actions, query, selected } = useEditor((state, query) => {
    const [currentNodeId] = state.events.selected;
    let selected;
    if (currentNodeId) {
      const node = state.nodes[currentNodeId];
      selected = {
        id: currentNodeId,
        name: node.data.displayName || node.data.name,
        settings: node.related && (node.related as any).settings,
        isDeletable: query.node(currentNodeId).isDeletable(),
      };
    }
    return { selected };
  });
  return selected ? (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Settings</h2>
      <div className="text-sm font-medium text-gray-700">{selected.name}</div>
      {selected.settings && React.createElement(selected.settings)}
      {selected.isDeletable && (
        <button
          onClick={() => actions.delete(selected.id)}
          className="mt-2 p-2 border rounded bg-red-500 text-white hover:bg-red-600"
        >
          Delete
        </button>
      )}
    </div>
  ) : (
    <div>
      <h2 className="text-lg font-semibold">Settings</h2>
      <p className="text-sm text-gray-600">Select an element to edit its properties.</p>
    </div>
  );
};

/**
 * LayersPanel component
 *
 * Displays the hierarchical tree of nodes in the current editor.
 * Clicking on a layer selects that node in the editor.  Indentation
 * represents the parent/child relationship.  Linked nodes (those
 * defined via Element id props) are shown as well.
 */
const LayersPanel: React.FC = () => {
  const { state, actions } = useEditor((state) => ({ state }));
  const rootNode = state.nodes["ROOT"];
  if (!rootNode) {
    return null;
  }
  // recursively render nodes
  const renderNode = (id: string, depth: number) => {
    const node = state.nodes[id];
    if (!node) return null;
    const children: string[] = node.data.nodes || [];
    const linkedEntries = node.data.linkedNodes || {};
    // `state.events.selected` can be either a Set or an array depending on the Craft.js implementation.
    // To safely access the first selected id, normalize the value to an array.  If it's a Set, convert
    // it to an array via Array.from; if it's already an array, use it directly.  If it's undefined, use
    // an empty array.  Once normalized, grab the first element or null when empty.  This avoids using
    // `.length` on a Set, which would otherwise cause a TypeScript error.
    const selectedRaw = state.events.selected;
    const selectedArray = Array.isArray(selectedRaw)
      ? selectedRaw
      : Array.from(selectedRaw ?? [] as any);
    const selectedId = selectedArray.length > 0 ? selectedArray[0] : null;
    const isSelected = selectedId === id;
    return (
      <div key={id}>
        <div
          style={{ paddingLeft: depth * 16 }}
          className={`cursor-pointer p-1 text-sm ${isSelected ? "bg-blue-100" : ""}`}
          onClick={() => actions.selectNode(id)}
        >
          {node.data.displayName || node.data.name || id}
        </div>
        {/* render child nodes */}
        {children.map((childId) => renderNode(childId, depth + 1))}
        {/* render linked nodes (named slots) */}
        {Object.entries(linkedEntries).map(([slotName, childId]) => (
          <div key={childId}>
            <div
              style={{ paddingLeft: (depth + 1) * 16 }}
              className="italic text-gray-500 text-sm cursor-pointer"
              onClick={() => actions.selectNode(childId)}
            >
              {slotName}
            </div>
            {renderNode(childId, depth + 2)}
          </div>
        ))}
      </div>
    );
  };
  // Start rendering from children of root
  const topLevelIds = rootNode.data.nodes || [];
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Layers</h2>
      {topLevelIds.map((id) => renderNode(id, 0))}
    </div>
  );
};

/**
 * Topbar component
 *
 * Contains a toggle to enable/disable editing (which hides the
 * connectors and prevents accidental dragging) and an Export button
 * which logs the serialized state of the editor to the console.  You
 * can extend this to save the serialized JSON to your backend.
 */
const Topbar: React.FC = () => {
  const { enabled, actions, query } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));
  const handleCopy = () => {
    const json = query.serialize();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(json).then(() => {
        alert("Copied layout JSON to clipboard");
      });
    } else {
      // console.log(json);
    }
  };
  const handleLoad = () => {
    const json = prompt("Paste previously saved JSON here:");
    if (json) {
      try {
        actions.deserialize(json);
      } catch (err) {
        alert("Failed to load JSON: " + err);
      }
    }
  };
  return (
    <div className="flex items-center justify-between flex-wrap gap-2 mb-2 p-2 border-b border-gray-200 bg-gray-50">
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => actions.setOptions((opts) => (opts.enabled = e.target.checked))}
        />
        <span className="text-sm">Edit mode</span>
      </label>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => actions.history.undo()}
          className="p-1 px-2 text-sm border rounded bg-gray-200 hover:bg-gray-300"
        >
          Undo
        </button>
        <button
          onClick={() => actions.history.redo()}
          className="p-1 px-2 text-sm border rounded bg-gray-200 hover:bg-gray-300"
        >
          Redo
        </button>
        <button
          onClick={handleCopy}
          className="p-1 px-2 text-sm border rounded bg-gray-200 hover:bg-gray-300"
        >
          Copy
        </button>
        <button
          onClick={handleLoad}
          className="p-1 px-2 text-sm border rounded bg-gray-200 hover:bg-gray-300"
        >
          Load
        </button>
        <button
          onClick={() => {
            const json = query.serialize();
            // console.log(json);
            alert("Layout JSON serialized to console");
          }}
          className="p-1 px-2 text-sm border rounded bg-gray-200 hover:bg-gray-300"
        >
          Export
        </button>
      </div>
    </div>
  );
};

/**
 * The main Craft.js Page Editor.  Combines the Toolbox, Editor
 * Canvas and SettingsPanel into a responsive layout.  The editor is
 * initialized with an empty Container canvas so that users have a
 * drop target right away.
 */
export default function CraftPage() {
  return (
    <Editor
      resolver={{
        Container,
        Text,
        Button,
        TextOnlyContainer,
        ButtonOnlyContainer,
        Card,
      }}
    >
      <div className="flex h-full" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Left sidebar: Toolbox and Layers */}
        <aside className="w-1/4 min-w-[220px] p-4 border-r border-gray-200 bg-white overflow-y-auto flex flex-col gap-8">
          <Toolbox />
          <LayersPanel />
        </aside>
        {/* Canvas and topbar */}
        <main className="flex-1 p-4 overflow-y-auto">
          <Topbar />
          <div className="border border-gray-300 rounded p-2 bg-gray-50">
            <Frame>
              {/* Provide an initial Container canvas so users can start dropping components */}
              <Element is={Container} background="#ffffff" padding={20} canvas>
                <Text text="Hello world!" fontSize={20} />
                <Button text="Click me" color="#6366f1" />
              </Element>
            </Frame>
          </div>
        </main>
        {/* Settings panel */}
        <aside className="w-1/4 min-w-[220px] p-4 border-l border-gray-200 bg-white overflow-y-auto">
          <SettingsPanel />
        </aside>
      </div>
    </Editor>
  );
}