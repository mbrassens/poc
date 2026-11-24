import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CompileError, compileRemoteComposeJson } from './compiler.js';
import { detectGeneratorMode, generateWidgetFromPrompt } from './generator.js';
import { WIDGET_PRESETS } from './presets/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POC_ROOT = path.resolve(__dirname, '..');

function loadDotEnvIfPresent(): void {
  const envPath = path.join(POC_ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
}

function sendJson(res: http.ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendFile(
  res: http.ServerResponse,
  filePath: string,
  contentType: string,
): void {
  if (!fs.existsSync(filePath)) {
    sendJson(res, 404, { error: `File not found: ${path.basename(filePath)}` });
    return;
  }
  const content = fs.readFileSync(filePath);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': content.byteLength,
    'Cache-Control': 'no-cache',
  });
  res.end(content);
}

async function readJsonBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.byteLength;
    if (total > 2 * 1024 * 1024) {
      throw new Error('Request payload too large (max 2MB).');
    }
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

export function createStudioServer(): http.Server {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const method = req.method ?? 'GET';

    try {
      if (method === 'GET' && url.pathname === '/api/health') {
        const mode = detectGeneratorMode();
        sendJson(res, 200, {
          ok: true,
          mode,
          presets: WIDGET_PRESETS.length,
        });
        return;
      }

      if (method === 'GET' && url.pathname === '/api/presets') {
        sendJson(res, 200, {
          ok: true,
          presets: WIDGET_PRESETS,
        });
        return;
      }

      if (method === 'POST' && url.pathname === '/api/compile') {
        const body = await readJsonBody(req);
        const input = body.json;
        if (typeof input !== 'string' && (typeof input !== 'object' || input === null)) {
          sendJson(res, 400, { ok: false, error: 'Missing "json" field in request body.' });
          return;
        }
        const compiled = compileRemoteComposeJson(input as string | Record<string, unknown>);
        sendJson(res, 200, {
          ok: true,
          base64: compiled.base64,
          rawSize: compiled.rawSize,
          compressedSize: compiled.compressedSize,
          compileMs: compiled.compileMs,
        });
        return;
      }

      if (method === 'POST' && url.pathname === '/api/generate') {
        const body = await readJsonBody(req);
        const prompt = typeof body.prompt === 'string' ? body.prompt : '';
        if (!prompt.trim()) {
          sendJson(res, 400, { ok: false, error: 'Prompt is required.' });
          return;
        }
        const result = await generateWidgetFromPrompt(prompt);
        sendJson(res, 200, {
          ok: true,
          mode: result.mode,
          source: result.source,
          attempts: result.attempts,
          presetId: result.presetId ?? null,
          json: result.json,
          base64: result.compiled.base64,
          rawSize: result.compiled.rawSize,
          compressedSize: result.compiled.compressedSize,
          compileMs: result.compiled.compileMs,
        });
        return;
      }

      if (method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
        sendFile(res, path.join(POC_ROOT, 'src/public/index.html'), 'text/html; charset=utf-8');
        return;
      }

      if (method === 'GET' && url.pathname === '/styles.css') {
        sendFile(res, path.join(POC_ROOT, 'src/public/styles.css'), 'text/css; charset=utf-8');
        return;
      }

      if (method === 'GET' && url.pathname === '/app.js') {
        sendFile(res, path.join(POC_ROOT, 'dist/public/app.js'), 'application/javascript; charset=utf-8');
        return;
      }

      if (method === 'GET' && url.pathname === '/app.js.map') {
        sendFile(res, path.join(POC_ROOT, 'dist/public/app.js.map'), 'application/json; charset=utf-8');
        return;
      }

      if (method === 'GET' && url.pathname === '/vendor/kobento-player.js') {
        sendFile(
          res,
          path.join(POC_ROOT, 'vendor/kobento-ts/web-player/bundle.js'),
          'application/javascript; charset=utf-8',
        );
        return;
      }

      sendJson(res, 404, { ok: false, error: `Route not found: ${method} ${url.pathname}` });
    } catch (err) {
      const status = err instanceof CompileError ? 422 : 500;
      sendJson(res, status, {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });
}

const isEntrypoint =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  loadDotEnvIfPresent();
  const port = Number(process.env.PORT || 4173);
  const server = createStudioServer();
  server.listen(port, () => {
    const mode = detectGeneratorMode();
    console.log(`Kobento Prompt-to-Widget Studio running on http://localhost:${port} (mode: ${mode})`);
  });
}
