import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { CustomComponentModel } from "@/lib/models/CustomComponent";
import type { NextRequest } from "next/server";

// Simple sanitizer to strip <script> tags and inline event handlers
function sanitizeHtml(input: string): string {
  try {
    let out = String(input || "");
    // Remove script tags
    out = out.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "");
    // Remove on* attributes like onclick, onerror, etc.
    out = out.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    return out;
  } catch {
    return input;
  }
}

type CreateOptions = {
  kind?: "component" | "widget";
  platform?: "whatsapp" | "telegram" | "messenger" | "email" | "link" | "button" | string;
  label?: string;
  phone?: string;
  href?: string;
  theme?: "light" | "dark" | "brand";
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  shape?: "rounded" | "full";
  icon?: boolean;
};

function buildTemplateFromOptions(opts: CreateOptions): { code: string; config?: any } {
  const o: CreateOptions = { ...opts };
  const theme = o.theme || "brand";
  const variant = o.variant || "solid";
  const size = o.size || "md";
  const shape = o.shape || "rounded";
  const icon = o.icon !== false; // default true

  const pad = size === "sm" ? "0.375rem 0.75rem" : size === "lg" ? "0.75rem 1.25rem" : "0.5rem 1rem";
  const radius = shape === "full" ? "9999px" : "0.5rem";
  const font = size === "sm" ? "0.875rem" : size === "lg" ? "1rem" : "0.9375rem";
  let brandColor = "#111827";
  if (o.platform === "whatsapp") brandColor = "#25D366";
  else if (o.platform === "telegram") brandColor = "#229ED9";
  else if (o.platform === "messenger") brandColor = "#0084FF";
  else if (o.platform === "email") brandColor = "#EF4444";
  const bg = theme === "brand" ? brandColor : theme === "dark" ? "#111827" : "#ffffff";
  const fg = theme === "light" ? "#111827" : "#ffffff";
  const border = variant === "outline" ? `1px solid ${brandColor}` : "none";
  const finalBg = variant === "ghost" ? "transparent" : bg;
  const finalFg = variant === "outline" ? brandColor : fg;
  let label = o.label || "Click me";
  if (!o.label) {
    if (o.platform === "whatsapp") label = "Chat on WhatsApp";
    else if (o.platform === "telegram") label = "Message on Telegram";
    else if (o.platform === "messenger") label = "Message on Messenger";
    else if (o.platform === "email") label = "Send Email";
  }

  // Compute href
  let href = "#";
  if (o.platform === "whatsapp") {
    const digits = (o.phone || "").replace(/\D+/g, "");
    href = digits ? `https://wa.me/${digits}` : "https://wa.me";
  } else if (o.platform === "telegram") {
    const handle = (o.href || "").trim().replace(/^@/, "");
    href = handle ? `https://t.me/${handle}` : "https://t.me";
  } else if (o.platform === "messenger") {
    const page = (o.href || "").trim().replace(/^@/, "");
    href = page ? `https://m.me/${page}` : "https://m.me";
  } else if (o.platform === "email") {
    const mail = (o.href || o.phone || "").trim();
    href = mail ? `mailto:${mail}` : "mailto:";
  } else if (o.href) {
    href = o.href;
  }

  const waSvg = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" style="margin-right:0.5rem">
      <path d="M12 2C6.486 2 2 6.205 2 11.5c0 1.927.57 3.725 1.552 5.236L2 22l5.47-1.508A10.7 10.7 0 0 0 12 21c5.514 0 10-4.205 10-9.5S17.514 2 12 2Zm5.26 14.074c-.22.62-1.28 1.18-1.77 1.22-.48.04-1.09.06-1.74-.11-.4-.1-.92-.3-1.6-.6-2.82-1.23-4.66-4.15-4.8-4.35-.14-.2-1.14-1.52-1.14-2.9 0-1.38.72-2.06.98-2.35.26-.29.58-.36.77-.36.19 0 .38 0 .55.01.18.01.42-.07.66.5.24.58.82 2 .9 2.15.07.15.12.33.02.53-.1.2-.16.33-.31.5-.16.17-.33.38-.47.51-.16.16-.33.34-.14.68.19.34.84 1.38 1.8 2.24 1.25 1.08 2.3 1.42 2.66 1.58.36.16.57.13.78-.07.21-.2.9-1.04 1.14-1.39.24-.35.48-.29.8-.17.32.12 2.03.96 2.38 1.13.35.17.58.26.66.41.08.15.08.87-.12 1.47Z"/>
    </svg>`;
  const tgSvg = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" style="margin-right:0.5rem">
      <path d="M9.04 15.314 8.9 18.36c.36 0 .52-.155.71-.34l1.7-1.63 3.52 2.585c.646.356 1.11.17 1.29-.6l2.34-10.97c.21-.97-.37-1.35-1-.1L5.5 12.3c-.94.37-.92.9-.16 1.14l3.7 1.15 8.58-7.57c.4-.34.76-.15.46.19l-9.08 8.1Z"/>
    </svg>`;
  const msSvg = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" style="margin-right:0.5rem">
      <path d="M12 2c5.514 0 10 4.205 10 9.5S17.514 21 12 21a10.7 10.7 0 0 1-4.53-1.508L2 22l1.552-5.264C2.57 15.225 2 13.427 2 11.5 2 6.205 6.486 2 12 2Z"/>
    </svg>`;
  const mailSvg = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" style="margin-right:0.5rem">
      <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z"/>
    </svg>`;

  let iconHtml = "";
  if (icon) {
    if (o.platform === "whatsapp") iconHtml = waSvg;
    else if (o.platform === "telegram") iconHtml = tgSvg;
    else if (o.platform === "messenger") iconHtml = msSvg;
    else if (o.platform === "email") iconHtml = mailSvg;
  }
  const code = `
    <a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:0.5rem;padding:${pad};border:${border};border-radius:${radius};background:${finalBg};color:${finalFg};font-weight:600;font-size:${font};text-decoration:none;box-shadow:0 1px 2px rgba(0,0,0,0.06)">
      ${iconHtml}${label}
    </a>
  `.trim();

  const config = {
    fields: {
      label: { type: "text", label: "Label" },
      href: { type: "text", label: "URL" },
      phone: { type: "text", label: "Phone" },
      theme: { type: "select", label: "Theme", options: [
        { label: "Brand", value: "brand" },
        { label: "Light", value: "light" },
        { label: "Dark", value: "dark" },
      ] },
      variant: { type: "select", label: "Variant", options: [
        { label: "Solid", value: "solid" },
        { label: "Outline", value: "outline" },
        { label: "Ghost", value: "ghost" },
      ] },
      size: { type: "select", label: "Size", options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ] },
      shape: { type: "select", label: "Shape", options: [
        { label: "Rounded", value: "rounded" },
        { label: "Pill", value: "full" },
      ] },
      icon: { type: "select", label: "Show icon", options: [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" },
      ], defaultValue: "true" },
    },
  };

  return { code, config };
}

