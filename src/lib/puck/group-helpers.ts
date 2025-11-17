const STRIP_KEYS = new Set(["id", "_id", "__id", "__internalId", "__puckId", "key", "_key"]);

function sanitizeNode(value: any): any {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeNode(item)).filter((item) => item !== undefined);
  }
  if (value && typeof value === "object") {
    const result: any = {};
    Object.keys(value).forEach((key) => {
      if (STRIP_KEYS.has(key)) return;
      const v = value[key];
      if (key === "slots" || key === "zones") {
        const buckets: any = {};
        Object.keys(v || {}).forEach((slotKey) => {
          const slotVal = v[slotKey];
          buckets[slotKey] = sanitizeNode(slotVal);
        });
        result[key] = buckets;
      } else if (key === "props") {
        result[key] = sanitizeNode(v);
      } else {
        result[key] = sanitizeNode(v);
      }
    });
    return result;
  }
  return value;
}

export function cloneGroupContent(tree: any): any[] {
  const normalized = normalizeGroupTree(tree);
  const content = Array.isArray(normalized?.root?.content) ? normalized.root.content : [];
  return sanitizeNode(content) || [];
}

export function hydrateGroupProps(
  tree: any,
  props: any = {},
  meta?: { title?: string; groupId?: string }
) {
  const nextProps: any = { ...(props || {}) };
  if (meta?.title && !nextProps.title) {
    nextProps.title = meta.title;
  }
  if (meta?.groupId) {
    nextProps.__groupId = meta.groupId;
  }
  if (!Array.isArray(nextProps.content) || nextProps.content.length === 0) {
    nextProps.content = cloneGroupContent(tree);
  }
  return nextProps;
}
export type GroupTree = { root: { content: any[]; [key: string]: any }; content: any[] };
export type GroupTreeSummary = {
  normalized: GroupTree;
  contentCount: number;
  childTypes: string[];
};

const ensureProps = (root: any) => {
  if (!root || typeof root !== "object") return {};
  if (root.props && typeof root.props === "object") return root.props;
  root.props = {};
  return root.props;
};

/**
 * Normalises any saved group tree into a safe Puck data document.
 * We preserve root-level props when present and always return a fresh object
 * so React rendering cannot accidentally mutate database payloads.
 */
function buildResult(root: any): GroupTree {
  return {
    root,
    content: Array.isArray(root.content) ? root.content : [],
  };
}

export function normalizeGroupTree(tree: any): GroupTree {
  const fallbackRoot = { props: {}, content: [] };
  const fallback = buildResult(fallbackRoot);
  if (!tree || typeof tree !== "object") {
    return fallback;
  }
  try {
    const clone = JSON.parse(JSON.stringify(tree));
    if (clone && typeof clone === "object") {
      if (clone.root && Array.isArray(clone.root.content)) {
        const root = clone.root || {};
        ensureProps(root);
        const finalRoot = { ...root, content: Array.isArray(root.content) ? root.content : [] };
        return buildResult(finalRoot);
      }
      if (Array.isArray(clone.content)) {
        const props = clone.props || (clone.root && clone.root.props) || {};
        const finalRoot = {
          ...(clone.root && typeof clone.root === "object" ? clone.root : {}),
          props,
          content: clone.content,
        };
        return buildResult(finalRoot);
      }
      if (Array.isArray(clone)) {
        return buildResult({ props: {}, content: clone });
      }
      if (clone.content && typeof clone.content === "object") {
        return buildResult({ props: {}, content: [clone.content] });
      }
    }
  } catch {
    return fallback;
  }
  return buildResult({ props: {}, content: [tree] });
}

export function summarizeGroupTree(tree: any): GroupTreeSummary {
  const normalized = normalizeGroupTree(tree);
  const content = Array.isArray(normalized?.root?.content) ? normalized.root.content : [];
  const childTypes = content.slice(0, 5).map((node: any) => String(node?.type || "unknown"));
  return {
    normalized,
    contentCount: content.length,
    childTypes,
  };
}
