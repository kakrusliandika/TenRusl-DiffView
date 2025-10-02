/* TRHC Vendor Loader — html-to-image (MIT)
   - Global after load: window.htmlToImage
   - Pin: html-to-image@1.11.11 UMD build
   - Cached by SW → offline setelah first run
*/
(function () {
    "use strict";

    const SRC = "/assets/plugin/additional/html-to-image.js";
    const G = typeof window !== "undefined" ? window : self;

    function loadOnce(src) {
        return new Promise((resolve, reject) => {
            if (G.htmlToImage) return resolve(G.htmlToImage);
            const existing = document.querySelector(`script[data-vendor="${src}"]`);
            if (existing) {
                existing.addEventListener("load", () => resolve(G.htmlToImage));
                existing.addEventListener("error", reject);
                return;
            }
            const s = document.createElement("script");
            s.async = true;
            s.src = src;
            s.setAttribute("data-vendor", src);
            s.onload = () => resolve(G.htmlToImage);
            s.onerror = () => reject(new Error("Failed to load html-to-image from CDN"));
            document.head.appendChild(s);
        });
    }

    G.TRVENDORS = G.TRVENDORS || {};
    /** Returns the global htmlToImage object (with toBlob/toPng/etc.) */
    G.TRVENDORS.htmlToImageReady = async function () {
        if (G.htmlToImage) return G.htmlToImage;
        return await loadOnce(SRC);
    };
})();
