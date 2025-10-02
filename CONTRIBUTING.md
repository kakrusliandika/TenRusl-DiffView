# Contributing to TenRusl DiffView (TRDV)

First off — thank you for taking the time to contribute! 🎉  
This project is open-source and we welcome issues, discussions, docs fixes, and feature PRs.

> By participating, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 💡 Ways to Contribute

-   **Bug reports** (with minimal repro)
-   **Feature requests** (clearly scoped)
-   **Documentation** (README, usage tips, i18n)
-   **DX/UX improvements** (keyboard shortcuts, toolbar, hunk nav)
-   **Performance** (SW cache, diff performance)

---

## 🧰 Project Setup

This is a static site (no build step). Run with any static server:

```bash
# Clone your fork
git clone --depth 1 https://github.com/<you>/TenRusl-DiffView.git
cd TenRusl-DiffView

# Run locally
npx serve . -p 5173       # or: python -m http.server 5173
# open http://localhost:5173
```

> Ensure **`sw.js`** is available at the **repo root** (`/sw.js`) so the Service Worker scope covers `/`.  
> The app also supports a fallback at `/assets/js/sw.js` (see headers). If you use the fallback path, set header:  
> `Service-Worker-Allowed: /` for `/assets/js/sw.js`.

---

## 🌳 Branching & Workflow

1. **Fork** the repo and clone your fork.
2. Create a feature branch from `main`:
    ```bash
    git checkout -b feat/<short-feature-name>
    ```
3. Make your changes, then commit:
    ```bash
    git add -A
    git commit -m "feat: add unified diff mode"
    ```
4. Push and open a PR:
    ```bash
    git push origin feat/<short-feature-name>
    ```

Keep PRs focused and as small as possible.

---

## 📝 Conventional Commits

Use the conventional commits format for clear history:

```
feat: add PNG/PDF export
fix: prevent popup blocker for print
docs: update README with unified mode
chore: bump vendor libs
refactor: simplify diff normalization
perf: cache vendor libs in SW
test: add unit tests for normalization (if applicable)
```

---

## 🧪 PR Checklist

-   [ ] **Works offline** (basic actions available with no network)
-   [ ] **Export PNG/PDF** works in offline mode (PWA vendor cache)
-   [ ] **Unified/Side-by-side** toggles function correctly
-   [ ] **Hunk navigation** & **auto-focus** to first hunk
-   [ ] **Copy diff** / **Share snapshot** (URL state) verified
-   [ ] **`sw.js` VERSION bumped** if assets changed (cache-busting)
-   [ ] **Docs updated** (README/i18n) if behavior/labels changed
-   [ ] For UI changes, attach small **before/after** screenshots (optional)

---

## 🌐 Adding i18n

-   Add new files to `/assets/i18n/` (e.g., `fr.json`) and wire them in the language switcher.
-   Keep short labels consistent and avoid truncation in buttons.

---

## 🛡️ Security & Headers

See **\_headers** in the repo for CSP, caching, and SW scope settings.

---

## 🐞 Filing Good Issues

When reporting a bug, include:

-   Steps to reproduce (minimal snippet preferred)
-   Expected vs actual behavior
-   Browser/OS/version
-   Console/network logs if relevant

Search existing issues first to avoid duplicates.

---

## 🔄 Keeping Your Fork in Sync

```bash
git remote add upstream https://github.com/kakrusliandika/TenRusl-DiffView.git
git fetch upstream
git checkout main
git merge upstream/main
```

---

## 📜 License

By contributing, you agree that your contributions are licensed under the **MIT License** of this repository.
