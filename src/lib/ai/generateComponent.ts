import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

// A helper to improve user prompts before generating a UI.  This uses the OpenAI
// chat API to refine the original description into a more detailed and specific
// description that includes dynamic UI considerations (e.g. images with width,
// height and alt text, layout options, etc.).  If the API key is missing or
// the call fails, the original description is returned unchanged.  This
// implements a simple form of “meta prompting,” where one LLM is used to
// rewrite a prompt before another model acts on it【166272422990015†L25-L50】.
async function refinePrompt(description: string): Promise<string> {
  // If no API key is set, skip refinement.
  if (!process.env.OPENAI_API_KEY) return description;
  try {
    const messages: any[] = [
      {
        role: 'system',
        content:
          'You are an expert UI prompt enhancer.  Your job is to rewrite the user’s description of a desired UI component so that it is clear, complete and ready for an automated UI generator.  Expand brief descriptions into detailed requirements: specify the structure (e.g. hero sections should include a headline, subheading, call-to-action and image), call out the number of slides or items when carousels or lists are mentioned, and describe images as objects with properties such as src, alt, width, height and optional href/target.  Include details about layout (flex or grid) and spacing when users mention repositioning or style options.  Use sensible defaults when the user omits details.  Return only the rewritten description without any additional commentary.'
      },
      { role: 'user', content: description }
    ];
    const body = {
      model: process.env.OPENAI_MODEL_PROMPT_ENHANCER || 'gpt-4o',
      messages,
      temperature: 0.6,
      max_tokens: 512,
      top_p: 1,
      n: 1,
    };
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    const refined = json?.choices?.[0]?.message?.content?.trim();
    if (typeof refined === 'string' && refined.length > 0) {
      return refined;
    }
    return description;
  } catch {
    return description;
  }
}
import { z } from 'zod';

// Import the Puck configuration so we can expose available components to the AI.  The
// config.fixed file contains the canonical list of components supported by the
// editor along with their labels and field definitions.  By reading this file
// at build time we can construct a concise summary of the available
// components and their editable fields.  Including this summary in the
// system prompt helps guide the language model to reuse existing components
// rather than inventing new ones.  See docs for details: https://puckeditor.com/docs/api-reference/configuration/config
import { config as puckConfig } from '@/lib/puck/config';

// Precompute a short description of the available Puck components.  This is
// generated once when the module is imported.  Each entry lists the component
// name, its display label (if present), and the keys of its editable fields.
// The resulting string is appended to the AI prompt to inform the model of
// the components it can draw upon when constructing UI.  Keeping the
// description concise avoids bloating the prompt while still conveying the
// essential information needed to match user descriptions to existing
// components.
const availableComponents: string = (() => {
  try {
    const comps = (puckConfig as any)?.components || {};
    const summaries: string[] = [];
    for (const key of Object.keys(comps)) {
      const def = (comps as any)[key] || {};
      const label: string = def.label || key;
      const fieldNames: string[] = Object.keys(def.fields || {});
      // Limit the list of fields to a reasonable number to keep the prompt short.
      const fieldsPreview = fieldNames.slice(0, 6).join(', ');
      summaries.push(`${key} ("${label}"): fields – ${fieldsPreview}`);
    }
    return summaries.join(' | ');
  } catch {
    return '';
  }
})();

/**
 * Generate a custom component using the Vercel AI SDK.  Given a description and
 * optional options, this function prompts the model to return an object
 * containing HTML code and a Puck configuration.  The caller must ensure
 * that an appropriate OpenAI API key is available in the environment.
 *
 * @param description User‑provided description of the desired UI
 * @param options Optional structured options to pass to the model
 * @returns An object with `code` and `config` fields
 */
