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

// Detect whether the user's prompt describes a navigation bar.  We
// perform a case‑insensitive search for common keywords.  The AI
// sometimes struggles to build navbars reliably, so we provide a
// bespoke fallback implementation when such a prompt is detected.
function isNavBarPrompt(text: string): boolean {
  const t = String(text || '').toLowerCase();
  return t.includes('navbar') || t.includes('navigation bar') || t.includes('nav bar');
}

// Detect whether the user's prompt asks for an image carousel or slider.  We
// check for common keywords.
function isCarouselPrompt(text: string): boolean {
  const t = String(text || '').toLowerCase();
  return t.includes('carousel') || t.includes('slider');
}

// Detect whether the user's prompt asks for a sidebar or side navigation.  We
// check for common keywords like "sidebar", "side nav" or "side navigation".
function isSidebarPrompt(text: string): boolean {
  const t = String(text || '').toLowerCase();
  return t.includes('sidebar') || t.includes('side bar') || t.includes('side navigation') || t.includes('side nav');
}

// Detect whether the user's prompt describes a hero section.  A hero
// section typically includes a prominent headline, subheading, call‑to‑action
// button and optional illustration.  We match on common phrases like
// "hero", "hero section", "hero banner" and variations.  This allows the
// server to produce a multi‑element fallback layout when AI generation is
// unavailable.
function isHeroPrompt(text: string): boolean {
  const t = String(text || '').toLowerCase();
  return t.includes('hero section') || t.includes('hero banner') || (t.includes('hero') && !t.includes('zero')); // exclude accidental matches like "zero"
}

