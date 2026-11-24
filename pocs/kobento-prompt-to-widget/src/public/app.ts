interface KobentoHostApi {
  variables(): Record<string, string>;
  get(name: string): unknown;
  set(name: string, value: unknown): boolean;
  onAction(name: string, cb: (value: unknown, actionName: string) => void): () => void;
  onChange(name: string, cb: (value: unknown) => void): () => void;
  dispose(): void;
}

interface KobentoRcdPlayer {
  loadFromArrayBuffer(data: ArrayBuffer): Promise<unknown>;
  setDensity(density: number): void;
  resize(width: number, height: number): void;
  repaint(): void;
  stop(): void;
}

interface KobentoGlobal {
  RcdPlayer: new (canvas: HTMLCanvasElement) => KobentoRcdPlayer;
  createHostApi: (player: KobentoRcdPlayer) => KobentoHostApi;
}

export {};

declare global {
  interface Window {
    RC?: KobentoGlobal;
  }
}

interface PresetInfo {
  id: string;
  title: string;
  description: string;
  viewport: { width: number; height: number };
  json: Record<string, unknown>;
}

interface CompileResponse {
  ok: boolean;
  base64?: string;
  rawSize?: number;
  compressedSize?: number;
  compileMs?: number;
  source?: string;
  mode?: string;
  presetId?: string | null;
  json?: Record<string, unknown>;
  error?: string;
}

const el = {
  modeBadge: document.getElementById('mode-badge') as HTMLSpanElement,
  promptForm: document.getElementById('prompt-form') as HTMLFormElement,
  promptInput: document.getElementById('prompt-input') as HTMLInputElement,
  generateBtn: document.getElementById('generate-btn') as HTMLButtonElement,
  presetBar: document.getElementById('preset-bar') as HTMLDivElement,
  jsonEditor: document.getElementById('json-editor') as HTMLTextAreaElement,
  formatBtn: document.getElementById('format-btn') as HTMLButtonElement,
  compileBtn: document.getElementById('compile-btn') as HTMLButtonElement,
  statusBanner: document.getElementById('status-banner') as HTMLDivElement,
  canvas: document.getElementById('rc-canvas') as HTMLCanvasElement,
  statRaw: document.getElementById('stat-raw') as HTMLElement,
  statCompressed: document.getElementById('stat-compressed') as HTMLElement,
  statMs: document.getElementById('stat-ms') as HTMLElement,
  statSource: document.getElementById('stat-source') as HTMLElement,
  downloadBtn: document.getElementById('download-btn') as HTMLButtonElement,
  variablesList: document.getElementById('variables-list') as HTMLDivElement,
  eventLog: document.getElementById('event-log') as HTMLUListElement,
  clearLogBtn: document.getElementById('clear-log-btn') as HTMLButtonElement,
  vpButtons: Array.from(document.querySelectorAll<HTMLButtonElement>('.vp-btn')),
};

let player: KobentoRcdPlayer | null = null;
let hostApi: KobentoHostApi | null = null;
let lastRcBytes: Uint8Array | null = null;
let presets: PresetInfo[] = [];
let activePresetId: string | null = null;
let currentViewport = { width: 380, height: 460 };

// Interactive host timer state for the Pomodoro preset
let timerInterval: number | null = null;
let timerSecondsLeft = 18 * 60;
const TIMER_TOTAL_SECONDS = 25 * 60;

// Gate cycle for Boarding Pass preset
const GATES = ['G14', 'B07', 'A12', 'C22'];
let gateIndex = 0;

function stopTimerLoop(): void {
  if (timerInterval !== null) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
}

function showStatus(message: string, kind: 'error' | 'info'): void {
  el.statusBanner.textContent = message;
  el.statusBanner.className = `status-banner ${kind}`;
}