export async function generateCustomComponent(description: string, options: any = {}): Promise<{ code: string; config?: any; docs?: any; error?: string }> {
  // First enhance the user’s description via the OpenAI prompt enhancer.  This
  // rewrite will expand terse descriptions into detailed requirements, using
  // sensible defaults and clarifying ambiguous sections.  If the enhancer
  // fails or is unavailable, the original description is used.
  const enhancedDescription = await refinePrompt(description || '');

  // Construct a system message outlining the responsibilities of the model.
  const systemPrompt = [
    'You are a senior UI engineer and product designer. Create a responsive, high‑quality UI component or section that matches the provided description. Use semantic HTML with inline Tailwind CSS classes and prefer accessible components from open‑source React UI libraries such as shadcn/ui when possible. Use mobile‑first responsive design and include appropriate ARIA roles and attributes where necessary. Avoid external JavaScript.',
    'If the description mentions specific elements (e.g., a carousel, navbar, form, card grid, hero section), construct an appropriate layout with multiple elements that follow good design principles. For example, when asked for a “hero” you should generate a full hero section with a prominent headline, subheading, call‑to‑action button and optional supporting media such as an image or illustration.',
    'For each editable piece of text or list, insert a placeholder like {{headline}} or {{items}} so that it can be customized later. Also provide a JSON `config` object under a `fields` key describing these placeholders (for example, a text field for a headline or a number field for width/height). Use ONLY Puck‑supported field types: text, textarea, number and select (when select, include an `options` array of {label, value}). Provide reasonable defaultValue for each field.',
    'When external data or back‑end services are required, define a tool with a clear description and a Zod‑validated input schema and return results via custom React components with loading, success and error states. However, avoid including <script> tags or inline event handlers in the HTML.',
    `Our library offers the following UI components: ${availableComponents}. When the description maps to one of these components, reuse it and expose its fields using placeholders and the config.`,
    'Return ONLY JSON with keys: code (HTML string), config (object describing fields) and docs (object with summary, fields and examples).',
  ].join('\n\n');
  const userPrompt = [
    `User description: ${enhancedDescription}`,
    `Options: ${JSON.stringify(options)}`,
  ].join('\n\n');

  // If the API key is absent, fail gracefully.  Without a key we cannot
  // call the OpenAI API.  This triggers a fallback in the route.
  if (!process.env.OPENAI_API_KEY) {
    return { code: '', error: 'OPENAI_API_KEY is not set in the environment' };
  }
  try {
    const payload = {
      model: process.env.OPENAI_MODEL_UI_GEN || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 1200,
      top_p: 1,
      n: 1,
    };
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text();
      return { code: '', error: `OpenAI API request failed: ${response.status} ${response.statusText} - ${text}` };
    }
    const data = await response.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) {
      return { code: '', error: 'No response from OpenAI model' };
    }
    let jsonString = content.trim();
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
    }
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseErr: any) {
      return { code: '', error: `Failed to parse AI response as JSON: ${parseErr.message || parseErr}` };
    }
    const code: string = String(parsed.code || '');
    const cfg: any = parsed.config;
    const docs: any = parsed.docs;
    return { code, config: cfg, docs };
  } catch (err: any) {
    return { code: '', error: err?.message || String(err) };
  }
}

/**
 * Modify an existing custom component using the Vercel AI SDK while preserving
 * its structure. The model receives the current HTML and a user description of
 * the desired enhancements and must return updated HTML that is additive and
 * non-destructive (do not remove existing elements or placeholders). The
 * resulting config, when present, is merged on the server with the existing
 * config so the old fields are preserved.
 */
