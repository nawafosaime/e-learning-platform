export function showMessage(element, message, type = "info") {
  element.className = `alert alert-${type}`;
  element.textContent = message;
  element.classList.remove("d-none");
}

export function hideMessage(element) {
  element.classList.add("d-none");
  element.textContent = "";
}

export function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

export function badge(text) {
  return `<span class="badge badge-soft">${escapeHtml(text)}</span>`;
}
