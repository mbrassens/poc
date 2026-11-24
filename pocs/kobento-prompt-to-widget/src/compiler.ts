import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface Json2RcParserModule {
  convert: (input: string | Record<string, unknown>) => Uint8Array;
  compressDocument: (
    bytes: Uint8Array,
    deflate: (data: Uint8Array) => Uint8Array,
  ) => Uint8Array;
}

let cachedParser: Json2RcParserModule | null = null;

function loadParser(): Json2RcParserModule {
  if (cachedParser) return cachedParser;
  const parserPath = path.resolve(
    __dirname,
    '../vendor/kobento-tools/json2rc/build/Parser.js',
  );
  try {
    cachedParser = require(parserPath) as Json2RcParserModule;
    return cachedParser;
  } catch (err) {
    throw new Error(
      `Kobento json2rc compiler not found at ${parserPath}. Run "npm run setup" first. (${
        err instanceof Error ? err.message : String(err)
      })`,
    );
  }
}

export interface CompileResult {
  bytes: Uint8Array;
  compressedBytes: Uint8Array;
  base64: string;
  rawSize: number;
  compressedSize: number;
  compileMs: number;
}

export class CompileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CompileError';
  }
}

export function compileRemoteComposeJson(
  input: string | Record<string, unknown>,
): CompileResult {
  const parser = loadParser();
  const start = performance.now();

  let parsed: Record<string, unknown>;
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input) as Record<string, unknown>;
    } catch (err) {
      throw new CompileError(
        `Invalid JSON syntax: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  } else {
    parsed = input;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new CompileError('RemoteCompose document must be a JSON object.');
  }

  try {
    const raw = parser.convert(parsed);
    const bytes = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
    const compressed = parser.compressDocument(bytes, (b) =>
      zlib.deflateSync(Buffer.from(b)),
    );
    const compressedBytes =
      compressed instanceof Uint8Array ? compressed : new Uint8Array(compressed);
    const compileMs = Number((performance.now() - start).toFixed(2));

    return {
      bytes,
      compressedBytes,
      base64: Buffer.from(bytes).toString('base64'),
      rawSize: bytes.byteLength,
      compressedSize: compressedBytes.byteLength,
      compileMs,
    };
  } catch (err) {
    throw new CompileError(
      err instanceof Error ? err.message : String(err),
    );
  }
}
