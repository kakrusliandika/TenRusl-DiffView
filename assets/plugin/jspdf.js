/* TRHC Vendor Loader — jsPDF (MIT)
   - Pin: jspdf@2.5.1 UMD
   - Global after load: window.jspdf.jsPDF (constructor)
   - Cached by SW → offline setelah first run
*/
(function () {
    "use strict";

    const SRC = "/assets/plugin/additional/jspdf.umd.js";
    const G = typeof window !== "undefined" ? window : self;

    function loadOnce(src) {
        return new Promise((resolve, reject) => {
            // UMD puts ctor at window.jspdf.jsPDF
            if (G.jspdf && G.jspdf.jsPDF) return resolve(G.jspdf.jsPDF);
            const existing = document.querySelector(`script[data-vendor="${src}"]`);
            if (existing) {
                existing.addEventListener("load", () => resolve(G.jspdf && G.jspdf.jsPDF));
                existing.addEventListener("error", reject);
                return;
            }
            const s = document.createElement("script");
            s.async = true;
            s.src = src;
            s.setAttribute("data-vendor", src);
            s.onload = () => resolve(G.jspdf && G.jspdf.jsPDF);
            s.onerror = () => reject(new Error("Failed to load jsPDF from CDN"));
            document.head.appendChild(s);
        });
    }

    G.TRVENDORS = G.TRVENDORS || {};
    /** Resolves to the jsPDF constructor (use: const doc = new jsPDF(...)) */
    G.TRVENDORS.jsPDFReady = async function () {
        if (G.jspdf && G.jspdf.jsPDF) return G.jspdf.jsPDF;
        return await loadOnce(SRC);
    };
})();
