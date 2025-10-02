/* =========================================================
   TRDV — DiffView (assets/js/diff.js)
   Side-by-side + Unified view, inline highlights, Copy/Share,
   PNG/PDF export, print (mirror), snapshot (Base64 URL-safe),
   PWA-friendly. (Hanya penambahan fitur, tidak mengurangi yang ada)
   ======================================================= */
(() => {
    "use strict";

    /* ---------- Utils ---------- */
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const LS_PREFS = "trdv.diff.prefs.v2";

    const t = (key, fb) => {
        const F = fb ?? key;
        try {
            if (window.TRI18N?.t) {
                const v = window.TRI18N.t(key);
                if (v && v !== key) return v;
            }
            if (window.PagesI18N?.t) {
                const v2 = window.PagesI18N.t(key);
                if (v2 && v2 !== key) return v2;
            }
        } catch (_) {}
        return F;
    };

    const debounce = (fn, ms = 100) => {
        let id;
        return (...a) => {
            clearTimeout(id);
            id = setTimeout(() => fn(...a), ms);
        };
    };
    const bytes = (str) => new Blob([str || ""]).size;
    const human = (n) => (n >= 1024 ? (n / 1024).toFixed(1) + " KB" : n + " B");
    const escapeHTML = (s) =>
        (s ?? "").replace(
            /[&<>"']/g,
            (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
        );

    const loadScriptOnce = (url) =>
        new Promise((res, rej) => {
            const exists = Array.from(document.scripts).some((s) => s.src && (s.src === url || s.src.endsWith(url)));
            if (exists) {
                res();
                return;
            }
            const sc = document.createElement("script");
            sc.src = url;
            sc.defer = true;
            sc.onload = res;
            sc.onerror = () => rej(new Error("load fail: " + url));
            document.head.appendChild(sc);
        });

    /* ---------- Styles (side, unified & print mirror) ---------- */
    function ensureStyles() {
        if ($("#diff-style")) return;
        const st = document.createElement("style");
        st.id = "diff-style";
        st.textContent = [
            ".diff-wrap{position:relative;overflow:auto;background:var(--surface,#0b0b0b);min-height:200px}",
            ".diff-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--border,#222);position:relative}",
            ".diff-grid.no-ln .gutter{display:none}",
            ".diff-grid.no-ln .line{grid-template-columns:0 1fr}",
            ".pane{background:var(--panel,#111)}",
            ".line{display:grid;grid-template-columns:56px 1fr;border-bottom:1px solid var(--border,#222);font-size:13px}",
            ".gutter{padding:6px 10px;color:var(--muted,#8b8b8b);user-select:none;text-align:right;border-right:1px solid var(--border,#222)}",
            ".content{padding:0}",
            ".content pre{margin:0;padding:8px 10px;white-space:pre-wrap;word-break:break-word;color:var(--text,#eaeaea)}",
            ".content pre.nowrap{white-space:pre;word-break:normal}",
            ".line.eq .content{background:transparent}",
            ".line.add .content{background:rgba(16,185,129,.18)}",
            ".line.rem .content{background:rgba(239,68,68,.20)}",
            ".line.modL .content{background:rgba(239,68,68,.16)}",
            ".line.modR .content{background:rgba(16,185,129,.14)}",
            ".diff-grid.hc .line.add .content{background:rgba(16,185,129,.38)}",
            ".diff-grid.hc .line.rem .content{background:rgba(239,68,68,.46)}",
            ".line[data-hunk]{outline:1px dashed rgba(139,92,246,.6);outline-offset:-2px}",
            ".line.current{outline:2px solid rgba(139,92,246,.9);outline-offset:-3px}",
            ".diff-grid .wm{position:absolute;inset:0;pointer-events:none;display:grid;place-items:center;font-weight:800;font-size:64px;letter-spacing:2px;color:rgba(255,255,255,.06);transform:rotate(-18deg)}",
            ".ch{white-space:pre}",
            ".ch-add{background:rgba(16,185,129,.24)}",
            ".ch-rem{background:rgba(239,68,68,.28)}",
            /* Unified */
            ".diff-unified{display:block;position:relative}",
            ".u-line{display:grid;grid-template-columns:56px 1fr;border-bottom:1px solid var(--border,#222);font-size:13px}",
            ".u-line .gutter{padding:6px 10px;color:var(--muted);user-select:none;text-align:right;border-right:1px solid var(--border,#222)}",
            ".u-line .content{padding:0}",
            ".u-line .content pre{margin:0;padding:8px 10px;white-space:pre-wrap;word-break:break-word;color:var(--text)}",
            ".u-line.add .content{background:rgba(16,185,129,.18)}",
            ".u-line.rem .content{background:rgba(239,68,68,.20)}",
            ".u-line.eq .content{background:transparent}",
            ".u-line.modL .content{background:rgba(239,68,68,.16)}",
            ".u-line.modR .content{background:rgba(16,185,129,.14)}",
            "@media print{",
            "html,body{margin:0;padding:0;background:#fff;font:13px/1.6 ui-monospace,Menlo,Consolas,monospace}",
            ".app-header,.panel.left,.adsbygoogle,nav.controls{display:none!important}",
            ".app-main{padding:0!important;grid-template-columns:1fr!important}",
            ".panel.right{border:none!important;box-shadow:none!important}",
            ".diff-wrap{overflow:visible!important;background:#fff!important}",
            ".diff-grid{grid-template-columns:1fr 1fr!important;background:#ddd}",
            ".u-line{grid-template-columns:56px 1fr!important}",
            ".line{grid-template-columns:56px 1fr!important}",
            "}",
        ].join("");
        document.head.appendChild(st);
    }

    /* ---------- Prefs & State ---------- */
    const defaultPrefs = {
        wrap: true,
        lineNumbers: true,
        ignoreWhitespace: false,
        ignoreCase: false,
        ignoreEOL: true,
        ignoreTrailing: true,
        hc: false,
        watermark: false,
        mode: "side", // "side" | "unified"
    };
    const loadPrefs = () => {
        try {
            return { ...defaultPrefs, ...JSON.parse(localStorage.getItem(LS_PREFS) || "{}") };
        } catch (_) {
            return { ...defaultPrefs };
        }
    };
    const savePrefs = (p) => {
        try {
            localStorage.setItem(LS_PREFS, JSON.stringify(p));
        } catch (_) {}
    };

    /* ---------- Normalize ---------- */
    function normalize(text, p) {
        let s = text ?? "";
        if (p.ignoreEOL) s = s.replace(/\r\n?/g, "\n");
        if (p.ignoreTrailing)
            s = s
                .split("\n")
                .map((ln) => ln.replace(/[ \t\u00A0]+$/g, ""))
                .join("\n");
        if (p.ignoreWhitespace)
            s = s
                .replace(/[ \t\u00A0]+/g, " ")
                .split("\n")
                .map((ln) => ln.trim())
                .join("\n");
        if (p.ignoreCase) s = s.toLowerCase();
        return s;
    }

    /* ---------- Diffs ---------- */
    function hasDMP() {
        return !!window.diff_match_patch;
    }

    function computeDiff(aRaw, bRaw, prefs) {
        const a = normalize(aRaw, prefs);
        const b = normalize(bRaw, prefs);

        if (hasDMP()) {
            const dmp = new window.diff_match_patch();
            dmp.Diff_Timeout = 1.0;
            dmp.Diff_EditCost = 4;
            const diffs = dmp.diff_main(a, b);
            dmp.diff_cleanupSemantic(diffs);

            const LEFT = [];
            const RIGHT = [];
            let la = 0;
            let lb = 0;
            for (let i = 0; i < diffs.length; i++) {
                const op = diffs[i][0];
                const seg = String(diffs[i][1] ?? "");
                const lines = seg.split("\n");
                for (let j = 0; j < lines.length; j++) {
                    const line = lines[j];
                    if (op === 0) {
                        la++;
                        lb++;
                        LEFT.push({ op: 0, text: line, ln: la });
                        RIGHT.push({ op: 0, text: line, ln: lb });
                    } else if (op === -1) {
                        la++;
                        LEFT.push({ op: -1, text: line, ln: la });
                        RIGHT.push({ op: -1, text: "", ln: null });
                    } else if (op === 1) {
                        lb++;
                        RIGHT.push({ op: 1, text: line, ln: lb });
                        LEFT.push({ op: 1, text: "", ln: null });
                    }
                }
            }

            // tandai modified pair (rem ↔ add di index sama) → hitung segmen inline
            const charDMP = new window.diff_match_patch();
            const L = Math.max(LEFT.length, RIGHT.length);
            for (let i = 0; i < L; i++) {
                const Lr = LEFT[i];
                const Rr = RIGHT[i];
                if (!Lr || !Rr) continue;
                if (Lr.op === -1 && Rr.op === 1) {
                    const segs = charDMP.diff_main(Lr.text, Rr.text);
                    charDMP.diff_cleanupSemantic(segs);
                    Lr.op = "modL";
                    Rr.op = "modR";
                    Lr.modSeg = segs;
                    Rr.modSeg = segs;
                }
            }

            // hunk boundaries
            const hunks = [];
            let cur = null;
            for (let i = 0; i < L; i++) {
                const l = LEFT[i] || { op: 0, text: "" };
                const r = RIGHT[i] || { op: 0, text: "" };
                const changed = l.op !== 0 || r.op !== 0 || l.text !== r.text;
                if (changed) {
                    if (!cur) cur = { from: i, to: i };
                    cur.to = i;
                } else if (cur) {
                    hunks.push(cur);
                    cur = null;
                }
            }
            if (cur) hunks.push(cur);
            return { LEFT, RIGHT, hunks };
        }

        // Fallback line-by-line
        const A = a.split("\n");
        const B = b.split("\n");
        const LEFT = [];
        const RIGHT = [];
        let la = 0;
        let lb = 0;
        const N = Math.max(A.length, B.length);
        for (let i = 0; i < N; i++) {
            const Ls = A[i];
            const Rs = B[i];
            if (Ls != null && Rs != null) {
                if (Ls === Rs) {
                    la++;
                    lb++;
                    LEFT.push({ op: 0, text: Ls, ln: la });
                    RIGHT.push({ op: 0, text: Rs, ln: lb });
                } else {
                    la++;
                    lb++;
                    LEFT.push({ op: -1, text: Ls, ln: la });
                    RIGHT.push({ op: 1, text: Rs, ln: lb });
                }
            } else if (Ls != null) {
                la++;
                LEFT.push({ op: -1, text: Ls, ln: la });
                RIGHT.push({ op: -1, text: "", ln: null });
            } else if (Rs != null) {
                lb++;
                RIGHT.push({ op: 1, text: Rs, ln: lb });
                LEFT.push({ op: 1, text: "", ln: null });
            }
        }
        const hunks = [];
        let cur = null;
        for (let i = 0; i < N; i++) {
            const l = LEFT[i] || { op: 0, text: "" };
            const r = RIGHT[i] || { op: 0, text: "" };
            const changed = l.op !== 0 || r.op !== 0 || l.text !== r.text;
            if (changed) {
                if (!cur) cur = { from: i, to: i };
                cur.to = i;
            } else if (cur) {
                hunks.push(cur);
                cur = null;
            }
        }
        if (cur) hunks.push(cur);
        return { LEFT, RIGHT, hunks };
    }

    /* ---------- Inline segments → HTML ---------- */
    function segHTML(diffs, side /* 'L'|'R' */) {
        let html = "";
        for (let i = 0; i < diffs.length; i++) {
            const op = diffs[i][0];
            const txt = escapeHTML(diffs[i][1] ?? "");
            if (op === 0) html += '<span class="ch ch-eq">' + txt + "</span>";
            else if (op === -1 && side === "L") html += '<span class="ch ch-rem">' + txt + "</span>";
            else if (op === 1 && side === "R") html += '<span class="ch ch-add">' + txt + "</span>";
        }
        return html || "&nbsp;";
    }

    /* ---------- Rendering ---------- */
    const el = (tag, cls, txt) => {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (txt != null) n.textContent = txt;
        return n;
    };

    function renderSideBySide(container, LEFT, RIGHT, prefs) {
        container.innerHTML = "";
        const grid = el("div", "diff-grid" + (prefs.hc ? " hc" : "") + (!prefs.lineNumbers ? " no-ln" : ""));
        const leftPane = el("div", "pane left");
        const rightPane = el("div", "pane right");

        const L = Math.max(LEFT.length, RIGHT.length);
        for (let i = 0; i < L; i++) {
            const l = LEFT[i] || { op: 0, text: "", ln: null };
            const r = RIGHT[i] || { op: 0, text: "", ln: null };
            const lType = l.op === 0 ? "eq" : l.op === -1 ? "rem" : l.op === "modL" ? "modL" : "add";
            const rType = r.op === 0 ? "eq" : r.op === -1 ? "rem" : r.op === "modR" ? "modR" : "add";

            // left
            const lLine = el("div", "line " + lType);
            lLine.appendChild(el("div", "gutter", prefs.lineNumbers && l.ln != null ? String(l.ln) : ""));
            const lCont = el("div", "content");
            const lp = el("pre");
            if (!prefs.wrap) lp.classList.add("nowrap");
            if (l.op === "modL" && l.modSeg) {
                lp.innerHTML = segHTML(l.modSeg, "L");
            } else if (l.op === -1) {
                lp.innerHTML = '<span class="ch ch-rem">' + escapeHTML(l.text) + "</span>";
            } else {
                lp.textContent = l.text;
            }
            lCont.appendChild(lp);
            lLine.appendChild(lCont);
            leftPane.appendChild(lLine);

            // right
            const rLine = el("div", "line " + rType);
            rLine.appendChild(el("div", "gutter", prefs.lineNumbers && r.ln != null ? String(r.ln) : ""));
            const rCont = el("div", "content");
            const rp = el("pre");
            if (!prefs.wrap) rp.classList.add("nowrap");
            if (r.op === "modR" && r.modSeg) {
                rp.innerHTML = segHTML(r.modSeg, "R");
            } else if (r.op === 1) {
                rp.innerHTML = '<span class="ch ch-add">' + escapeHTML(r.text) + "</span>";
            } else {
                rp.textContent = r.text;
            }
            rCont.appendChild(rp);
            rLine.appendChild(rCont);
            rightPane.appendChild(rLine);
        }

        grid.appendChild(leftPane);
        grid.appendChild(rightPane);
        if (prefs.watermark) grid.appendChild(el("div", "wm", "DIFF-CONFIDENTIAL"));

        container.appendChild(grid);
        return { grid, leftPane, rightPane };
    }

    function renderUnified(container, LEFT, RIGHT, prefs) {
        container.innerHTML = "";
        const uni = el("div", "diff-unified" + (prefs.hc ? " hc" : ""));

        const L = Math.max(LEFT.length, RIGHT.length);
        for (let i = 0; i < L; i++) {
            const Li = LEFT[i] || { op: 0, text: "", ln: null };
            const Ri = RIGHT[i] || { op: 0, text: "", ln: null };

            if (Li.op === 0 && Ri.op === 0 && Li.text === Ri.text) {
                const row = el("div", "u-line eq");
                row.appendChild(el("div", "gutter", prefs.lineNumbers && Li.ln != null ? String(Li.ln) : ""));
                const cont = el("div", "content");
                const pre = el("pre");
                if (!prefs.wrap) pre.classList.add("nowrap");
                pre.textContent = Li.text;
                cont.appendChild(pre);
                row.appendChild(cont);
                uni.appendChild(row);
                continue;
            }

            if (Li.op === "modL" && Ri.op === "modR" && Li.modSeg) {
                const rowL = el("div", "u-line modL");
                rowL.appendChild(el("div", "gutter", prefs.lineNumbers && Li.ln != null ? "−" + Li.ln : "−"));
                const cL = el("div", "content");
                const pL = el("pre");
                if (!prefs.wrap) pL.classList.add("nowrap");
                pL.innerHTML = segHTML(Li.modSeg, "L");
                cL.appendChild(pL);
                rowL.appendChild(cL);
                uni.appendChild(rowL);

                const rowR = el("div", "u-line modR");
                rowR.appendChild(el("div", "gutter", prefs.lineNumbers && Ri.ln != null ? "+" + Ri.ln : "+"));
                const cR = el("div", "content");
                const pR = el("pre");
                if (!prefs.wrap) pR.classList.add("nowrap");
                pR.innerHTML = segHTML(Ri.modSeg, "R");
                cR.appendChild(pR);
                rowR.appendChild(cR);
                uni.appendChild(rowR);
                continue;
            }

            if (Li.op === -1) {
                const row = el("div", "u-line rem");
                row.appendChild(el("div", "gutter", prefs.lineNumbers && Li.ln != null ? "−" + Li.ln : "−"));
                const cont = el("div", "content");
                const pre = el("pre");
                if (!prefs.wrap) pre.classList.add("nowrap");
                pre.innerHTML = '<span class="ch ch-rem">' + escapeHTML(Li.text) + "</span>";
                cont.appendChild(pre);
                row.appendChild(cont);
                uni.appendChild(row);
            }

            if (Ri.op === 1) {
                const row = el("div", "u-line add");
                row.appendChild(el("div", "gutter", prefs.lineNumbers && Ri.ln != null ? "+" + Ri.ln : "+"));
                const cont = el("div", "content");
                const pre = el("pre");
                if (!prefs.wrap) pre.classList.add("nowrap");
                pre.innerHTML = '<span class="ch ch-add">' + escapeHTML(Ri.text) + "</span>";
                cont.appendChild(pre);
                row.appendChild(cont);
                uni.appendChild(row);
            }
        }

        if (prefs.watermark) uni.appendChild(el("div", "wm", "DIFF-CONFIDENTIAL"));
        container.appendChild(uni);
        return { uni };
    }

    function markHunksInGrid(leftPane, rightPane, hunks, current) {
        if (!leftPane || !rightPane) return;
        $$("[data-hunk]", leftPane).forEach((n) => {
            n.removeAttribute("data-hunk");
            n.classList.remove("current");
        });
        $$("[data-hunk]", rightPane).forEach((n) => {
            n.removeAttribute("data-hunk");
            n.classList.remove("current");
        });
        for (let h = 0; h < hunks.length; h++) {
            const hk = hunks[h];
            for (let i = hk.from; i <= hk.to; i++) {
                if (leftPane.children[i]) leftPane.children[i].setAttribute("data-hunk", String(h));
                if (rightPane.children[i]) rightPane.children[i].setAttribute("data-hunk", String(h));
            }
        }
        if (typeof current === "number" && current >= 0 && hunks[current]) {
            for (let i = hunks[current].from; i <= hunks[current].to; i++) {
                leftPane.children[i]?.classList.add("current");
                rightPane.children[i]?.classList.add("current");
            }
        }
    }

    const scrollToHunk = (container, idx) => {
        const node =
            container.querySelector('.line[data-hunk="' + idx + '"]') ||
            container.querySelector('.u-line[data-hunk="' + idx + '"]');
        if (node) node.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    /* ---------- Vendor deps for export ---------- */
    async function getExportTools() {
        let h2i = window.htmlToImage;
        let jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        if (!h2i) {
            try {
                await loadScriptOnce("/assets/plugin/htmlotimage.js");
            } catch (_) {}
            h2i = window.htmlToImage;
        }
        if (!jsPDFCtor) {
            try {
                await loadScriptOnce("/assets/plugin/jspdf.js");
            } catch (_) {}
            jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        }
        return { h2i, jsPDFCtor };
    }

    /* ---------- Print (same-tab) ---------- */
    const PRINT_SANDBOX_ID = "trdv-print-sandbox";
    function ensurePrintStyles() {
        if (document.getElementById("trdv-print-style")) return;
        const st = document.createElement("style");
        st.id = "trdv-print-style";
        st.textContent = [
            "#" + PRINT_SANDBOX_ID + "{display:none}",
            "@media print{",
            "body>*:not(#" + PRINT_SANDBOX_ID + "){display:none!important}",
            "#" + PRINT_SANDBOX_ID + "{display:block!important}",
            "#" +
                PRINT_SANDBOX_ID +
                " .diff-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:1px!important;background:#ddd!important;position:relative!important}",
            "#" + PRINT_SANDBOX_ID + " .diff-unified{display:block!important}",
            "#" + PRINT_SANDBOX_ID + " .pane{background:#fff!important}",
            "#" +
                PRINT_SANDBOX_ID +
                " .line,#" +
                PRINT_SANDBOX_ID +
                " .u-line{display:grid!important;grid-template-columns:56px 1fr!important;border-bottom:1px solid #e5e7eb!important;font-size:13px!important}",
            "#" +
                PRINT_SANDBOX_ID +
                " .gutter{padding:6px 10px!important;color:#6b7280!important;border-right:1px solid #e5e7eb!important;text-align:right!important}",
            "#" +
                PRINT_SANDBOX_ID +
                " .content pre{margin:0!important;padding:8px 10px!important;white-space:pre-wrap!important;word-break:break-word!important;color:#111!important;background:transparent!important}",
            "#" +
                PRINT_SANDBOX_ID +
                " .line.add .content,#" +
                PRINT_SANDBOX_ID +
                " .u-line.add .content{background:rgba(16,185,129,.18)!important}",
            "#" +
                PRINT_SANDBOX_ID +
                " .line.rem .content,#" +
                PRINT_SANDBOX_ID +
                " .u-line.rem .content{background:rgba(239,68,68,.20)!important}",
            "#" +
                PRINT_SANDBOX_ID +
                " .wm{position:absolute;inset:0;pointer-events:none;display:grid;place-items:center;font-weight:800;font-size:64px;letter-spacing:2px;color:rgba(0,0,0,.06);transform:rotate(-18deg)}",
            "@page{margin:12mm}",
            "}",
        ].join("");
        document.head.appendChild(st);
    }
    function printNode(anyEl) {
        ensurePrintStyles();
        const old = document.getElementById(PRINT_SANDBOX_ID);
        if (old) old.remove();
        const sandbox = document.createElement("div");
        sandbox.id = PRINT_SANDBOX_ID;
        sandbox.appendChild(anyEl.cloneNode(true));
        document.body.appendChild(sandbox);
        void sandbox.offsetHeight; // reflow
        const cleanup = () => {
            window.removeEventListener("afterprint", cleanup);
            sandbox.remove();
        };
        window.addEventListener("afterprint", cleanup, { once: true });
        window.print();
        setTimeout(cleanup, 2000);
    }

    /* ---------- Snapshot: Base64 URL-safe ---------- */
    function toBase64Url(str) {
        try {
            const b64 = btoa(unescape(encodeURIComponent(str)));
            return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
        } catch (_) {
            return encodeURIComponent(str);
        }
    }
    function fromBase64Url(s) {
        try {
            const pad = s.length % 4 ? "====".slice(s.length % 4) : "";
            const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
            return decodeURIComponent(escape(atob(b64)));
        } catch (_) {
            try {
                return decodeURIComponent(s);
            } catch (__) {
                return "";
            }
        }
    }
    function encodeSnapshot(a, b, prefs) {
        const json = JSON.stringify({ v: 1, a, b, p: prefs });
        return "snap=" + toBase64Url(json);
    }
    function decodeSnapshot(hashOrQuery) {
        const s = String(hashOrQuery || "");
        const m = /(?:^|#|\?|&)snap=([^&]+)/.exec(s);
        if (!m) return null;
        try {
            return JSON.parse(fromBase64Url(m[1]));
        } catch (_) {
            return null;
        }
    }

    /* ---------- App ---------- */
    function run() {
        ensureStyles();

        const ui = {
            taA: $("#inputA"),
            taB: $("#inputB"),
            dropA: $("#dropA"),
            dropB: $("#dropB"),
            btnOpenA: $("#btnOpenA"),
            btnOpenB: $("#btnOpenB"),
            btnPasteA: $("#btnPasteA"),
            btnPasteB: $("#btnPasteB"),
            btnSwap: $("#btnSwap"),
            btnPrev: $("#btnPrev"),
            btnNext: $("#btnNext"),
            btnReset: $("#btnReset"),
            btnPNG: $("#btnPNG"),
            btnPDF: $("#btnPDF"),
            btnPrint: $("#btnPrint"),
            btnMode: $("#btnMode"),
            btnCopyDiff: $("#btnCopyDiff"),
            btnShare: $("#btnShare"),
            optWrap: $("#optWrap"),
            optLN: $("#optLineNum"),
            optWS: $("#optIgnoreWS"),
            optCase: $("#optIgnoreCase"),
            optEOL: $("#optNormalizeEOL"),
            optTrailing: $("#optIgnoreTrail"),
            optHC: $("#optHighContrast"),
            optWM: $("#optWatermark"),
            wrap: $("#diffWrap"),
            hunkCounter: $("#hunkCounter"),
        };

        // hidden file inputs
        let fileA = $("#fileA");
        let fileB = $("#fileB");
        if (!fileA) {
            fileA = document.createElement("input");
            fileA.type = "file";
            fileA.id = "fileA";
            fileA.hidden = true;
            fileA.accept =
                ".txt,.md,.json,.js,.ts,.jsx,.tsx,.py,.go,.java,.php,.css,.scss,.less,.html,.yml,.yaml,.xml,.sh,.bat,.ini,.toml,.sql";
            document.body.appendChild(fileA);
        }
        if (!fileB) {
            fileB = document.createElement("input");
            fileB.type = "file";
            fileB.id = "fileB";
            fileB.hidden = true;
            fileB.accept = fileA.accept;
            document.body.appendChild(fileB);
        }

        // prefs
        let prefs = loadPrefs();
        document.documentElement.classList.toggle("diff-contrast", !!prefs.hc);

        // snapshot dari URL (hash atau query)
        const snap = decodeSnapshot(location.hash || location.search);
        if (snap && typeof snap.a === "string" && typeof snap.b === "string" && snap.p) {
            prefs = { ...prefs, ...snap.p };
            if (ui.taA) ui.taA.value = snap.a;
            if (ui.taB) ui.taB.value = snap.b;
        }

        let state = {
            LEFT: [],
            RIGHT: [],
            hunks: [],
            curHunk: -1,
            dom: { grid: null, leftPane: null, rightPane: null, uni: null },
        };

        const updateCounter = () => {
            const n = state.hunks.length;
            const idx = state.curHunk >= 0 ? state.curHunk + 1 : 0;
            if (ui.hunkCounter) ui.hunkCounter.textContent = String(idx) + "/" + String(n);
        };

        const renderCore = () => {
            const A = ui.taA ? ui.taA.value || "" : "";
            const B = ui.taB ? ui.taB.value || "" : "";
            const { LEFT, RIGHT, hunks } = computeDiff(A, B, prefs);
            state.LEFT = LEFT;
            state.RIGHT = RIGHT;
            state.hunks = hunks;
            state.curHunk = hunks.length ? 0 : -1;

            if (prefs.mode === "unified") {
                state.dom = renderUnified(ui.wrap, LEFT, RIGHT, prefs);
                // mark hunks sederhana (by index range) untuk unified
                const rows = ui.wrap.querySelectorAll(".u-line");
                for (let h = 0; h < hunks.length; h++) {
                    for (let i = hunks[h].from; i <= hunks[h].to && rows[i]; i++) {
                        rows[i].setAttribute("data-hunk", String(h));
                        if (h === state.curHunk) rows[i].classList.add("current");
                    }
                }
            } else {
                state.dom = renderSideBySide(ui.wrap, LEFT, RIGHT, prefs);
                markHunksInGrid(state.dom.leftPane, state.dom.rightPane, hunks, state.curHunk);
            }

            if (state.curHunk >= 0) scrollToHunk(ui.wrap, state.curHunk);
            updateCounter();

            // debug ringan
            try {
                // eslint-disable-next-line no-console
                console.debug(
                    "[Diff]",
                    "A:",
                    human(bytes(A)),
                    "B:",
                    human(bytes(B)),
                    "Hunks:",
                    hunks.length,
                    "| Mode:",
                    prefs.mode
                );
            } catch (_) {}
        };
        const render = debounce(renderCore, 90);

        // Seed agar terlihat
        if (ui.taA && ui.taB && !ui.taA.value && !ui.taB.value) {
            ui.taA.value = "alpha\nbeta\ncharlie\n";
            ui.taB.value = "alpha\nBETA changed\ncharlie\n+ new line\n";
        }
        renderCore();

        /* ---- Bindings ---- */
        ui.taA?.addEventListener("input", render);
        ui.taB?.addEventListener("input", render);

        const hookDrop = (dz, ta) => {
            if (!dz || !ta) return;
            dz.addEventListener("dragover", (e) => {
                e.preventDefault();
                dz.classList.add("drag");
            });
            dz.addEventListener("dragleave", () => dz.classList.remove("drag"));
            dz.addEventListener("drop", async (e) => {
                e.preventDefault();
                dz.classList.remove("drag");
                const f = e.dataTransfer?.files?.[0];
                if (!f) return;
                ta.value = await f.text();
                render();
            });
            dz.addEventListener("paste", (e) => {
                const txt = e.clipboardData?.getData("text/plain");
                if (txt) {
                    ta.value = txt;
                    render();
                }
            });
        };
        hookDrop(ui.dropA, ui.taA);
        hookDrop(ui.dropB, ui.taB);

        ui.btnOpenA?.addEventListener("click", () => fileA.click());
        ui.btnOpenB?.addEventListener("click", () => fileB.click());
        fileA.addEventListener("change", async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            ui.taA.value = await f.text();
            e.target.value = "";
            render();
        });
        fileB.addEventListener("change", async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            ui.taB.value = await f.text();
            e.target.value = "";
            render();
        });

        ui.btnPasteA?.addEventListener("click", async () => {
            try {
                ui.taA.value = await navigator.clipboard.readText();
                render();
            } catch (_) {}
        });
        ui.btnPasteB?.addEventListener("click", async () => {
            try {
                ui.taB.value = await navigator.clipboard.readText();
                render();
            } catch (_) {}
        });

        ui.btnSwap?.addEventListener("click", () => {
            const t = ui.taA.value;
            ui.taA.value = ui.taB.value;
            ui.taB.value = t;
            render();
        });

        const goto = (idx) => {
            if (!state.hunks.length) return;
            const n = state.hunks.length;
            state.curHunk = ((idx % n) + n) % n;
            if (prefs.mode === "side" && state.dom.leftPane) {
                markHunksInGrid(state.dom.leftPane, state.dom.rightPane, state.hunks, state.curHunk);
                scrollToHunk(ui.wrap, state.curHunk);
            } else {
                const start = state.hunks[state.curHunk].from;
                const rows = ui.wrap.querySelectorAll(".u-line");
                rows[start]?.scrollIntoView({ behavior: "smooth", block: "center" });
                rows.forEach((r) => r.classList.remove("current"));
                for (let i = state.hunks[state.curHunk].from; i <= state.hunks[state.curHunk].to; i++) {
                    rows[i]?.classList.add("current");
                }
            }
            updateCounter();
        };
        ui.btnPrev?.addEventListener("click", () => goto(state.curHunk - 1));
        ui.btnNext?.addEventListener("click", () => goto(state.curHunk + 1));

        // Toggle mode
        ui.btnMode?.addEventListener("click", () => {
            prefs.mode = prefs.mode === "side" ? "unified" : "side";
            savePrefs(prefs);
            const lbl = ui.btnMode.querySelector(".label");
            if (lbl) lbl.textContent = prefs.mode === "side" ? "Unified" : "Side-by-side";
            renderCore();
        });
        {
            const lbl = ui.btnMode?.querySelector(".label");
            if (lbl) lbl.textContent = prefs.mode === "side" ? "Unified" : "Side-by-side";
        }

        // Export PNG
        ui.btnPNG?.addEventListener("click", async () => {
            const { h2i } = await getExportTools();
            const node = ui.wrap.querySelector(".diff-grid, .diff-unified");
            if (!h2i?.toPng || !node) {
                alert("PNG export not available.");
                return;
            }
            const dataUrl = await h2i.toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff" });
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = "diff.png";
            document.body.appendChild(a);
            a.click();
            a.remove();
        });

        // Export PDF
        ui.btnPDF?.addEventListener("click", async () => {
            const { h2i, jsPDFCtor } = await getExportTools();
            const node = ui.wrap.querySelector(".diff-grid, .diff-unified");
            if (!h2i?.toPng || !jsPDFCtor || !node) {
                alert("PDF export not available.");
                return;
            }
            const dataUrl = await h2i.toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff" });
            const pdf = new jsPDFCtor({ unit: "pt", format: "a4" });
            const pw = pdf.internal.pageSize.getWidth();
            const ph = pdf.internal.pageSize.getHeight();
            const size = await new Promise((res) => {
                const img = new Image();
                img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
                img.src = dataUrl;
            });
            const m = 24;
            const scale = Math.min((pw - m * 2) / size.w, (ph - m * 2) / size.h, 1);
            const w = size.w * scale;
            const h = size.h * scale;
            pdf.addImage(dataUrl, "PNG", (pw - w) / 2, (ph - h) / 2, w, h);
            pdf.save("diff.pdf");
        });

        // Print
        ui.btnPrint?.addEventListener("click", () => {
            const node = ui.wrap.querySelector(".diff-grid, .diff-unified");
            if (!node) {
                alert("Nothing to print.");
                return;
            }
            printNode(node);
        });

        // Reset
        ui.btnReset?.addEventListener("click", () => {
            ui.taA.value = "";
            ui.taB.value = "";
            render();
        });

        // Options
        const bind = (el, key, after) => {
            if (!el) return;
            el.checked = !!prefs[key];
            el.addEventListener("change", () => {
                prefs[key] = !!el.checked;
                savePrefs(prefs);
                if (key === "hc") document.documentElement.classList.toggle("diff-contrast", !!prefs.hc);
                if (after) after();
                render();
            });
        };
        bind(ui.optWrap, "wrap");
        bind(ui.optLN, "lineNumbers");
        bind(ui.optWS, "ignoreWhitespace");
        bind(ui.optCase, "ignoreCase");
        bind(ui.optEOL, "ignoreEOL");
        bind(ui.optTrailing, "ignoreTrailing");
        bind(ui.optHC, "hc", () => document.documentElement.classList.toggle("diff-contrast", !!prefs.hc));
        bind(ui.optWM, "watermark");

        // Hotkeys
        document.addEventListener("keydown", (e) => {
            if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                if (e.key === "ArrowUp") {
                    e.preventDefault();
                    ui.btnPrev?.click();
                } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    ui.btnNext?.click();
                } else if (e.key.toLowerCase() === "s") {
                    e.preventDefault();
                    ui.btnSwap?.click();
                }
            }
        });

        // Copy diff (plain unified text)
        function buildUnifiedPlain(LEFT, RIGHT) {
            const out = [];
            out.push("--- A");
            out.push("+++ B");
            const N = Math.max(LEFT.length, RIGHT.length);
            for (let i = 0; i < N; i++) {
                const Ls = LEFT[i] || { op: 0, text: "" };
                const Rs = RIGHT[i] || { op: 0, text: "" };
                if (Ls.op === 0 && Rs.op === 0 && Ls.text === Rs.text) {
                    out.push(" " + Ls.text);
                    continue;
                }
                if (Ls.op === "modL" && Rs.op === "modR") {
                    out.push("- " + Ls.text);
                    out.push("+ " + Rs.text);
                    continue;
                }
                if (Ls.op === -1) out.push("- " + Ls.text);
                if (Rs.op === 1) out.push("+ " + Rs.text);
            }
            return out.join("\n");
        }
        ui.btnCopyDiff?.addEventListener("click", async () => {
            const txt = buildUnifiedPlain(state.LEFT, state.RIGHT);
            try {
                await navigator.clipboard.writeText(txt);
                alert("Diff copied");
            } catch (_) {
                alert("Clipboard blocked");
            }
        });

        // Share snapshot (prefs + inputs → URL)
        ui.btnShare?.addEventListener("click", async () => {
            const hash = encodeSnapshot(ui.taA.value || "", ui.taB.value || "", prefs);
            const url = location.origin + location.pathname + "#" + hash;
            try {
                history.replaceState(null, "", "#" + hash);
            } catch (_) {}
            try {
                await navigator.clipboard.writeText(url);
                alert("Share URL copied");
            } catch (_) {
                alert("Share URL ready in address bar");
            }
        });

        // i18n placeholders
        if (ui.taA) ui.taA.placeholder = t("diff.placeholderA", "Paste or drop LEFT (A)…");
        if (ui.taB) ui.taB.placeholder = t("diff.placeholderB", "Paste or drop RIGHT (B)…");
        document.addEventListener("trhc:i18nUpdated", () => {
            if (ui.taA) ui.taA.placeholder = t("diff.placeholderA", "Paste or drop LEFT (A)…");
            if (ui.taB) ui.taB.placeholder = t("diff.placeholderB", "Paste or drop RIGHT (B)…");
        });
    }

    const boot = () => {
        // pastikan lib diff-match-patch sudah ada jika kamu load-defer
        if (!window.diff_match_patch) {
            loadScriptOnce("/assets/plugin/diff-match-patch.js").finally(() => run());
            return;
        }
        run();
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
