# TenRusl DiffView (TRDV) — Side‑by‑Side & Unified Diff Viewer (PWA, Offline)

> Private, fast, and offline‑first **PWA** to compare two texts/code with **side‑by‑side** and **unified** views, **inline word/character highlights**, smart ignore options, **export PNG/PDF**, **print**, **Copy diff**, and **Share snapshot** (URL with serialized state).

![Status](https://img.shields.io/badge/PWA-Ready-8b5cf6)
![License](https://img.shields.io/badge/License-MIT-green)
![Stack](https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20diff--match--patch%20%7C%20PWA-111)
![NoBuild](https://img.shields.io/badge/Build-None%20%28Static%20Site%29-2ea44f)
![Stars](https://img.shields.io/github/stars/kakrusliandika/TenRusl-DiffView?style=social)
![Forks](https://img.shields.io/github/forks/kakrusliandika/TenRusl-DiffView?style=social)

Live: **[https://tenrusl-diffview.pages.dev/](https://tenrusl-diffview.pages.dev/)**

---

## Table of Contents

-   [✨ Key Features](#key-features)
-   [▶️ Quick Demo](#quick-demo)
-   [📦 Install (Open Source)](#install-open-source)
-   [🚀 Deployment](#deployment)
-   [🗂️ Directory Structure](#directory-structure)
-   [⚙️ How It Works](#how-it-works)
-   [🔗 Share Snapshot](#share-snapshot)
-   [⌨️ Keyboard Shortcuts](#keyboard-shortcuts)
-   [🎛️ Options & Preferences](#options--preferences)
-   [🖨️ Export & Print](#export--print)
-   [📲 PWA & Caching](#pwa--caching)
-   [🌍 I18N](#i18n)
-   [🛡️ Security Headers (Recommended)](#security-headers-recommended)
-   [🛠️ Development](#development)
-   [🐞 Troubleshooting](#troubleshooting)
-   [🤝 Contributing](#contributing)
-   [📜 Code of Conduct](#code-of-conduct)
-   [🏆 Credits](#credits)
-   [👤 Author](#author)
-   [🗺️ Roadmap](#roadmap)
-   [📄 License](#license)

---

## ✨ Key Features

-   **Two views:**  
    **Side‑by‑side** (2 columns) and **Unified diff** (1 column).
-   **Inline highlights (per‑word/character):**  
    Uses `diff-match-patch` for granular segments inside each line.
-   **Smart ignore options:**  
    _Ignore whitespace_, _Ignore case_, _Normalize line endings (CRLF→LF)_, _Ignore trailing spaces_.
-   **Readability controls:**  
    _Line numbers_, _Wrap/No‑wrap_, _High contrast_, optional _Watermark_ overlay.
-   **Hunks & navigation:**  
    Auto‑focus to the first change (hunk) + indicator counter. Keyboard shortcuts: **Alt+↑/Alt+↓** navigate hunks, **Alt+S** swap A↔B.
-   **Input UX:**  
    Paste, drag‑and‑drop file, or open local files to fill **A** and **B**.
-   **Export & Print:**  
    **PNG**/**PDF** export using `html-to-image` and `jsPDF`. **Print** mirrors the on‑screen preview (same tab).
-   **Copy & Share:**  
    **Copy diff** (plain/unified), **Share snapshot** (serializes inputs + prefs into a short URL).
-   **Offline‑first PWA:**  
    Service Worker precaches app shell and **caches vendor libs** so **exports work fully offline**.

> Library credits: **diff‑match‑patch**, **html‑to‑image**, **jsPDF**.

---

## ▶️ Quick Demo

1. Paste or drop file(s) into inputs **A** and **B** (left panel).
2. Toggle options (wrap, line numbers, ignore rules, high contrast, watermark).
3. Navigate changes (**Alt+↑/Alt+↓**), or **Swap** (**Alt+S**).
4. Export **PNG/PDF**, **Copy diff**, or **Print**.
5. Use **Share snapshot** to get a URL that restores the view (inputs + prefs).

---

## 📦 Install (Open Source)

### 1) Clone the repository

```bash
# SSH (recommended if you set up SSH keys)
git clone --depth 1 git@github.com:kakrusliandika/TenRusl-DiffView.git
# or HTTPS
git clone --depth 1 https://github.com/kakrusliandika/TenRusl-DiffView.git

cd TenRusl-DiffView
```

> `--depth 1` gives you a shallow clone for a faster download.

### 2) Run it

Pick one (no build step):

```bash
# Using Node "serve"
npx serve . -p 5173

# Or Python
python -m http.server 5173

# Or Bun
bunx serve . -p 5173
```

Open `http://localhost:5173` and start diffing.

### 3) Keep your fork in sync (optional)

```bash
# Add the original repo as upstream
git remote add upstream https://github.com/kakrusliandika/TenRusl-DiffView.git

# Fetch and merge updates
git fetch upstream
git checkout main
git merge upstream/main
```

### 4) Create a new branch for your changes (for PRs)

```bash
git checkout -b feat/awesome-improvements
# ...do your changes...
git add -A
git commit -m "feat: awesome improvements to TRDV"
git push origin feat/awesome-improvements
# Then open a Pull Request on GitHub
```

---

### Building?

No build step required. Just keep `sw.js` at site root scope (or allow with `Service-Worker-Allowed: /` header if using a subpath).

---

## 🚀 Deployment

### Cloudflare Pages (recommended)

-   **Build command**: _(empty)_
-   **Output directory**: `/` (root)
-   Ensure the Service Worker is registered as **`/sw.js`** with scope `/`.
    -   If your source file is at `/assets/js/sw.js`, either copy it to root during deploy or map a route so `/sw.js` resolves to that file.
-   `_headers` and `_redirects` are honored on Cloudflare Pages.

### Netlify / Vercel / Any static host

-   Upload the repo as‑is.
-   Apply **security headers** (see section below).
-   Keep `/_redirects` for SPA routing (`/*  /index.html  200`).

### Apache / Nginx

-   Mirror the headers via `.htaccess` (Apache) or server config (Nginx).
-   Ensure Service Worker scope covers `/` and that `/sw.js` resolves.

---

## 🗂️ Directory Structure

**Generic (POSIX)**

```
/
├─ index.html
├─ manifest.webmanifest
├─ ads.txt
├─ robots.txt
├─ sitemap.xml
├─ sitemap-index.xml
├─ CODE_OF_CONDUCT.md
├─ CONTRIBUTING.md
├─ LICENSE
├─ README.md
├─ humans.txt
├─ consent-base.js
├─ googleFClG-yRowubCICDyQFjDm65cnX4tk4WYcmDA0EXmRQQ.html
├─ _headers
├─ _redirects
├─ .well-known/
│  └─ security.txt
├─ assets/
│  ├─ index.html
│  ├─ css/
│  │  ├─ app.css
│  │  ├─ chrome.css
│  │  ├─ header.css
│  │  ├─ footer.css
│  │  ├─ language.css
│  │  ├─ pages.css
│  │  ├─ theme.css
│  │  └─ index.html
│  ├─ i18n/
│  │  ├─ en.json
│  │  ├─ id.json
│  │  ├─ pages.json
│  │  └─ index.html
│  ├─ images/
│  │  ├─ icon.svg
│  │  └─ index.html
│  ├─ js/
│  │  ├─ app.js
│  │  ├─ footer-pages.js
│  │  ├─ footer.js
│  │  ├─ header-pages.js
│  │  ├─ header.js
│  │  ├─ index.html
│  │  ├─ language-pages.js
│  │  ├─ language.js
│  │  ├─ pages.js
│  │  ├─ sw.js
│  │  └─ theme.js
│  ├─ json/
│  │  ├─ index.html
│  │  ├─ languages.json
│  │  └─ settings.json
│  └─ plugin/
│     ├─ additional/
│     ├─ fontawesome/
│     ├─ prismjs/
│     ├─ diff-match-patch.js
│     ├─ htmlotimage.js
│     ├─ jspdf.js
│     └─ index.html
├─ pages/
│  ├─ 404.html
│  ├─ ad-unit-example.html
│  ├─ contact.html
│  ├─ cookies.html
│  ├─ head-snippets.html
│  ├─ index-injection-example.html
│  ├─ index.html
│  ├─ offline.html
│  ├─ privacy.html
│  └─ terms.html
```

---

## ⚙️ How It Works

-   **Diff engine**: [google/diff-match-patch] is used when available; we set small timeouts and apply **semantic cleanup**.
-   **Normalization**: before diffing, inputs can be normalized based on preferences:
    -   Normalize EOL (`\\r\\n? → \\n`)
    -   Ignore trailing spaces (per line)
    -   Collapse whitespace (and/or trim lines)
    -   Force lowercase (ignore case)
-   **Hunks**: contiguous changed lines are grouped into _hunks_ for navigation and focus.
-   **Inline (intra-line) highlight**: within each changed line, we compute a secondary diff — first tokenized by words;
    falls back to per‑character so small edits are visible.

---

## 🔗 Share Snapshot

Click **Share** to copy a link that reconstructs the current state (inputs + prefs + mode).

-   **Format**: `?s=<base64url(JSON)>`
-   **Model**:
    ```jsonc
    {
        "a": "LEFT text...",
        "b": "RIGHT text...",
        "prefs": {
            "wrap": true,
            "lineNumbers": true,
            "ignoreWhitespace": false,
            "ignoreCase": false,
            "ignoreEOL": true,
            "ignoreTrailing": true,
            "hc": false,
            "watermark": false
        },
        "mode": "side-by-side" // or "unified"
    }
    ```
-   **Size tips**: browsers handle long URLs but prefer snippets under ~100KB. For larger texts consider files/drop.

> The app also supports **Copy diff** (plain text) if you just need the textual summary.

---

## ⌨️ Keyboard Shortcuts

-   `Alt + ↑` — Previous hunk
-   `Alt + ↓` — Next hunk
-   `Alt + S` — Swap A ↔ B

---

## 🎛️ Options & Preferences

-   **Wrap** long lines
-   **Line numbers**
-   **Ignore whitespace / case / trailing / normalize EOL**
-   **High contrast** colors
-   **Watermark** overlay

All preferences are persisted to **`localStorage`** (`trdv.diff.prefs`).

---

## 🖨️ Export & Print

-   **PNG** — Capture the preview grid with `html-to-image` at higher pixel ratio.
-   **PDF** — Render to PNG then fit into **A4** (`jsPDF`), centered with margins.
-   **Print** — Same‑tab “mirror” mode injects a sandbox DOM so the output is clean (no toolbars).

> Vendors are available offline via the Service Worker so exports keep working without network.

---

## 📲 PWA & Caching

`assets/js/sw.js` provides three buckets:

-   **CORE_CACHE** — app shell & critical assets (HTML/CSS/JS/manifest/icon).
-   **RUNTIME_CACHE** — same‑origin assets (cache‑first) + navigations (network‑then‑cache).
-   **VENDORS_CACHE** — vendor libs (`diff-match-patch`, `htmlotimage.js`, `jspdf.js`) cached so **exports remain available offline**.

Notes:

-   Bump `VERSION` in the SW when changing assets to invalidate old caches.
-   Headers include `Service-Worker-Allowed: /` for `/assets/js/sw.js` scope.
-   Fallback to `/pages/offline.html` for navigations when offline (optional).

---

## 🌍 I18N

-   UI dictionaries: `/assets/i18n/en.json`, `/assets/i18n/id.json`, and `/assets/i18n/pages.json`.
-   Callbacks re‑apply placeholders if language toggles at runtime (event: `trhc:i18nUpdated`).

---

## 🛡️ Security Headers (Recommended)

Use an `_headers` file (Cloudflare Pages/Netlify) similar to:

```
/*
  Content-Security-Policy: default-src 'self'; img-src 'self' blob: data:; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

Adjust CSP if you change vendor locations.

---

## 🛠️ Development

-   Entry: `index.html`
-   Core logic: `assets/js/app.js`
-   PWA: `assets/js/sw.js`
-   Theme & chrome: `assets/css/*`
-   i18n: `assets/i18n/*.json`

---

## 🐞 Troubleshooting

-   **Service Worker inactive** → ensure you’re on `http://localhost` or `https://` (not `file://`).
-   **Very large inputs** → browser DOM capture for PNG/PDF can be memory heavy; export in parts if needed.
-   **No inline highlight** → confirm vendors loaded; for extreme lines (>100k chars) the app may gracefully skip token‑level diff.
-   **Fonts/emoji** looking odd in PDF\*\* → jsPDF embeds canvas raster; use higher pixel ratio when exporting.
-   **PNG/PDF export fails** → confirm `htmlotimage.js` & `jspdf.js` are cached/loaded; check CSP.
-   **Share URL too long** → app auto‑compresses; otherwise consider saving to a gist and sharing the link.
-   **Service Worker not active** → serve over HTTP(S), clear old SW in DevTools Application tab and hard‑reload.
-   **Fonts/colors look off in print** → confirm print styles are applied and your browser honors background graphics.

---

## 🤝 Contributing

We welcome issues and PRs. Please:

1. Fork & branch: `git checkout -b feat/short-name`
2. Commit with conventional commits (e.g., `feat: add unified mode toggle`)
3. Open a PR with before/after notes for UI changes

See **CONTRIBUTING.md** for details.

---

## 📜 Code of Conduct

By participating, you agree to abide by our **Contributor Covenant**. See **CODE_OF_CONDUCT.md**.

---

## 🏆 Credits

-   **diff‑match‑patch**
-   **html‑to‑image**
-   **jsPDF**

---

## 👤 Author

-   **Andika Rusli (TenRusl)**
-   **Site**: https://tenrusl-diffview.pages.dev
-   **GitHub**: https://github.com/kakrusliandika/TenRusl-DiffView

---

## 🗺️ Roadmap

-   [ ] **Share Snapshot** (permalink with serialized state)
-   [ ] **Batch Export** (multi‑hunk → single PDF)
-   [ ] More sharing formats (Gist/GitHub permalinks)
-   [ ] Theming system for diff colors
-   [ ] Per‑file tab support (multi‑pane)

---

## 📄 License

**MIT** — do what you need, just keep the license. See **LICENSE**.
