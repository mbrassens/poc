import { describe, expect, it } from 'vitest';
import { CompileError, compileRemoteComposeJson } from '../src/compiler.js';
import { WIDGET_PRESETS } from '../src/presets/index.js';

describe('compileRemoteComposeJson (json2rc)', () => {
  it.each(WIDGET_PRESETS)('compiles preset "$id" into valid .rc bytes', (preset) => {
    const result = compileRemoteComposeJson(preset.json);
    expect(result.rawSize).toBeGreaterThan(32);
    expect(result.compressedSize).toBeGreaterThan(16);
    expect(result.compressedSize).toBeLessThan(result.rawSize);
    expect(result.base64.length).toBeGreaterThan(32);
    expect(result.compileMs).toBeGreaterThanOrEqual(0);
  });

  it('compiles from a JSON string input', () => {
    const result = compileRemoteComposeJson(JSON.stringify(WIDGET_PRESETS[0].json));
    expect(result.rawSize).toBeGreaterThan(32);
  });

  it('throws CompileError on invalid JSON syntax', () => {
    expect(() => compileRemoteComposeJson('{ not valid json')).toThrow(CompileError);
  });

  it('throws CompileError on non-object JSON payload', () => {
    expect(() => compileRemoteComposeJson('[1, 2, 3]')).toThrow(CompileError);
  });
});
