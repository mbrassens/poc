import { compileRemoteComposeJson, type CompileResult } from './compiler.js';
import { matchPresetForPrompt, WIDGET_PRESETS } from './presets/index.js';

export type GeneratorMode = 'gemini' | 'openai' | 'offline';

export interface GenerationOutput {
  mode: GeneratorMode;
  source: string;
  attempts: number;
  presetId?: string;
  json: Record<string, unknown>;
  compiled: CompileResult;
}

export function detectGeneratorMode(env: NodeJS.ProcessEnv = process.env): GeneratorMode {
  if (env.GEMINI_API_KEY?.trim()) return 'gemini';
  if (env.OPENAI_API_KEY?.trim()) return 'openai';
  return 'offline';
}

const SYSTEM_PROMPT = `You are a RemoteCompose (.rc) UI author for Kobento.
Return ONLY a single valid JSON object (no markdown fences, no commentary) that compiles cleanly with Kobento's json2rc compiler.

Strict schema rules:
- Top-level keys: "header", optional "resources", and "root" (array).
- "header": { "apiLevel": 7, "width": 380, "height": 460, "profiles": 513 }
- "resources": { "variables": { "<name>": { "value": <number>, "export": true } }, "colors": { "<name>": "#AARRGGBB" } }
- String variables go in "root" before layout nodes: { "variable": { "name": "<name>", "vtype": "string", "value": "Hello", "export": true } }
- Layout nodes: "column", "row", "box", "spacer", "text", "canvas".
- Modifiers array: "fillMaxSize", "fillMaxWidth", "fillMaxHeight", { "size": [w, h] }, { "width": n }, { "height": n }, { "padding": n }, { "background": "#AARRGGBB" or "@colorName" }, { "clip": { "type": "roundedRect", "radius": 12 } }, { "onClick": { "type": "hostNamedAction", "name": "action_name", "value": "payload" } }.
- Colors MUST be 8-digit hex "#AARRGGBB" (e.g. "#FF6366F1") or "@colorName".
- Reference variables in text with "@varName" and in canvas expressions with bare variable names (e.g. "progress * 360").
- Always export 2-4 meaningful variables and at least 1 interactive hostNamedAction button so the host inspector can drive the widget live.

Minimal valid example:
${JSON.stringify(WIDGET_PRESETS[0].json)}`;

function extractJsonObject(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Model response did not contain a JSON object.');
  }
  return JSON.parse(candidate.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
}

async function callGemini(prompt: string, env: NodeJS.ProcessEnv): Promise<string> {
  const apiKey = env.GEMINI_API_KEY!.trim();
  const model = env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini API returned an empty response.');
  return text;
}

async function callOpenAI(prompt: string, env: NodeJS.ProcessEnv): Promise<string> {
  const apiKey = env.OPENAI_API_KEY!.trim();
  const model = env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI API returned an empty response.');
  return text;
}

export async function generateWidgetFromPrompt(
  prompt: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<GenerationOutput> {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) {
    throw new Error('Prompt cannot be empty.');
  }

  const mode = detectGeneratorMode(env);

  if (mode === 'offline') {
    const preset = matchPresetForPrompt(cleanPrompt);
    const cloned = structuredClone(preset.json);
    const compiled = compileRemoteComposeJson(cloned);
    return {
      mode: 'offline',
      source: `offline preset (${preset.title})`,
      attempts: 1,
      presetId: preset.id,
      json: cloned,
      compiled,
    };
  }

  let currentPrompt = `Create a RemoteCompose widget for: ${cleanPrompt}`;
  let lastError = 'Unknown generation error';

  for (let attempt = 1; attempt <= 3; attempt++) {
    const raw =
      mode === 'gemini'
        ? await callGemini(currentPrompt, env)
        : await callOpenAI(currentPrompt, env);

    try {
      const json = extractJsonObject(raw);
      const compiled = compileRemoteComposeJson(json);
      return {
        mode,
        source: `${mode} (attempt ${attempt})`,
        attempts: attempt,
        json,
        compiled,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      currentPrompt = `Your previous RemoteCompose JSON failed json2rc validation with this error:\n${lastError}\n\nFix the JSON and return ONLY the corrected valid RemoteCompose JSON object for: ${cleanPrompt}`;
    }
  }

  throw new Error(`Failed to generate valid RemoteCompose JSON after 3 attempts: ${lastError}`);
}