function hideStatus(): void {
  el.statusBanner.className = 'status-banner hidden';
  el.statusBanner.textContent = '';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function base64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

function argbToCssHex(argb: string): string {
  const clean = argb.replace('#', '');
  if (clean.length === 8) return `#${clean.slice(2)}`;
  if (clean.length === 6) return `#${clean}`;
  return '#6366f1';
}

function cssHexToArgb(hex: string): string {
  const clean = hex.replace('#', '').toUpperCase();
  return `#FF${clean}`;
}

function logEvent(text: string, isAction = false): void {
  const li = document.createElement('li');
  li.className = `event-item${isAction ? ' event-action' : ''}`;
  const ts = new Date().toLocaleTimeString([], { hour12: false });
  li.innerHTML = `<span class="event-time">${ts}</span>${escapeHtml(text)}`;
  el.eventLog.prepend(li);
  while (el.eventLog.children.length > 60) {
    el.eventLog.lastElementChild?.remove();
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function applyViewport(width: number, height: number): void {
  currentViewport = { width, height };
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  el.canvas.width = Math.round(width * dpr);
  el.canvas.height = Math.round(height * dpr);
  el.canvas.style.width = `${width}px`;
  el.canvas.style.height = `${height}px`;

  if (player) {
    player.setDensity(dpr);
    player.resize(el.canvas.width, el.canvas.height);
  }

  for (const btn of el.vpButtons) {
    const bw = Number(btn.dataset.w);
    const bh = Number(btn.dataset.h);
    btn.classList.toggle('active', bw === width && bh === height);
  }
}

function updateTipOutputs(host: KobentoHostApi): void {
  const bill = Number(host.get('bill') ?? 84);
  const tipPct = Number(host.get('tipPct') ?? 18);
  const people = Math.max(1, Math.round(Number(host.get('people') ?? 2)));
  const total = bill * (1 + tipPct / 100);
  const perPerson = total / people;
  host.set('perPersonText', `$${perPerson.toFixed(2)}`);
  host.set(
    'summaryText',
    `$${bill.toFixed(2)} bill · ${Math.round(tipPct)}% tip · ${people} ${people === 1 ? 'person' : 'people'}`,
  );
}

function updateTelemetryLabels(host: KobentoHostApi): void {
  const cpu = Number(host.get('cpuLoad'));
  const mem = Number(host.get('memLoad'));
  if (!Number.isNaN(cpu)) host.set('cpuText', `${Math.round(cpu * 100)}%`);
  if (!Number.isNaN(mem)) host.set('memText', `${Math.round(mem * 100)}%`);
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function wireInteractiveHostHooks(host: KobentoHostApi): void {
  host.onAction('*', (value, actionName) => {
    logEvent(`action "${actionName}" (${JSON.stringify(value)})`, true);

    if (actionName === 'timer_toggle') {
      if (timerInterval !== null) {
        stopTimerLoop();
        host.set('ctaLabel', 'Resume Timer');
        host.set('phase', 'PAUSED');
      } else {
        host.set('ctaLabel', 'Pause Timer');
        host.set('phase', 'RUNNING');
        timerInterval = window.setInterval(() => {
          timerSecondsLeft = Math.max(0, timerSecondsLeft - 1);
          host.set('timeLabel', formatTimer(timerSecondsLeft));
          host.set('progress', timerSecondsLeft / TIMER_TOTAL_SECONDS);
          if (timerSecondsLeft === 0) {
            stopTimerLoop();
            host.set('phase', 'COMPLETE');
            host.set('ctaLabel', 'Done!');
          }
          renderVariablesPanel(host);
        }, 1000);
      }
      renderVariablesPanel(host);
    } else if (actionName === 'timer_reset') {
      stopTimerLoop();
      timerSecondsLeft = TIMER_TOTAL_SECONDS;
      host.set('timeLabel', formatTimer(timerSecondsLeft));
      host.set('progress', 1.0);
      host.set('phase', 'DEEP FOCUS');
      host.set('ctaLabel', 'Start Timer');
      renderVariablesPanel(host);
    } else if (actionName === 'boarding_checkin') {
      host.set('status', 'BOARDED · SEAT CONFIRMED');
      host.set('boardingPct', 1.0);
      renderVariablesPanel(host);
    } else if (actionName === 'boarding_gate_change') {
      gateIndex = (gateIndex + 1) % GATES.length;
      host.set('gate', GATES[gateIndex]);
      host.set('status', `GATE UPDATED → ${GATES[gateIndex]}`);
      renderVariablesPanel(host);
    } else if (actionName === 'telemetry_spike') {
      const nextCpu = Number((0.7 + Math.random() * 0.25).toFixed(2));
      const nextMem = Number((0.72 + Math.random() * 0.22).toFixed(2));
      host.set('cpuLoad', nextCpu);
      host.set('memLoad', nextMem);
      updateTelemetryLabels(host);
      renderVariablesPanel(host);
    } else if (actionName === 'tip_set') {
      const nextTip = Number(value);
      if (!Number.isNaN(nextTip)) {
        host.set('tipPct', nextTip);
        updateTipOutputs(host);
        renderVariablesPanel(host);
      }
    } else if (actionName === 'split_delta') {
      const delta = Number(value);
      const current = Number(host.get('people') ?? 2);
      const next = Math.max(1, Math.min(20, current + (Number.isNaN(delta) ? 0 : delta)));
      host.set('people', next);
      updateTipOutputs(host);
      renderVariablesPanel(host);
    }
  });
}

function renderVariablesPanel(host: KobentoHostApi): void {
  const vars = host.variables();
  const entries = Object.entries(vars);
  el.variablesList.innerHTML = '';

  if (entries.length === 0) {
    el.variablesList.innerHTML =
      '<p class="empty-state">This document does not export any named variables.</p>';
    return;
  }

  for (const [name, vtype] of entries) {
    const current = host.get(name);
    const row = document.createElement('div');
    row.className = 'var-row';

    const meta = document.createElement('div');
    meta.className = 'var-meta';
    meta.innerHTML = `<span class="var-name">@${escapeHtml(name)}</span><span class="var-type">${escapeHtml(vtype)}</span>`;

    const ctrl = document.createElement('div');
    ctrl.className = 'var-control';

    if (vtype === 'color') {
      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = argbToCssHex(String(current ?? '#FF6366F1'));
      const hexLabel = document.createElement('input');
      hexLabel.type = 'text';
      hexLabel.value = String(current ?? '#FF6366F1');

      colorInput.addEventListener('input', () => {
        const argb = cssHexToArgb(colorInput.value);
        hexLabel.value = argb;
        host.set(name, argb);
      });
      hexLabel.addEventListener('change', () => {
        if (host.set(name, hexLabel.value)) {
          colorInput.value = argbToCssHex(hexLabel.value);
        }
      });

      ctrl.append(colorInput, hexLabel);
    } else if (vtype === 'float' || vtype === 'int') {
      const numVal = typeof current === 'number' ? current : 0;
      const isNormalized = numVal >= 0 && numVal <= 1 && vtype === 'float';

      if (isNormalized) {
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '1';
        slider.step = '0.01';
        slider.value = String(numVal);

        const readout = document.createElement('input');
        readout.type = 'number';
        readout.step = '0.01';
        readout.style.maxWidth = '74px';
        readout.value = numVal.toFixed(2);

        const applyFloat = (v: number) => {
          host.set(name, v);
          if (name === 'cpuLoad' || name === 'memLoad') {
            updateTelemetryLabels(host);
          }
        };

        slider.addEventListener('input', () => {
          const v = Number(slider.value);
          readout.value = v.toFixed(2);
          applyFloat(v);
        });
        readout.addEventListener('change', () => {
          const v = Number(readout.value);
          if (!Number.isNaN(v)) {
            slider.value = String(Math.max(0, Math.min(1, v)));
            applyFloat(v);
          }
        });

        ctrl.append(slider, readout);
      } else {
        const numInput = document.createElement('input');
        numInput.type = 'number';
        numInput.step = vtype === 'int' ? '1' : '0.5';
        numInput.value = String(numVal);
        numInput.addEventListener('input', () => {
          const v = Number(numInput.value);
          if (!Number.isNaN(v)) {
            host.set(name, v);
            if (name === 'bill' || name === 'tipPct' || name === 'people') {
              updateTipOutputs(host);
            }
          }
        });
        ctrl.append(numInput);
      }
    } else {
      const textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.value = String(current ?? '');
      textInput.addEventListener('input', () => {
        host.set(name, textInput.value);
      });
      ctrl.append(textInput);
    }

    row.append(meta, ctrl);
    el.variablesList.append(row);
  }
}

async function loadCompiledWidget(res: CompileResponse, sourceLabel: string): Promise<void> {
  if (!res.ok || !res.base64) {
    showStatus(res.error || 'Compilation failed.', 'error');
    return;
  }

  const RC = window.RC;
  if (!RC) {
    showStatus('Kobento player bundle (/vendor/kobento-player.js) failed to load.', 'error');
    return;
  }

  hideStatus();
  stopTimerLoop();

  if (!player) {
    player = new RC.RcdPlayer(el.canvas);
    applyViewport(currentViewport.width, currentViewport.height);
  }
  const activePlayer = player;

  if (hostApi) {
    hostApi.dispose();
    hostApi = null;
  }

  const bytes = base64ToUint8Array(res.base64);
  lastRcBytes = bytes;
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

  await activePlayer.loadFromArrayBuffer(buf);

  const activeHost = RC.createHostApi(activePlayer);
  hostApi = activeHost;
  wireInteractiveHostHooks(activeHost);

  // Give HostApi a tick to scan the loaded document's named variables
  window.setTimeout(() => {
    if (hostApi === activeHost) renderVariablesPanel(activeHost);
  }, 40);

  el.statRaw.textContent = formatBytes(res.rawSize ?? bytes.byteLength);
  el.statCompressed.textContent = formatBytes(res.compressedSize ?? bytes.byteLength);
  el.statMs.textContent = `${res.compileMs ?? 0} ms`;
  el.statSource.textContent = sourceLabel;
  el.downloadBtn.disabled = false;

  logEvent(`loaded .rc (${formatBytes(bytes.byteLength)}) from ${sourceLabel}`);
}

async function compileEditorJson(sourceLabel = 'editor'): Promise<void> {
  try {
    const response = await fetch('/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ json: el.jsonEditor.value }),
    });
    const data = (await response.json()) as CompileResponse;
    await loadCompiledWidget(data, sourceLabel);
  } catch (err) {
    showStatus(err instanceof Error ? err.message : String(err), 'error');
  }
}

function selectPreset(preset: PresetInfo): void {
  activePresetId = preset.id;
  for (const pill of el.presetBar.querySelectorAll<HTMLButtonElement>('.preset-pill')) {
    pill.classList.toggle('active', pill.dataset.id === preset.id);
  }
  applyViewport(preset.viewport.width, preset.viewport.height);
  el.jsonEditor.value = JSON.stringify(preset.json, null, 2);
  void compileEditorJson(`preset:${preset.id}`);
}

async function bootstrap(): Promise<void> {
  applyViewport(currentViewport.width, currentViewport.height);

  try {
    const [healthRes, presetsRes] = await Promise.all([
      fetch('/api/health').then((r) => r.json() as Promise<{ mode: string }>),
      fetch('/api/presets').then((r) => r.json() as Promise<{ presets: PresetInfo[] }>),
    ]);

    if (healthRes.mode === 'offline') {
      el.modeBadge.textContent = 'Mode: Offline Presets';
      el.modeBadge.className = 'badge badge-warn';
    } else {
      el.modeBadge.textContent = `Mode: ${healthRes.mode.toUpperCase()} + Verify Loop`;
      el.modeBadge.className = 'badge badge-ok';
    }

    presets = presetsRes.presets || [];
    el.presetBar.innerHTML = '';
    for (const preset of presets) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset-pill';
      btn.dataset.id = preset.id;
      btn.textContent = preset.title;
      btn.title = preset.description;
      btn.addEventListener('click', () => selectPreset(preset));
      el.presetBar.append(btn);
    }

    if (presets.length > 0) {
      selectPreset(presets[0]);
    }
  } catch (err) {
    showStatus(`Failed to initialize studio: ${err instanceof Error ? err.message : String(err)}`, 'error');
  }
}

el.promptForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const prompt = el.promptInput.value.trim();
  if (!prompt) return;

  el.generateBtn.disabled = true;
  el.generateBtn.textContent = 'Generating…';
  showStatus('Generating RemoteCompose JSON and verifying with json2rc…', 'info');

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = (await res.json()) as CompileResponse;
    if (!data.ok) {
      showStatus(data.error || 'Generation failed.', 'error');
      return;
    }

    if (data.json) {
      el.jsonEditor.value = JSON.stringify(data.json, null, 2);
      const header = data.json.header as { width?: number; height?: number } | undefined;
      if (header?.width && header?.height) {
        applyViewport(header.width, header.height);
      }
    }

    activePresetId = data.presetId ?? null;
    for (const pill of el.presetBar.querySelectorAll<HTMLButtonElement>('.preset-pill')) {
      pill.classList.toggle('active', pill.dataset.id === activePresetId);
    }

    await loadCompiledWidget(data, data.source || 'generated');
  } catch (err) {
    showStatus(err instanceof Error ? err.message : String(err), 'error');
  } finally {
    el.generateBtn.disabled = false;
    el.generateBtn.textContent = 'Generate Widget';
  }
});

el.compileBtn.addEventListener('click', () => {
  void compileEditorJson('editor');
});

el.formatBtn.addEventListener('click', () => {
  try {
    const parsed = JSON.parse(el.jsonEditor.value);
    el.jsonEditor.value = JSON.stringify(parsed, null, 2);
    hideStatus();
  } catch (err) {
    showStatus(`JSON syntax error: ${err instanceof Error ? err.message : String(err)}`, 'error');
  }
});

el.downloadBtn.addEventListener('click', () => {
  if (!lastRcBytes) return;
  const copy = new Uint8Array(lastRcBytes.byteLength);
  copy.set(lastRcBytes);
  const blob = new Blob([copy], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${activePresetId || 'widget'}.rc`;
  a.click();
  URL.revokeObjectURL(url);
});

el.clearLogBtn.addEventListener('click', () => {
  el.eventLog.innerHTML = '';
});

for (const btn of el.vpButtons) {
  btn.addEventListener('click', () => {
    const w = Number(btn.dataset.w);
    const h = Number(btn.dataset.h);
    applyViewport(w, h);
  });
}

void bootstrap();
