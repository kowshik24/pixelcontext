# PixelContext

PixelContext is a client-side browser extension for capturing UI context and exporting AI-ready Markdown prompts.

## MVP Features

- Toggle capture mode with `Ctrl+Shift+X` (`Cmd+Shift+X` on Mac)
- Hover highlight on any page element
- Click to capture HTML, scoped CSS/computed styles, DOM path, and thumbnail
- Add/edit notes per capture
- Re-highlight and delete captures
- Persist captures per URL with extension storage
- Export all captures to one Markdown prompt and copy to clipboard

## Tech

- Plasmo + React + TypeScript
- `html-to-image` for element screenshots
- `@plasmohq/storage` for persistence

## Local Dev

```bash
npm install
npm run dev
```

Then load the generated dev extension in Chrome.

## Build

```bash
npm run build
npm run package
```
