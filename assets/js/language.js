/* language.js — i18n EN/ID for DiffView */
(function () {
    "use strict";

    const LS_LANG = "trhc.uiLang";
    const LS_DICT = (lang) => `trhc.i18n.${lang}`;
    const SUPPORTED = ["en", "id"];
    const uiBadge = document.getElementById("uiLangBadge");

    const FALLBACK = {
        en: {
            // common
            privacy: "Privacy",
            terms: "Terms",
            cookies: "Cookies",
            PNG: "PNG",
            PDF: "PDF",
            Print: "Print",

            // Diff
            "diff.title": "DiffView",
            "diff.inputs": "Diff Inputs",
            "diff.preview": "Preview",
            "diff.openA": "Open A",
            "diff.openB": "Open B",
            "diff.pasteA": "Paste A",
            "diff.pasteB": "Paste B",
            "diff.swap": "Swap",
            "diff.prev": "Prev",
            "diff.next": "Next",
            "diff.reset": "Reset",
            "diff.wrap": "Wrap",
            "diff.lineNumbers": "Line numbers",
            "diff.ignoreWhitespace": "Ignore whitespace",
            "diff.ignoreCase": "Ignore case",
            "diff.normalizeEOL": "Normalize line endings",
            "diff.ignoreTrailing": "Ignore trailing spaces",
            "diff.highContrast": "High contrast",
            "diff.watermark": "Watermark",
            "diff.placeholderA": "Paste or drop LEFT (A)…",
            "diff.placeholderB": "Paste or drop RIGHT (B)…",
        },
        id: {
            // common
            privacy: "Privasi",
            terms: "Ketentuan",
            cookies: "Cookie",
            PNG: "PNG",
            PDF: "PDF",
            Print: "Cetak",

            // Diff
            "diff.title": "Tampilan Diff",
            "diff.inputs": "Input Diff",
            "diff.preview": "Pratinjau",
            "diff.openA": "Buka A",
            "diff.openB": "Buka B",
            "diff.pasteA": "Tempel A",
            "diff.pasteB": "Tempel B",
            "diff.swap": "Tukar",
            "diff.prev": "Sebelumnya",
            "diff.next": "Berikutnya",
            "diff.reset": "Atur ulang",
            "diff.wrap": "Bungkus baris",
            "diff.lineNumbers": "Nomor baris",
            "diff.ignoreWhitespace": "Abaikan spasi",
            "diff.ignoreCase": "Abaikan huruf besar/kecil",
            "diff.normalizeEOL": "Normalisasi akhir baris",
            "diff.ignoreTrailing": "Abaikan spasi di akhir",
            "diff.highContrast": "Kontras tinggi",
            "diff.watermark": "Tanda air",
            "diff.placeholderA": "Tempel atau jatuhkan sisi KIRI (A)…",
            "diff.placeholderB": "Tempel atau jatuhkan sisi KANAN (B)…",
        },
    };

    let dict = FALLBACK.en;

    const clamp = (x) => (SUPPORTED.includes(String(x).toLowerCase()) ? String(x).toLowerCase() : "en");

    function t(key) {
        return dict[key] || key;
    }

    async function loadDict(lang) {
        // 1) coba dari cache LS — **merge** dengan fallback agar kunci baru tetap ada
        const cached = localStorage.getItem(LS_DICT(lang));
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                return { ...FALLBACK[lang], ...parsed };
            } catch {
                // fall through ke fetch
            }
        }
        // 2) fetch file i18n dan simpan; tetap **merge** dengan fallback
        try {
            const res = await fetch(`/assets/i18n/${lang}.json`, { cache: "no-cache", credentials: "same-origin" });
            if (!res.ok) throw new Error("i18n fetch fail");
            const json = await res.json();
            localStorage.setItem(LS_DICT(lang), JSON.stringify(json));
            return { ...FALLBACK[lang], ...json };
        } catch {
            return FALLBACK[lang] || FALLBACK.en;
        }
    }

    function applyTexts() {
        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const k = el.getAttribute("data-i18n");
            const txt = t(k);
            const label = el.matches(".label") ? el : el.querySelector(":scope > .label");
            if (label) {
                label.textContent = txt;
            } else if (el.childElementCount === 0) {
                el.textContent = txt;
            } else {
                const span = document.createElement("span");
                span.className = "label";
                span.textContent = txt;
                el.appendChild(span);
            }
        });

        const a = document.getElementById("inputA");
        const b = document.getElementById("inputB");
        if (a) a.placeholder = t("diff.placeholderA");
        if (b) b.placeholder = t("diff.placeholderB");
    }

    async function setUiLang(lang) {
        const next = clamp(lang);
        dict = await loadDict(next);
        localStorage.setItem(LS_LANG, next);
        document.documentElement.lang = next === "id" ? "id" : "en";
        if (uiBadge) uiBadge.textContent = next.toUpperCase();
        applyTexts();
        document.dispatchEvent(new CustomEvent("trhc:i18nUpdated", { detail: { lang: next } }));
    }

    function detectInitialLang() {
        const fromLS = localStorage.getItem(LS_LANG);
        if (fromLS) return clamp(fromLS);

        const metaCountry = document.querySelector('meta[name="trhc-country"]')?.getAttribute("content");
        const hinted = (window.__TRHC_COUNTRY || metaCountry || "").toUpperCase();
        if (hinted === "ID") return "id";

        const langs = (navigator.languages || [navigator.language || "en"]).map((x) => String(x).toLowerCase());
        if (langs.some((x) => x.startsWith("id"))) return "id";

        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
        if (/^Asia\/(Jakarta|Makassar|Jayapura)$/i.test(tz)) return "id";
        return "en";
    }

    async function init() {
        const initial = detectInitialLang();
        await setUiLang(initial);
    }

    document.addEventListener("DOMContentLoaded", init);

    window.TRI18N = {
        setUiLang,
        toggleUiLang: () => setUiLang((localStorage.getItem(LS_LANG) || "en") === "en" ? "id" : "en"),
        t,
    };
})();
