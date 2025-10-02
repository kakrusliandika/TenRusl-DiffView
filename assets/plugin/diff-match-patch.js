/* TRHC Vendor Loader — diff-match-patch (Apache-2.0)
   - Pins original Google source (global: window.diff_match_patch)
   - Cached by your SW (runtime cache, SWR), works offline after first hit
*/
(function () {
    "use strict";

    const SRC = "/assets/plugin/additional/diff_match_patch.js";
    const G = typeof window !== "undefined" ? window : self;

    function loadOnce(src) {
        return new Promise((resolve, reject) => {
            if (G.diff_match_patch) return resolve(G.diff_match_patch);
            // Avoid duplicate loads
            const existing = document.querySelector(`script[data-vendor="${src}"]`);
            if (existing) {
                existing.addEventListener("load", () => resolve(G.diff_match_patch));
                existing.addEventListener("error", reject);
                return;
            }
            const s = document.createElement("script");
            s.async = true;
            s.src = src;
            s.setAttribute("data-vendor", src);
            s.onload = () => resolve(G.diff_match_patch);
            s.onerror = () => reject(new Error("Failed to load diff-match-patch from CDN"));
            document.head.appendChild(s);
        });
    }

    G.TRVENDORS = G.TRVENDORS || {};
    G.TRVENDORS.diffMatchPatchReady = async function () {
        if (G.diff_match_patch) return G.diff_match_patch;
        return await loadOnce(SRC);
    };
})();
