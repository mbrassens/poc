import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createStudioServer } from '../src/server.js';
import { WIDGET_PRESETS } from '../src/presets/index.js';

describe('Studio HTTP server', () => {
  const server = createStudioServer();
  let baseUrl = '';

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('GET /api/health returns ok and generator mode', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; mode: string; presets: number };
    expect(body.ok).toBe(true);
    expect(['offline', 'gemini', 'openai']).toContain(body.mode);
    expect(body.presets).toBe(WIDGET_PRESETS.length);
  });

  it('GET /api/presets returns curated presets', async () => {
    const res = await fetch(`${baseUrl}/api/presets`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; presets: Array<{ id: string }> };
    expect(body.ok).toBe(true);
    expect(body.presets.map((p) => p.id)).toContain('pomodoro');
  });

  it('POST /api/compile compiles valid RemoteCompose JSON to base64 .rc', async () => {
    const res = await fetch(`${baseUrl}/api/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ json: WIDGET_PRESETS[0].json }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; rawSize: number; base64: string };
    expect(body.ok).toBe(true);
    expect(body.rawSize).toBeGreaterThan(32);
    expect(body.base64.length).toBeGreaterThan(32);
  });

  it('POST /api/compile returns 422 for malformed JSON', async () => {
    const res = await fetch(`${baseUrl}/api/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ json: '{bad json' }),
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toContain('Invalid JSON');
  });

  it('POST /api/generate produces a compiled .rc widget for a prompt', async () => {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Create a flight boarding pass card' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      presetId: string | null;
      rawSize: number;
      base64: string;
    };
    expect(body.ok).toBe(true);
    expect(body.presetId).toBe('boarding-pass');
    expect(body.rawSize).toBeGreaterThan(32);
  });

  it('serves the vendored kobento-ts web player bundle', async () => {
    const res = await fetch(`${baseUrl}/vendor/kobento-player.js`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('RcdPlayer');
  });
});
