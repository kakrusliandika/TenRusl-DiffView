/* header.js — binds header controls, SW */
(function () {
    document.documentElement.classList.remove("no-js");

    const btnTheme = document.getElementById("btnTheme");
    const btnUiLang = document.getElementById("btnUiLang");

    if (btnTheme) btnTheme.addEventListener("click", () => window.TRTheme && TRTheme.toggleTheme());
    if (btnUiLang) btnUiLang.addEventListener("click", () => window.TRI18N && TRI18N.toggleUiLang());

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch(() => {
            /* ignore */
        });
    }
})();
