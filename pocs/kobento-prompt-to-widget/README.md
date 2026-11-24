# Kobento Prompt-to-Widget Studio

- **Status:** `in-progress`
- **Date:** 2026-11-24
- **Stack:** TypeScript, Node.js 22, `esbuild`, `vitest`, Kobento (`kobento-ts` + `kobento-tools/json2rc`)
- **Reference:** [mcp.kobento.dev](https://mcp.kobento.dev/) · [kobento/kobento-ts](https://github.com/kobento/kobento-ts) · [kobento/kobento-tools](https://github.com/kobento/kobento-tools)

## Goal & Hypothesis

Validate **AI-generated Server-Driven UI** using AndroidX/Kobento's **RemoteCompose (`.rc`)** binary format:
- A server/LLM generates declarative RemoteCompose JSON, compiles it to a compact `.rc` binary with `json2rc`, and streams it to a sandboxed `<canvas>` player (`kobento-ts`) — **no client-side `eval`, no arbitrary HTML/JS execution**.
- Live state updates and button tap callbacks flow bidirectionally over `RC.createHostApi(player)` without recompiling or resending the UI tree.

## Architecture

- **Backend (`src/server.ts`, `src/compiler.ts`, `src/generator.ts`):**
  - Compiles RemoteCompose JSON → `.rc` binary bytes in-process via `kobento-tools/json2rc` (`convert` + `compressDocument`).
  - Supports optional LLM generation (`GEMINI_API_KEY` or `OPENAI_API_KEY` in `.env`) with an automatic up-to-3-attempt compile-verify-repair loop when `json2rc` rejects an invalid op.
  - Ships with 4 interactive offline presets (`src/presets/index.ts`) so the studio works immediately with zero API keys: **Pomodoro Focus Timer**, **Flight Boarding Pass**, **System Telemetry Gauge**, and **Tip & Split Calculator**.
- **Web Studio (`src/public/`):**
  - Prompt bar + preset quick-picks + editable RemoteCompose JSON pane.
  - Live `kobento-ts` `<canvas>` stage with viewport presets (Widget / Card / Square / Panel), raw vs. compressed `.rc` byte telemetry, and `.rc` binary download.
  - Dynamic **Host API Inspector** wired to `RC.createHostApi(player)` — auto-generates live controls (sliders, text inputs, color pickers) for every exported variable and logs `hostNamedAction` button taps in real time.

## Setup & Run

Run all commands from this directory (`pocs/kobento-prompt-to-widget/`):

```bash
# 1. Install local dev dependencies
npm install

# 2. Fetch pinned kobento-ts + kobento-tools into gitignored vendor/ and build artifacts
npm run setup

# 3. (Optional) Configure an LLM API key for live prompt generation
cp .env.example .env

# 4. Build client bundle and start the studio server (default: http://localhost:4173)
npm run dev
```

## Verification

```bash
# Typecheck & bundle client
npm run build

# Run compiler + HTTP server tests
npm test
```

## Findings & Takeaways

- **Tiny binary payloads:** Rich interactive cards with canvas arcs, layout trees, and exported variables compile to ~1–2 KB raw `.rc` (and ~500–800 bytes compressed).
- **Strict compiler = great LLM guardrail:** `json2rc` throws explicit errors on unknown ops or invalid properties instead of silently failing, making a compile-verify-repair loop reliable.
- **Clean host/UI separation:** `RC.createHostApi(player)` lets the host push 60 fps variable updates (sliders, countdown ticks, color themes) and handle `hostNamedAction` button taps without touching or recompiling the `.rc` document.
- **Next steps to explore:** Connect directly to `mcp.kobento.dev`'s MCP catalog for richer components, add `kobento-net` push-to-device delivery (desktop `rcviewer` / Android / ESP32), or export standalone single-file HTML widgets.