// Exported GET handler for retrieving custom components.  When a user
// is authenticated the response includes all components owned by the
// user as well as any components marked as public.  When no user
// session is available the response falls back to returning only
// public components.  Components are returned in a flat array under
// the `components` key.
export async function GET(req: Request) {
  // Attempt to load the current session; if missing or invalid then
  // `session` will be null.
  const session = await getServerSession(authOptions);
  await connectDB();
  const filters: any[] = [];
  // Public components are always returned
  filters.push({ public: true });
  // Include private components owned by the authenticated user
  if (session?.user?.email) {
    filters.push({ ownerEmail: session.user.email });
  }
  // Query for any components matching either filter.  `lean()` is
  // used to return plain JavaScript objects rather than Mongoose
  // documents.
  const components = await CustomComponentModel.find({ $or: filters }).lean();
  return NextResponse.json({ components });
}

// Exported POST handler for generating and persisting a new custom
// component.  Requires authentication; unauthenticated users will
// receive a 401 response.  Expects JSON body with `prompt`, `name`
// and optional `public` boolean.  The prompt is sent to the
// OpenAI API to generate component code.  The resulting component
// definition is stored in MongoDB and returned in the response.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const {
    action = "create",
    prompt,
    name,
    public: isPublic = false,
    options = {},
    useAI = true,
    targetName,
  } = body || {} as any;

  if (action === "modify") {
    if (!targetName || !prompt) {
      return NextResponse.json({ error: "missing targetName or prompt" }, { status: 400 });
    }
  } else {
    if (!prompt || !name) {
      return NextResponse.json({ error: "missing prompt or name" }, { status: 400 });
    }
  }
  await connectDB();
  const doAI = Boolean(useAI) && Boolean(process.env.OPENAI_API_KEY);
  let code = "";
  let config: any = undefined;

  // Server-side validation (basic)
  const opts = options as CreateOptions;
  function isValidUrl(u?: string) {
    if (!u) return false;
    try { new URL(u); return true; } catch { return false; }
  }
  function isValidPhone(p?: string) {
    if (!p) return false;
    const d = p.replace(/\D+/g, "");
    return d.length >= 8; // minimal sanity check
  }
  if (action === "create") {
    if (opts.platform === "whatsapp") {
      if (!isValidPhone(opts.phone || "")) {
        return NextResponse.json({ error: "invalid phone for WhatsApp" }, { status: 400 });
      }
    }
    if (opts.platform === "link" || opts.platform === "button") {
      if (opts.href && !isValidUrl(opts.href)) {
        return NextResponse.json({ error: "invalid URL" }, { status: 400 });
      }
    }
    if (opts.platform === "telegram" || opts.platform === "messenger") {
      // if href provided, it should be a handle or URL; allow empty to use homepage
      if (opts.href && /\s/.test(opts.href)) {
        return NextResponse.json({ error: "invalid handle/URL" }, { status: 400 });
      }
    }
    if (opts.platform === "email") {
      // simple email check
      const mail = (opts.href || opts.phone || "").trim();
      if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
        return NextResponse.json({ error: "invalid email address" }, { status: 400 });
      }
    }
  }

  // Helper: run AI with structured JSON output
  async function tryAI(basePrompt: string, existing?: string) {
    try {
      if (!doAI) return false;
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const sys = `You are a senior UI engineer. Return a compact JSON object with keys: code (HTML string), config (optional Puck fields shape), and notes. Code must be self-contained HTML/CSS (no external scripts) and safe to embed. Do not include <script> or event handlers.`;
      const user = [
        `Request: ${basePrompt}`,
        `Options: ${JSON.stringify(options)}`,
        existing ? `Existing code:\n${existing}` : "",
        `Return ONLY JSON.`,
      ].filter(Boolean).join("\n\n");
      const resp = await client.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        temperature: 0.4,
      });
      const content = resp.choices?.[0]?.message?.content || "";
      const json = JSON.parse(content || "{}");
      code = sanitizeHtml(String(json.code || ""));
      config = json.config || undefined;
      return !!code;
    } catch (e) {
      return false;
    }
  }

  if (action === "modify") {
    // Find existing component by name for this user or public
    const existing = await CustomComponentModel.findOne({
      name: targetName,
      $or: [ { public: true }, { ownerEmail: session.user.email } ],
    }).lean<any>();
    if (!existing) {
      return NextResponse.json({ error: "component not found" }, { status: 404 });
    }
    const basePrompt = `Modify the provided component according to the user's request while preserving structure and improving quality. ${prompt}`;
    const ok = await tryAI(basePrompt, (existing as any).code as string);
    if (!ok) {
      // Fallback: light rule-based changes (label/color)
      const opts = options as CreateOptions;
      let newCode = String((existing as any).code || "");
      if (opts.label) newCode = newCode.replace(/>([^<]*)<\//, `>${opts.label}<\/`);
      if (opts.theme || opts.variant) {
        // naive color tweak
        newCode = newCode.replace(/background:[^;"']+/g, "background:#25D366");
        newCode = newCode.replace(/color:[^;"']+/g, "color:#ffffff");
      }
      code = sanitizeHtml(newCode);
    }
    const updated = await CustomComponentModel.findOneAndUpdate(
      { _id: (existing as any)._id },
      { $set: { code, prompt: String(prompt), config: config ?? (existing as any).config } },
      { new: true }
    ).lean();
    return NextResponse.json({ ok: true, component: updated, mode: "modified" });
  }

  // action === 'create'
  const promptBase = `Create a high-quality UI ${options?.platform || "component"} matching the user description. Use professional defaults when unspecified, but strictly apply any explicit user preferences.`;
  const aiOk = await tryAI(`${promptBase}\n\nUser description: ${prompt}`);
  if (!aiOk) {
    const tpl = buildTemplateFromOptions(options as CreateOptions);
    code = sanitizeHtml(tpl.code);
    config = tpl.config;
  }

  try {
    const doc = await CustomComponentModel.findOneAndUpdate(
      { ownerEmail: isPublic ? null : session.user.email, name },
      { $set: { prompt, code, config: config ?? null, public: isPublic, ownerEmail: isPublic ? null : session.user.email } },
      { upsert: true, new: true }
    ).lean();
    return NextResponse.json({ ok: true, component: doc, mode: aiOk ? "ai" : "template" });
  } catch (dbErr: any) {
    console.error("Failed to save custom component", dbErr);
    return NextResponse.json({ error: dbErr?.message || String(dbErr) }, { status: 500 });
  }
}