export async function modifyCustomComponent(existingCode: string, description: string, options: any = {}): Promise<{ code: string; config?: any; docs?: any; error?: string }> {
  // Refine the user’s enhancement request using the prompt enhancer.  This
  // clarification step expands terse instructions into detailed, actionable
  // requirements.  If refinement fails, fall back to the original text.
  const improved = await refinePrompt(description || '');

  // Construct system instructions that enforce non‑destructive editing.  The
  // assistant must preserve the original structure and placeholders while
  // introducing new fields or styles.  It should insert new placeholders for
  // layout or styling rather than rewriting markup and follow accessible
  // patterns.  The final response must be JSON with code, config and docs.
  const systemPrompt = [
    'You are acting as a safe refactoring assistant for HTML UI components.',
    'You MUST preserve the existing structure and placeholders. Only enhance or add elements based on the request.',
    'When repositioning elements or adding styling options (e.g. flex/grid layouts), do not rewrite the markup. Instead, introduce new placeholders for layout or style properties (such as layout direction, gap, justifyContent, alignItems, order, width, height) and embed them into existing style or class attributes. These new fields allow the editor to control layout and sizing without altering the original HTML structure.',
    'When adding new elements, follow the same responsive patterns and styling conventions as the existing code (e.g. Tailwind CSS classes) and strive for accessible, semantic markup. Prefer accessible patterns and components from open‑source libraries like shadcn/ui when appropriate.',
    'Do not remove elements, classes, or placeholders unless explicitly told. Do not include <script> tags or inline event handlers.',
    'Return ONLY JSON with keys: code (full HTML string), config (optional) and docs (optional).',
  ].join('\n\n');
  const userPrompt = [
    'Existing HTML:',
    existingCode,
    '',
    `Enhancement request: ${improved}`,
    `Options: ${JSON.stringify(options)}`,
  ].join('\n');
  // Abort if no API key.  Without a key, we cannot call OpenAI and must
  // signal the error to the caller.
  if (!process.env.OPENAI_API_KEY) {
    return { code: '', error: 'OPENAI_API_KEY is not set in the environment' };
  }
  try {
    const payload = {
      model: process.env.OPENAI_MODEL_UI_MODIFY || process.env.OPENAI_MODEL_UI_GEN || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 1200,
      top_p: 1,
      n: 1,
    };
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text();
      return { code: '', error: `OpenAI API request failed: ${response.status} ${response.statusText} - ${text}` };
    }
    const data = await response.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) {
      return { code: '', error: 'No response from OpenAI model' };
    }
    let jsonString = content.trim();
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
    }
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseErr: any) {
      return { code: '', error: `Failed to parse AI response as JSON: ${parseErr.message || parseErr}` };
    }
    const code: string = String(parsed.code || existingCode || '');
    const cfg: any = parsed.config;
    const docs: any = parsed.docs;
    return { code, config: cfg, docs };
  } catch (err: any) {
    return { code: '', error: err?.message || String(err) };
  }
}

/**
 * Convert a React or JSX component to a Puck-friendly JSON representation.
 * This helper uses the Vercel AI SDK to transform arbitrary component code
 * into a static HTML fragment with placeholders and a corresponding config
 * describing the editable fields.  The returned object mirrors the shape
 * expected by generateCustomComponent/modifyCustomComponent: { code, config }.
 *
 * @param code A string of React/JSX component code to transform.
 * @returns A promise resolving to an object with HTML `code` and an optional `config`.
 */
export async function convertReactToPuckJson(code: string): Promise<{ code: string; config?: any }> {
  // Construct a prompt instructing the model to extract a static HTML
  // representation from the provided component.  The model must return a JSON
  // object with a `code` field containing the HTML and a `config.fields`
  // object describing any placeholders inferred from the component's props.
  const prompt = [
    'You are a converter that translates React/Next.js component code into a static HTML fragment for embedding in a CMS. Given the following component source, output a JSON object with two keys: `code` and `config`. The `code` value should be a string containing only HTML markup (no JSX, no JavaScript) with any dynamic values replaced by {{placeholders}}. For each placeholder you introduce, add a property under `config.fields` describing it using Puck field types (text, textarea, number, select). Provide sensible default values. Do not include script tags or event handlers.',
    'Component source:',
    code,
    '',
    'Return ONLY JSON with keys: code (HTML string) and config (object describing fields).',
  ].join('\n\n');
  const schema = z.object({ code: z.string(), config: z.any().optional() });
  const modelName = process.env.OPENAI_MODEL_UI_GEN || 'gpt-4o';
  const result = await generateObject({
    model: openai(modelName),
    prompt,
    schema,
  });
  const obj: any = result.object || {};
  return { code: String(obj.code || ''), config: obj.config };
}
