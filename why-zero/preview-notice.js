"use strict";

const notice = document.createElement("small");
notice.textContent = "Preview only. This form does not register you with Zero University.";
notice.setAttribute("role", "note");

function placePreviewNotice() {
  const form = document.querySelector(".jf-panel .jf-form");
  if (form && !form.contains(notice)) form.prepend(notice);
  if (!form) notice.remove();
}

const style = document.createElement("style");
style.textContent = `
  .jf-form > small[role="note"] {
    display: block;
    color: #443d43;
    font: 500 12px/1.4 Inter, system-ui, sans-serif;
    margin-bottom: .3rem;
  }
  #zero-graphics-note {
    position: fixed;
    z-index: 20;
    left: 50%;
    top: 42%;
    transform: translate(-50%, -50%);
    width: min(85%, 29rem);
    padding: 1rem 1.2rem;
    border-radius: 1rem;
    color: #f4faf4;
    background: #13362f;
    font: 500 1rem/1.5 system-ui, sans-serif;
    text-align: center;
  }
`;
document.head.append(style);
new MutationObserver(placePreviewNotice).observe(document.body, { childList: true, subtree: true });

const canvas = document.getElementById("webgl");
canvas.addEventListener("webglcontextcreationerror", () => {
  // The renderer tries several context types before declaring a failure.
  window.setTimeout(() => {
    if (canvas.style.width || document.getElementById("zero-graphics-note")) return;
    const help = document.createElement("p");
    help.id = "zero-graphics-note";
    help.setAttribute("role", "alert");
    help.textContent = "Why Zero needs WebGL. Open this link in a current browser with hardware acceleration enabled.";
    document.body.append(help);
  }, 700);
}, { once: true });
