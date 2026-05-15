# PixelContext

[![Auto Release](https://img.shields.io/github/actions/workflow/status/kowshik24/pixelcontext/release.yml?branch=main&label=release&logo=github)](https://github.com/kowshik24/pixelcontext/actions/workflows/release.yml)
[![Pages](https://img.shields.io/github/actions/workflow/status/kowshik24/pixelcontext/pages.yml?branch=main&label=pages&logo=github)](https://github.com/kowshik24/pixelcontext/actions/workflows/pages.yml)
[![Latest Release](https://img.shields.io/github/v/release/kowshik24/pixelcontext?label=latest%20release)](https://github.com/kowshik24/pixelcontext/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

Capture UI context from any webpage and export production-quality, AI-ready Markdown prompts.

PixelContext is a browser extension for engineers, designers, and product teams who need fast, structured UI feedback for debugging, implementation, and AI-assisted workflows.

## Demo

![PixelContext Demo](./docs/demo.gif)

If the GIF does not render in your client, view `docs/demo.gif` directly on GitHub.

## Why PixelContext

Most feedback on UI bugs or improvements is incomplete: screenshots without selectors, notes without CSS context, or vague issue descriptions.

PixelContext solves this by turning every click into a structured capture package:

- human note
- target path/selector
- HTML snippet
- matching CSS rules (when accessible)
- computed style subset
- screenshot preview + reference ID

Then it exports everything into one copyable Markdown prompt for AI tools or issue trackers.

## Features

- `Ctrl/Cmd + Shift + X` capture mode toggle
- quick composer after element click
- persistent per-page capture history
- re-highlight captured elements
- edit notes and delete captures
- one-click Markdown export to clipboard
- fully client-side (no backend, no API key)

## Quick Start

### Prerequisites

- Node.js 18+
- npm
- Chrome (Manifest V3)

### Install & Run (Development)

```bash
npm install
npm run dev
```

Load in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `build/chrome-mv3-dev`

### Build (Production)

```bash
npm run build
```

Load production extension from:

- `build/chrome-mv3-prod`

## Usage

1. Click the extension icon to show/hide sidebar.
2. Turn capture mode on (`Turn On`) or use shortcut.
3. Click any UI element.
4. Add note in quick composer and press `Enter`.
5. Repeat for multiple captures.
6. Click **Export Markdown** to copy the final prompt.

## Keyboard Shortcuts

- `Ctrl/Cmd + Shift + X` -> toggle capture mode
- `Enter` (inside composer) -> save capture
- `Esc` (inside composer) -> close composer

## Export Format

Each capture in export includes:

- capture reference ID
- timestamp
- DOM path
- screenshot dimensions
- note
- HTML block
- CSS rules block
- computed styles block

This format is designed to be directly usable in LLM chats, issue templates, and implementation handoff docs.

## Project Structure

```text
pixelcontext/
├── assets/                 # Icons and extension assets
├── contents/               # Injected page scripts (overlay + sidebar)
├── core/                   # Capture, CSS extraction, storage, prompt builder
├── docs/                   # Project site/demo assets
├── .github/workflows/      # Pages + auto release workflows
└── popup.tsx/background.ts # Extension entrypoints
```

## Privacy & Security

- PixelContext runs entirely in the browser.
- Captures are stored locally in extension storage.
- No remote API calls for capture data.
- Data leaves your machine only when you explicitly copy/export/share it.

## Troubleshooting

- WebSocket `localhost:1815` in dev:
  - keep `npm run dev` running
  - reload extension and refresh page
- Styles not updating after changes:
  - reload extension from `chrome://extensions`
  - refresh current tab
- Capture not triggering:
  - confirm capture mode is ON
  - avoid restricted browser pages (`chrome://*`)

## Roadmap

- framework-aware metadata extraction (React/Vue)
- richer export targets (GitHub issues, Linear, Notion)
- multi-page session capture
- collaboration/share workflows

## Contributing

Contributions are welcome.

1. Fork repo
2. Create feature branch
3. Commit with clear message
4. Open PR with screenshots or short demo

## License

MIT - see [LICENSE](./LICENSE).