// Build a generic hero section template.  This template uses a flexible
// layout that stacks vertically on mobile and side‑by‑side on larger
// screens.  It defines editable fields for the headline, subheading,
// call‑to‑action label, call‑to‑action URL, and an optional image URL.
function buildHeroTemplate(prompt: string): { code: string; config: any } {
  // Provide sensible defaults that can be customised via Puck.  If the
  // prompt contains quoted text (e.g. "Welcome to Acme"), we can use it
  // as a default headline.  Similarly, detect an image URL if present.
  let headline = 'Your headline here';
  let subheading = 'Your subheading here';
  let ctaLabel = 'Get started';
  let ctaHref = '#';
  let imageUrl = 'https://via.placeholder.com/600x400';
  try {
    // Extract quoted phrases as potential headline/subheading
    const quotes = prompt.match(/"([^"]+)"|'([^']+)'/g);
    if (quotes && quotes.length > 0) {
      headline = quotes[0].replace(/^["']|["']$/g, '').trim() || headline;
      if (quotes.length > 1) {
        subheading = quotes[1].replace(/^["']|["']$/g, '').trim() || subheading;
      }
    }
    // Extract an http(s) URL as image
    const urlMatch = prompt.match(/https?:\/\/[^\s,]+/);
    if (urlMatch) {
      imageUrl = urlMatch[0];
    }
  } catch {
    // ignore parse errors
  }
  // Introduce layout and gap properties so that the hero elements can be rearranged using flex directions.  Separate fields for the image allow adjusting its dimensions and alt text.  The layout field controls flex-direction (row, row-reverse, column, column-reverse) and gap sets the spacing between the text and image in rem units.
  const code = `
    <section style="display:flex;flex-direction:{{layout}};align-items:center;justify-content:space-between;gap:{{gap}}rem;padding:2rem 1rem;background:#f9fafb">
      <div style="flex:1;max-width:600px;">
        <h1 style="font-size:2rem;font-weight:700;margin-bottom:0.5rem">{{headline}}</h1>
        <p style="font-size:1rem;color:#6b7280;margin-bottom:1rem">{{subheading}}</p>
        <a href="{{ctaHref}}" style="display:inline-block;padding:0.5rem 1rem;background:#111827;color:#ffffff;border-radius:0.375rem;font-weight:600;text-decoration:none">{{ctaLabel}}</a>
      </div>
      <div style="flex:1;max-width:600px;width:100%">
        <img src="{{imageUrl}}" alt="{{imageAlt}}" style="width:{{imageWidth}}px;height:{{imageHeight}}px;object-fit:cover;border-radius:0.5rem" />
      </div>
    </section>
  `.trim();
  const config = {
    fields: {
      headline: { type: 'text', label: 'Headline', defaultValue: headline },
      subheading: { type: 'text', label: 'Subheading', defaultValue: subheading },
      ctaLabel: { type: 'text', label: 'CTA label', defaultValue: ctaLabel },
      ctaHref: { type: 'text', label: 'CTA URL', defaultValue: ctaHref },
      imageUrl: { type: 'text', label: 'Image URL', defaultValue: imageUrl },
      imageAlt: { type: 'text', label: 'Image alt text', defaultValue: '' },
      imageWidth: { type: 'number', label: 'Image width (px)', defaultValue: 600 },
      imageHeight: { type: 'number', label: 'Image height (px)', defaultValue: 400 },
      layout: {
        type: 'select',
        label: 'Layout direction',
        options: [
          { label: 'Row', value: 'row' },
          { label: 'Row reverse', value: 'row-reverse' },
          { label: 'Column', value: 'column' },
          { label: 'Column reverse', value: 'column-reverse' },
        ],
        defaultValue: 'column',
      },
      gap: { type: 'number', label: 'Gap (rem)', defaultValue: 1.5 },
    },
  };
  return { code, config };
}

// Extract image URLs from a carousel prompt.  This simple regex looks for
// http/https URLs separated by commas or spaces.  If no URLs are found,
// the caller can provide defaults.
function parseCarouselPrompt(prompt: string): { images: string[] } {
  const urls: string[] = [];
  try {
    const regex = /(https?:\/\/[^\s,]+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(prompt))) {
      urls.push(match[1]);
    }
  } catch {
    // ignore
  }
  return { images: urls };
}

// Build a simple sliding image carousel.  The generated HTML uses a
// placeholder {{images}} which is replaced at render time with <div>
// wrappers containing <img> elements.  A basic keyframes animation
// scrolls through three slides; more slides will repeat.
function buildCarouselTemplate(prompt: string): { code: string; config: any } {
  // Parse any image URLs from the prompt. If none are provided, fall back to default slides.
  const { images } = parseCarouselPrompt(prompt);
  const defaults = [
    'https://via.placeholder.com/800x400?text=Slide+1',
    'https://via.placeholder.com/800x400?text=Slide+2',
    'https://via.placeholder.com/800x400?text=Slide+3',
  ];
  // Build default slide objects with sensible dimensions.
  const slides = (images.length > 0 ? images : defaults).map((url) => ({
    src: url,
    alt: '',
    width: 800,
    height: 400,
    href: '',
    target: '_self',
  }));
  const config = {
    fields: {
      slides: {
        type: 'array',
        label: 'Slides',
        arrayFields: {
          src: { type: 'text', label: 'Image URL' },
          alt: { type: 'text', label: 'Alt text' },
          width: { type: 'number', label: 'Width (px)' },
          height: { type: 'number', label: 'Height (px)' },
          href: { type: 'text', label: 'Link URL', defaultValue: '' },
          target: {
            type: 'select',
            label: 'Link target',
            options: [
              { label: 'Same tab', value: '_self' },
              { label: 'New tab', value: '_blank' },
            ],
            defaultValue: '_self',
          },
        },
        defaultItemProps: {
          src: 'https://via.placeholder.com/800x400',
          alt: '',
          width: 800,
          height: 400,
          href: '',
          target: '_self',
        },
        getItemSummary: (item: any) => item?.src || 'Image',
        ai: {
          instructions: 'Always return an array of objects for slides with keys: src, alt, width, height, href (optional) and target (optional). Do not return a comma‑separated string.',
        },
      },
    },
  };
  // Provide HTML with a slides placeholder. Each slide will be replaced at runtime by the renderer.
  const code = `
    <div style="position:relative;overflow:hidden;width:100%">
      <div style="display:flex;gap:0;">{{slides}}</div>
    </div>
  `.trim();
  return { code, config };
}

// Build a responsive sidebar template.  A sidebar is a vertical navigation
// menu that appears on the left of the screen.  It should be flexible
// enough to collapse into a top navigation bar on small screens.  The
// template defines editable fields for the list of links, the background
// colour, and the expanded/collapsed widths.  Default values are chosen
// according to best practices: an expanded width between 240–300px and a
// collapsed width between 48–64px【214629395195429†L110-L127】.  The
// generated HTML uses inline CSS and a small media query for responsive
// behaviour.  Links are rendered by replacing the {{links}} placeholder at
// runtime; each link should be provided as a comma‑separated list and is
// wrapped in a <li> element in the client rendering layer.
function buildSidebarTemplate(prompt: string): { code: string; config: any } {
  // Extract potential link labels from the prompt if provided, otherwise use defaults.
  let linkNames: string[] = [];
  try {
    // Find comma- or slash-separated words after keywords like "with" or "includes"
    const lower = String(prompt || '').toLowerCase();
    const idx = lower.lastIndexOf('with');
    if (idx >= 0) {
      let part = prompt.slice(idx + 4).trim();
      // Remove trailing punctuation
      part = part.replace(/[\.?!]/g, '');
      // Split on commas or slashes
      linkNames = part.split(/[,\/]+/).map((s) => s.trim()).filter(Boolean);
    }
  } catch {
    // ignore parse errors
  }
  if (linkNames.length === 0) {
    linkNames = ['Home', 'Dashboard', 'Settings', 'Profile'];
  }
  const defaults = linkNames.join(', ');
  const code = `
    <div style="display:flex;min-height:100vh;width:100%">
      <nav style="width:{{expandedWidth}}px;background-color:{{backgroundColor}};padding:1rem;overflow:auto;transition:width 0.3s;">
        <ul style="list-style-type:none;margin:0;padding:0">{{links}}</ul>
      </nav>
      <div style="flex:1;padding:1rem">
        <!-- Content goes here -->
      </div>
      <style>
        /* Responsive behaviour: collapse sidebar into a top bar on small screens */
        @media screen and (max-width: 700px) {
          nav { width: 100% !important; height:auto; position:relative; }
          nav ul { display:flex; flex-direction:row; flex-wrap:wrap; }
          nav ul li { margin-right:1rem; }
        }
        @media screen and (max-width: 400px) {
          nav ul li { margin-right:0; flex:1 1 100%; text-align:center; }
        }
      </style>
    </div>
  `.trim();
  const config = {
    fields: {
      // Accept a simple comma‑separated list of link labels.  While the
      // editor’s primary Sidebar component uses an array of objects, the
      // fallback remains string‑based for simplicity.  The AI instructions
      // attached to the Sidebar component will encourage generative
      // workflows to use the full `items` array instead.  The default
      // includes 3–6 items extracted from the prompt when available.
      links: { type: 'text', label: 'Links (comma-separated)', defaultValue: defaults },
      backgroundColor: { type: 'text', label: 'Background colour', defaultValue: '#f8f9fa' },
      expandedWidth: { type: 'number', label: 'Expanded width (px)', defaultValue: 280 },
      collapsedWidth: { type: 'number', label: 'Collapsed width (px)', defaultValue: 60 },
    },
  };
  return { code, config };
}

// Attempt to extract a brand name and list of link labels from a
// navigation bar prompt.  This heuristic looks for text in
// parentheses, treating it as the brand, and comma‑separated items
// following the word "and" as the menu labels.  If no explicit brand
// is found, the first item in the list is used for the brand.
function parseNavBarPrompt(prompt: string): { brand: string; links: string[] } {
  let brand = '';
  let links: string[] = [];
  try {
    const parenMatch = prompt.match(/\(([^)]*)\)/);
    if (parenMatch) {
      brand = parenMatch[1].replace(/as\s+brand/i, '').trim();
    }
    // Find the substring after the last occurrence of " and "
    const lower = prompt.toLowerCase();
    const idx = lower.lastIndexOf(' and ');
    let after = '';
    if (idx >= 0) {
      after = prompt.slice(idx + 5);
    }
    if (after) {
      // Remove trailing punctuation
      after = after.replace(/[\.?!]/g, '');
      const parts = after.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
      links = parts;
    }
    // If no brand specified, use first link as brand
    if (!brand && links.length > 0) {
      brand = links[0];
      links = links.slice(1);
    }
  } catch {
    // ignore parse errors
  }
  if (!brand) brand = 'Brand';
  if (links.length === 0) {
    links = ['Home', 'Pricing', 'About', 'Contact'];
  }
  return { brand, links };
}

// Build a simple responsive navigation bar using inline styles.  The
// generated HTML uses placeholders {{brand}} and {{links}} which are
// later replaced by the client render function.  The config defines
// editable fields for the brand and links.  Links should be provided
// as a comma‑separated list when editing via Puck.
function buildNavBarTemplate(prompt: string): { code: string; config: any } {
  const { brand, links } = parseNavBarPrompt(prompt);
  // Convert link strings into item objects with default href and target
  const items = links.map((label) => ({ label, href: '#', target: '_self', active: false }));
  const code = `
    <nav style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;padding:0.75rem 1rem;background:#111827;color:#ffffff;">
      <div style="font-weight:bold;font-size:1.125rem;">{{brand}}</div>
      <div style="display:flex;flex-wrap:wrap;margin-left:1rem;gap:1rem;">{{items}}</div>
    </nav>
  `.trim();
  const config = {
    fields: {
      brand: { type: 'text', label: 'Brand', defaultValue: brand },
      items: {
        type: 'array',
        label: 'Navigation items',
        arrayFields: {
          label: { type: 'text', label: 'Label' },
          href: { type: 'text', label: 'URL' },
          target: {
            type: 'select',
            label: 'Target',
            options: [
              { label: 'Same tab', value: '_self' },
              { label: 'New tab', value: '_blank' },
            ],
            defaultValue: '_self',
          },
          active: { type: 'text', label: 'Active item?', defaultValue: '' },
        },
        defaultItemProps: { label: 'Link', href: '#', target: '_self', active: '' },
        getItemSummary: (item: any) => item?.label || 'Item',
        ai: {
          instructions: 'Return an array of objects for navigation items with keys: label, href, target (optional) and active (optional). Do not return a comma‑separated string.',
        },
      },
    },
  };
  return { code, config };
}

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

  // Define a Puck fields configuration matching the simplified
  // options used in the dashboard editor.  The `phone` field has been
  // removed; users specify only a label and a URL.  Theme, variant,
  // size, shape and icon fields mirror those available in the client‑side
  // editor.
  const config = {
    fields: {
      label: { type: "text", label: "Label" },
      href: { type: "text", label: "URL" },
      theme: {
        type: "select",
        label: "Theme",
        options: [
          { label: "Brand", value: "brand" },
          { label: "Light", value: "light" },
          { label: "Dark", value: "dark" },
        ],
      },
      variant: {
        type: "select",
        label: "Variant",
        options: [
          { label: "Solid", value: "solid" },
          { label: "Outline", value: "outline" },
          { label: "Ghost", value: "ghost" },
        ],
      },
      size: {
        type: "select",
        label: "Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
      },
      shape: {
        type: "select",
        label: "Shape",
        options: [
          { label: "Rounded", value: "rounded" },
          { label: "Pill", value: "full" },
        ],
      },
      icon: {
        type: "select",
        label: "Show icon",
        options: [
          { label: "Yes", value: "true" },
          { label: "No", value: "false" },
        ],
        // Hide the icon by default.  Users can toggle it to "Yes" when needed.
        defaultValue: "false",
      },
    },
  } as const;

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
// Vercel AI SDK (via the generateComponent.ts helper) to generate
// component code.  The resulting component definition is stored
// in MongoDB and returned in the response.  Legacy fallbacks to the
// raw OpenAI SDK have been removed, so only the AI SDK or rule‑based
// heuristics are used to produce the component.
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
  let docs: any = undefined;

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
  async function tryAI(basePrompt: string, existing?: string, mode: 'create' | 'modify' = 'create') {
    try {
      // The legacy OpenAI fallback has been disabled.  This function is kept as a
      // placeholder for reference, but it simply returns false so that the
      // server never attempts to call the direct OpenAI API.  All AI
      // generation now goes through the Vercel AI SDK (see generateComponent.ts).
      return false;
    } catch (e) {
      return false;
    }
  }

  // Shallow merge for configs; preserves existing fields and adds new ones
  function mergeConfigs(oldCfg: any, newCfg: any) {
    const o = (oldCfg || {}) as any;
    const n = (newCfg || {}) as any;
    const merged: any = { ...o, ...n };
    const of = (o.fields || {}) as any;
    const nf = (n.fields || {}) as any;
    merged.fields = { ...of, ...nf };
    return merged;
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
    const basePrompt = `Enhance the provided component per the request, without removing existing content. ${prompt}`;
    let ok = false;
    // Flag indicating whether the component modification was generated by AI.
    // This value persists across updates so the editor can distinguish AI
    // components from manual ones.
    let isAIUpdate = false;
    // 1) Try Vercel AI SDK in modify mode
    if (useAI) {
      try {
        const mod = await import('@/lib/ai/generateComponent');
        const { modifyCustomComponent } = mod as any;
        const res = await modifyCustomComponent(String((existing as any).code || ''), String(prompt || ''), options);
        // If an error is returned, log it for debugging.  An error indicates the
        // AI call failed and a fallback should be used.
        if (res?.error) {
          try {
            console.error('[CustomComponents] AI modification error:', res.error);
          } catch {}
        }
        if (res && res.code) {
          code = sanitizeHtml(String(res.code || ''));
          config = res.config || undefined;
          docs = res.docs;
          ok = true;
          isAIUpdate = true;
        }
      } catch {}
    }
    // 2) Legacy OpenAI fallback removed: we no longer call tryAI here.  If the
    // Vercel AI SDK fails to produce a result, the code falls through to the
    // simple rule‑based fallback below.
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
    // Preserve previous version and increment version counter
    const mergedConfig = mergeConfigs((existing as any).config, config);
    function mergeDocs(oldD: any, newD: any) {
      const o = (oldD || {}) as any;
      const n = (newD || {}) as any;
      const out: any = { ...o, ...n };
      out.summary = n.summary || o.summary || '';
      out.fields = { ...(o.fields || {}), ...(n.fields || {}) };
      const ox = Array.isArray(o.examples) ? o.examples : [];
      const nx = Array.isArray(n.examples) ? n.examples : [];
      // de-dupe by title+props JSON
      const seen = new Set<string>();
      const mergedArr: any[] = [];
      [...ox, ...nx].forEach((ex) => {
        try { const key = `${ex?.title || ''}::${JSON.stringify(ex?.props || {})}`; if (seen.has(key)) return; seen.add(key); mergedArr.push(ex); } catch { mergedArr.push(ex); }
      });
      if (mergedArr.length) out.examples = mergedArr;
      return out;
    }
    const mergedDocs = mergeDocs((existing as any).docs, docs);
    const updated = await CustomComponentModel.findOneAndUpdate(
      { _id: (existing as any)._id },
      {
        $set: {
          code,
          prompt: String(prompt),
          config: mergedConfig,
          docs: mergedDocs,
          // If this modification introduced AI‑generated content, update the ai flag;
          // otherwise preserve the existing value.
          ...(isAIUpdate ? { ai: true } : {}),
        },
        $push: { history: { code: (existing as any).code, config: (existing as any).config, docs: (existing as any).docs, prompt: (existing as any).prompt, at: new Date() } },
        $inc: { version: 1 },
      },
      { new: true }
    ).lean();
    return NextResponse.json({ ok: true, component: updated, mode: "modified" });
  }

  // action === 'create'
  const promptBase = `Create a high-quality, responsive UI component or section matching the user description. Use semantic HTML and inline CSS or Tailwind classes. When the description specifies particular elements (e.g. carousel, navbar, hero section, card grid, pricing table), construct that layout. Insert {{placeholders}} for pieces of content that should be editable and define them under a fields config so that Puck can surface them. Do not include <script> tags or event handlers.`;
  let aiOk = false;
  // First attempt to use the Vercel AI SDK to generate the component.  This
  // allows us to leverage advanced prompt handling and schema validation.
  if (useAI) {
    try {
      const mod = await import('@/lib/ai/generateComponent');
      const { generateCustomComponent } = mod as any;
      const obj = await generateCustomComponent(String(prompt || ''), options);
      // If the AI returned an error, log it for debugging.  Do not treat
      // errors as successful generation.
      if (obj?.error) {
        try {
          console.error('[CustomComponents] AI error:', obj.error);
        } catch {}
      }
      if (obj && obj.code) {
        code = sanitizeHtml(String(obj.code || ''));
        config = obj.config;
        docs = obj.docs;
        aiOk = true;
        try {
          console.log('[CustomComponents] Generated using OpenAI Chat API');
        } catch {}
      }
    } catch (e) {
      // Generation failed; fall through to rule‑based templates.
    }
  }
  // If the AI SDK did not produce a result, skip the legacy OpenAI path entirely
  // and fall back directly to our rule‑based template generation.  This
  // eliminates any dependency on the OpenAI SDK and ensures that the
  // application always uses the Vercel AI SDK or simple heuristics.
  if (!aiOk) {
    // If the description suggests a navigation bar, carousel or hero section,
    // generate a tailored template.  Hero detection is checked after navbar
    // and carousel so that a prompt describing a hero carousel or hero navbar
    // doesn’t override those dedicated templates.  If none match, fall back
    // to the generic button/link builder.  This ordering ensures specific
    // layouts are preferred over the generic call‑to‑action button.
    if (isNavBarPrompt(prompt || '')) {
      const tpl = buildNavBarTemplate(prompt || '');
      code = sanitizeHtml(tpl.code);
      config = tpl.config;
      docs = {
        summary: 'Responsive navigation bar with a brand and navigation items.',
        fields: {
          brand: 'Brand name displayed on the left',
          items: 'Array of navigation items; each item has a label, href, target and optional active flag',
        },
        examples: [
          {
            title: 'Default',
            description: 'Brand with Home, About and Contact links',
            props: {
              brand: 'Acme',
              items: [
                { label: 'Home', href: '#', target: '_self' },
                { label: 'About', href: '#', target: '_self' },
                { label: 'Contact', href: '#', target: '_self' },
              ],
            },
          },
        ],
      };
      try { console.log('[CustomComponents] Fallback: generated navigation bar template'); } catch {}
    }
    else if (isCarouselPrompt(prompt || '')) {
      const tpl = buildCarouselTemplate(prompt || '');
      code = sanitizeHtml(tpl.code);
      config = tpl.config;
      docs = {
        summary: 'Image carousel with individually editable slides.',
        fields: { slides: 'Array of slide objects; each slide has src, alt, width, height and optional href and target fields' },
        examples: [
          {
            title: '3 slides',
            description: 'Three placeholder images',
            props: {
              slides: [
                { src: 'https://via.placeholder.com/800x400?text=One', alt: '', width: 800, height: 400, href: '', target: '_self' },
                { src: 'https://via.placeholder.com/800x400?text=Two', alt: '', width: 800, height: 400, href: '', target: '_self' },
                { src: 'https://via.placeholder.com/800x400?text=Three', alt: '', width: 800, height: 400, href: '', target: '_self' },
              ],
            },
          },
        ],
      };
      try { console.log('[CustomComponents] Fallback: generated carousel template'); } catch {}
    }
    else if (isSidebarPrompt(prompt || '')) {
      const tpl = buildSidebarTemplate(prompt || '');
      code = sanitizeHtml(tpl.code);
      config = tpl.config;
      docs = {
        summary: 'Responsive sidebar with customizable links and widths. Uses best‑practice widths (280px expanded, 60px collapsed) and collapses into a horizontal menu on narrow screens.',
        fields: {
          links: 'Comma‑separated list of navigation items',
          backgroundColor: 'Background colour of the sidebar',
          expandedWidth: 'Width in pixels when expanded (typically 240–300)',
          collapsedWidth: 'Width in pixels when collapsed (typically 48–64)',
        },
        examples: [
          {
            title: 'Default sidebar',
            description: 'A sidebar with common dashboard links',
            props: { links: 'Home, Dashboard, Settings, Profile', backgroundColor: '#f8f9fa', expandedWidth: 280, collapsedWidth: 60 },
          },
        ],
      };
      try { console.log('[CustomComponents] Fallback: generated sidebar template'); } catch {}
    }
    else if (isHeroPrompt(prompt || '')) {
      const tpl = buildHeroTemplate(prompt || '');
      code = sanitizeHtml(tpl.code);
      config = tpl.config;
      docs = {
        summary: 'Responsive hero section with configurable layout, headline, subheading, call‑to‑action and image.  Users can reposition the image and text using the layout and gap fields, and adjust image dimensions.',
        fields: {
          headline: 'Main headline text',
          subheading: 'Secondary text below the headline',
          ctaLabel: 'Label for the call‑to‑action button',
          ctaHref: 'URL for the call‑to‑action button',
          imageUrl: 'URL of the illustrative image',
          imageAlt: 'Alt text describing the image',
          imageWidth: 'Width of the image in pixels',
          imageHeight: 'Height of the image in pixels',
          layout: 'Flex direction for placing image and text: row, row‑reverse, column or column‑reverse',
          gap: 'Spacing between image and text (in rem units)',
        },
        examples: [
          {
            title: 'Side‑by‑side hero',
            description: 'Image on the right and text on the left with a 1.5 rem gap',
            props: {
              headline: 'Welcome to our product',
              subheading: 'Build amazing things faster',
              ctaLabel: 'Try now',
              ctaHref: '#',
              imageUrl: 'https://via.placeholder.com/600x400',
              imageAlt: '',
              imageWidth: 600,
              imageHeight: 400,
              layout: 'row',
              gap: 1.5,
            },
          },
        ],
      };
      try { console.log('[CustomComponents] Fallback: generated hero section template'); } catch {}
    }
    else {
      const tpl = buildTemplateFromOptions(options as CreateOptions);
      code = sanitizeHtml(tpl.code);
      config = tpl.config;
      docs = {
        summary: 'Configurable call‑to‑action link button.',
        fields: {
          label: 'Button label', href: 'Target URL', theme: 'Color theme', variant: 'Solid/Outline/Ghost', size: 'Small/Medium/Large', shape: 'Rounded/Pill', icon: 'Show an icon'
        },
        examples: [
          { title: 'Primary', description: 'Brand solid medium rounded', props: { label: 'Get started', href: '#', theme: 'brand', variant: 'solid', size: 'md', shape: 'rounded', icon: true } },
        ],
      };
      try { console.log('[CustomComponents] Fallback: generated generic button/link template'); } catch {}
    }
  }

  try {
    const doc = await CustomComponentModel.findOneAndUpdate(
      { ownerEmail: isPublic ? null : session.user.email, name },
      {
        $set: {
          prompt,
          code,
          config: config ?? null,
          docs: (typeof docs !== 'undefined' ? docs : null),
          public: isPublic,
          ownerEmail: isPublic ? null : session.user.email,
          // Persist whether this component was generated by AI.  When the AI
          // pipeline fails and a rule‑based template is used, this flag
          // remains false.
          ai: aiOk,
        },
      },
      { upsert: true, new: true }
    ).lean();
    // Debug: log whether the saved component was generated by AI or not
    try {
      console.log('[CustomComponents] Saved component', {
        name: name,
        ai: aiOk,
        id: (doc as any)?._id?.toString?.() || null,
      });
    } catch {}
    return NextResponse.json({ ok: true, component: doc, mode: aiOk ? "ai" : "template" });
  } catch (dbErr: any) {
    console.error("Failed to save custom component", dbErr);
    return NextResponse.json({ error: dbErr?.message || String(dbErr) }, { status: 500 });
  }
}
