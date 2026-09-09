(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function cleanLine(line) {
    return line
      .replace(/[\u2010-\u2015]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }

  function highlightTimes(line) {
    const safe = escapeHtml(line);
    return safe.replace(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/g, function (_, hour, minute) {
      return '<time>' + hour.padStart(2, "0") + ":" + minute + "</time>";
    });
  }

  function classify(line) {
    if (/^[-_=]{4,}$/.test(line)) return "divider";
    if (/^\(?\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\)?(?:\s+|$)/.test(line)) return "date";
    if (/^(f[uú]tbol|tenis|ciclismo|baloncesto|motor|f[oó]rmula|motogp|golf|boxeo|mma|otros)\s*:/i.test(line)) return "section";
    if (!/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/.test(line) && /:$/.test(line)) return "section";
    return "event";
  }

  function renderAgenda(text, target) {
    const lines = String(text || "")
      .split(/\r?\n/)
      .map(cleanLine)
      .filter(Boolean);

    target.replaceChildren();

    if (!lines.length) {
      target.innerHTML = '<div class="empty-agenda">No hay eventos publicados en este momento.</div>';
      return;
    }

    const table = document.createElement("table");
    table.className = "agenda-table";
    table.setAttribute("aria-label", "Cartelera de eventos");
    const tbody = document.createElement("tbody");

    lines.forEach(function (line) {
      const type = classify(line);
      if (type === "divider") {
        const divider = document.createElement("tr");
        divider.className = "agenda-divider";
        divider.innerHTML = '<td><span></span></td>';
        tbody.appendChild(divider);
        return;
      }

      const row = document.createElement("tr");
      row.className = "agenda-" + type;
      const cell = document.createElement("td");
      cell.innerHTML = highlightTimes(line);
      row.appendChild(cell);
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    target.appendChild(table);
  }

  function browserName() {
    const ua = navigator.userAgent;
    if (/OPR\//.test(ua)) return "Opera";
    if (/Edg\//.test(ua)) return "Microsoft Edge";
    if (/Chrome\//.test(ua)) return "Google Chrome";
    if (/Firefox\//.test(ua)) return "Firefox";
    if (/Safari\//.test(ua)) return "Safari";
    return "este navegador";
  }

  window.SpinningTV = { renderAgenda: renderAgenda, browserName: browserName };
})();
