## 🎯 MVP Goal

A browser extension that lets you:
1. Enter "Capture Mode" via a keyboard shortcut.
2. Click any UI element to capture its HTML + scoped CSS + a tiny screenshot.
3. Add a note to each capture.
4. View all captures in a floating sidebar, edit/delete them.
5. Export all captures as a single, well-structured Markdown prompt, copyable to clipboard.

Works on any website, entirely client-side, no backend, no API keys.

---

## 🧰 Tech Stack

| Layer | Technology | Why |
|-------|-------------|-----|
| **Extension Framework** | [Plasmo](https://www.plasmo.com/) | Fastest way to build cross‑browser extensions with React, live‑reloading, and built‑in storage API. |
| **UI** | React + Tailwind CSS | Quick to prototype, easy to inject as a shadow DOM sidebar without style conflicts. |
| **Language** | TypeScript | Type safety for complex DOM operations. |
| **Element Screenshot** | `html2canvas` (or `dom-to-image-more`) | Lightweight, works on any element, returns data URL. |
| **CSS Rule Extraction** | Custom script using `document.styleSheets` + `getComputedStyle` | No library needed; we filter relevant rules. |
| **Storage** | `@plasmohq/storage` (abstracts IndexedDB) | Persists captures per URL. |
| **Clipboard** | `navigator.clipboard.writeText` | Copy the AI prompt. |
| **Build Tool** | Plasmo built‑in (esbuild) | Fast bundling. |
| **Testing** | Manual (Chrome/Edge/Firefox) + Vitest for utils | MVP stage. |

---

## 📦 MVP Feature Checklist

**Core:**
- [ ] Activate/Deactivate Capture Mode with shortcut (`Ctrl+Shift+X`).
- [ ] Hover over elements → highlight (colored overlay, non‑intrusive).
- [ ] Click element → extract:
  - OuterHTML (with children, maybe truncated to 200 lines max).
  - CSS rules that directly apply to this element (from all stylesheets).
  - Computed styles for layout‑relevant props (padding, margin, font‑size, etc.).
  - DOM path (breadcrumb).
  - Screenshot (base64 PNG, max width 300px).
- [ ] Add a note textarea to each capture card.
- [ ] Floating sidebar (shadow DOM) showing list of captures.
- [ ] Edit note, delete capture, re‑highlight element on page.
- [ ] Persist captures to IndexedDB per page URL.
- [ ] Export all captures as a single Markdown block, copy to clipboard.
- [ ] Works on any website, including localhost.

**Out of scope for MVP:**
- Export to GitHub Issue / Linear (can be post‑MVP).
- Dark mode (but can add if time).
- Multiple pages at once (only per‑tab).
- Framework‑specific JSX extraction (just HTML/CSS).

---

## 🗂️ Project Structure (Plasmo + React)

```
pixelcontext/
├── assets/
│   └── icon.png
├── contents/
│   ├── capture-overlay.tsx        # Injected content script that draws highlight & handles click
│   ├── sidebar.tsx                # The floating sidebar UI
│   └── styles.css                 # Minimal Tailwind/CSS for sidebar (shadow DOM)
├── core/
│   ├── element-capture.ts         # Logic to extract HTML/CSS/screenshot
│   ├── css-extractor.ts           # Custom CSS rule matching
│   ├── prompt-builder.ts          # Builds the Markdown export string
│   └── storage.ts                 # Wrapper around Plasmo storage (IndexedDB)
├── popup.tsx                      # Extension popup (optional, can show stats/clear)
├── background.ts                  # Service worker (if needed for messaging)
├── package.json
├── tsconfig.json
└── README.md
```

We'll use Plasmo's conventions: `contents/` for content scripts, `popup.tsx` for the popup, and `background.ts` for the service worker.

---

## 📝 Implementation Plan (Phases)

### Phase 1: Setup & Skeleton (Day 1)
1. Scaffold Plasmo project: `pnpm create plasmo` or `npm create plasmo`.
2. Set up Tailwind CSS for the extension (Plasmo supports PostCSS config).
3. Create `contents/capture-overlay.tsx` that injects a simple `<div>` overlay when a message is received.
4. Register a keyboard shortcut in the extension manifest (via Plasmo's `manifest` override in `package.json`).
5. Verify the overlay appears/disappears on shortcut.

### Phase 2: Element Selection & Highlighting (Day 2)
- Implement hover tracking: overlay moves/resizes to `getBoundingClientRect()` of the element under the cursor.
- Use `pointer-events: none` on the overlay so clicks pass through to the actual element.
- On click: capture the `outerHTML` and a serialized path. Send this data to the sidebar via `chrome.runtime.sendMessage` (or a custom event).

**Key technique:** To avoid interfering with page events, we'll render the overlay as a fixed‑position `<div>` that we move on `mousemove`. Clicks are detected via a transparent overlay that briefly enables `pointer-events: auto` on click detection. Simpler: use `document.elementFromPoint(e.clientX, e.clientY)` on click while overlay is hidden for that split second.

### Phase 3: CSS Extraction (Day 3)
- Build `css-extractor.ts`:
  1. Get all stylesheets (`document.styleSheets`) and loop through rules.
  2. For each rule, test if the target element matches the selector (using `element.matches(rule.selectorText)`). Collect matching rules.
  3. For inline styles, grab from `element.getAttribute('style')`.
  4. Add relevant computed styles (padding, margin, font-size, color, background, etc.) from `getComputedStyle(element)`.
- Deduplicate and sort for clarity.
- Return a clean CSS string.

**Caveat:** Cross‑origin stylesheets won't expose `cssRules` due to CORS. We'll gracefully fallback to computed styles only for those, but most sites are same‑origin or allow access.

### Phase 4: Screenshot Capture (Day 3)
- Use `html2canvas` on the element's DOM node. Configure it to capture only that element (`html2canvas(element, { onclone: ... })` but can be called on the element directly).
- Better approach: use `html-to-image` library (`toPng(element)`) which works on any node and returns a data URL. Lightweight.
- Resize if needed (limit to 300px width) to keep prompt size manageable.

### Phase 5: Sidebar UI (Day 4)
- Create `contents/sidebar.tsx` that renders a React component into a shadow DOM host appended to `document.body`.
- The sidebar is a floating panel (position: fixed, right: 20px, top: 20px, width: 350px, max‑height: 80vh, scrollable).
- It listens for capture events (via custom events or internal state).
- Displays cards: thumbnail, DOM path, first 80 chars of note.
- Each card has edit/delete buttons.
- "Export for AI" button at the top compiles all cards into a Markdown string and copies to clipboard.

### Phase 6: Storage & Persistence (Day 5)
- Use `@plasmohq/storage` with IndexedDB area. Store an array of `CaptureItem` objects per URL.
- When a new capture is added, save to storage. On sidebar load, read from storage.
- Auto‑clear old captures after 7 days? Not needed for MVP.

### Phase 7: Prompt Builder & Export (Day 5)
- `prompt-builder.ts`: Iterate over capture items and generate a well‑formatted Markdown template.
- Include:
  - Page URL
  - Each issue: number, note, DOM path, screenshot (embedded base64), HTML (truncated if long), CSS.
- Copy to clipboard using `navigator.clipboard.writeText(markdownString)`.
- Show a toast "Copied to clipboard!"

### Phase 8: Polish & Testing (Day 6-7)
- Test on popular sites (GitHub, Reddit, Google, local React apps).
- Handle edge cases:
  - Very deep DOM trees: limit HTML depth.
  - Huge screenshots: compress/limit size.
  - Shadow DOM elements: might need recursive highlighting.
- Improve UX: smooth animation, dark mode support using `prefers-color-scheme`.
- Write a simple `README.md` with GIF demo, install instructions.

---

## 🔑 Key Technical Challenges & Solutions

### 1. CSS Rule Extraction from Cross‑Origin Stylesheets
**Problem:** `cssRules` may be null.  
**Solution:** Try/catch; if access denied, fallback to using `getComputedStyle` for a comprehensive list of properties. We'll also attempt to parse inline styles and parent inline styles. Most useful CSS is usually inline or from same‑origin.

### 2. Highlighting Without Affecting Page Layout
**Solution:** The overlay is a fixed‑position `<div>` with `pointer-events: none`. We get the element's bounding rect via `getBoundingClientRect()` and set overlay's `top/left/width/height`. To detect clicks, we hide the overlay for 1ms, use `document.elementFromPoint()` to get the element, then show overlay again.

### 3. Injecting a Sidebar Without Style Conflicts
**Solution:** Use a shadow DOM root. Plasmo content scripts can mount a React component inside a shadow root with the `createShadowRootUi` helper. We'll import our Tailwind CSS into the shadow root, fully isolating styles.

### 4. Performance on Large Pages
**Solution:** Debounce hover events. Use `requestAnimationFrame` for overlay movement. Limit CSS extraction depth.

---

## 📅 Timeline (Solo Developer)

| Phase | Duration | Accumulated |
|-------|----------|-------------|
| Project setup & overlay toggle | 1 day | Day 1 |
| Hover highlight + click capture (HTML) | 1 day | Day 2 |
| CSS extractor + screenshot | 1 day | Day 3 |
| Sidebar UI (list, cards, note editor) | 1 day | Day 4 |
| Storage, export, prompt builder | 1 day | Day 5 |
| Polish, testing, README, demo GIF | 2 days | Day 7 |
| **Total** | **7 days** | MVP ready |

---

## 🚀 Launch Strategy for GitHub Virality

1. **Name & Branding:** "PixelContext" with a clean, recognizable logo.
2. **One‑line tagline:** "Capture any UI issue as an AI‑ready prompt."
3. **Demo GIF:** 30 seconds showing real workflow on a popular site (e.g., GitHub or Stripe), ending with pasting into ChatGPT and getting a fix.
4. **README:** Crystal clear. Start with the problem, show the demo, then quick install (link to Chrome Web Store, Edge Add‑ons, and manual load).
5. **Subreddits & Communities:** Post on r/webdev, r/programming, r/reactjs, r/Frontend, Hacker News.
6. **Twitter/X:** Tag popular AI/developer accounts; mention "This tool saves me 10 minutes every time I use an AI coding assistant."
7. **Product Hunt launch** after initial momentum.
8. **License:** MIT. Open‑source from day one.

---

## 🔮 Post‑MVP Roadmap (Optional, but Attractive)

- **Framework‑aware capture:** For React/Vue, extract component name from DOM attributes (e.g., `data-reactroot`) or React DevTools global hook.
- **Direct export to GitHub Issues/Linear/Notion.**
- **Collaboration mode:** Send a shareable link (with bundled data) to a teammate.
- **AI integration:** Option to send the prompt directly to OpenAI/Anthropic APIs from the sidebar.
- **Chrome Web Store & Firefox Add‑ons official listing.**

---

