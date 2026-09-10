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
      .normalize("NFC")
      .replace(/[\u2010-\u2015]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeForMatch(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es-ES");
  }

  function detectSport(line) {
    const value = normalizeForMatch(line);
    const sports = [
      ["Fútbol sala", /\bfutbol sala\b/],
      ["Fútbol americano", /\b(futbol americano|nfl)\b/],
      ["Baloncesto", /\b(baloncesto|basket|nba|acb|euroliga)\b/],
      ["Tenis", /\b(tenis|atp|wta)\b/],
      ["Ciclismo", /\b(ciclismo|vuelta a espana|tour de france|giro de italia)\b/],
      ["Motor", /\b(motor|formula 1|f1|motogp|automovilismo|rally)\b/],
      ["Golf", /\bgolf\b/],
      ["Balonmano", /\b(balonmano|handball)\b/],
      ["Rugby", /\brugby\b/],
      ["Hockey", /\bhockey\b/],
      ["Voleibol", /\b(voleibol|volleyball)\b/],
      ["Atletismo", /\batletismo\b/],
      ["Pádel", /\b(padel)\b/],
      ["Boxeo y MMA", /\b(boxeo|mma|ufc)\b/],
      ["Fútbol", /\b(futbol|champions|copa libertadores|copa sudamericana|laliga|premier league|bundesliga|primera federacion)\b/]
    ];
    const match = sports.find(function (sport) { return sport[1].test(value); });
    return match ? match[0] : "";
  }

  function isRedundantSportTag(value, sport) {
    const normalized = normalizeForMatch(value);
    const tags = {
      "Fútbol": ["futbol"],
      "Fútbol sala": ["futbol sala"],
      "Fútbol americano": ["futbol americano", "nfl"],
      "Baloncesto": ["baloncesto", "basket"],
      "Tenis": ["tenis"],
      "Ciclismo": ["ciclismo"],
      "Motor": ["motor", "automovilismo"],
      "Golf": ["golf"],
      "Balonmano": ["balonmano", "handball"],
      "Rugby": ["rugby"],
      "Hockey": ["hockey"],
      "Voleibol": ["voleibol", "volleyball"],
      "Atletismo": ["atletismo"],
      "Pádel": ["padel"],
      "Boxeo y MMA": ["boxeo", "mma"]
    };
    return normalized === "otros" || (tags[sport] || []).includes(normalized);
  }

  function cleanEventForGroup(line, sport) {
    const parts = line.split(/\s*·\s*/).map(cleanLine).filter(Boolean);
    if (parts.length < 3) return line;
    return parts.filter(function (part, index) {
      return index < 2 || !isRedundantSportTag(part, sport);
    }).join(" · ");
  }

  function looksLikeChannel(value) {
    const normalized = normalizeForMatch(value);
    return /^(m\+|movistar|dazn|teledeporte|la 1|la 2|rtve|eurosport|gol(?: play)?|max|amazon|prime video|disney\+?|youtube|laliga tv|real madrid tv|barca tv|esport 3|tnt|vamos)\b/.test(normalized);
  }

  function splitEventDetails(line) {
    const parts = line.split(/\s*·\s*/).map(cleanLine).filter(Boolean);
    let channel = "";

    if (parts.length >= 4 || (parts.length >= 3 && looksLikeChannel(parts[parts.length - 1]))) {
      channel = parts.pop();
    }

    let time = "";
    const timeMatch = (parts[0] || "").match(/^([01]?\d|2[0-3])[:.]([0-5]\d)$/);
    if (timeMatch) {
      time = timeMatch[1].padStart(2, "0") + ":" + timeMatch[2];
      parts.shift();
    }

    return {
      time: time,
      description: parts.join(" · ") || line,
      channel: channel
    };
  }

  function createEventLayout(line) {
    const details = splitEventDetails(line);
    const layout = document.createElement("div");
    layout.className = "agenda-event-layout";

    const info = document.createElement("div");
    info.className = "agenda-event-info";

    if (details.time) {
      const time = document.createElement("time");
      time.textContent = details.time;
      info.appendChild(time);
    }

    const description = document.createElement("span");
    description.className = "agenda-event-description";
    description.textContent = details.description;
    info.appendChild(description);
    layout.appendChild(info);

    if (details.channel) {
      const channel = document.createElement("span");
      channel.className = "agenda-channel-badge";
      const label = document.createElement("span");
      label.textContent = "VER EN";
      const name = document.createElement("strong");
      name.textContent = details.channel;
      channel.append(label, name);
      layout.appendChild(channel);
    }

    return layout;
  }

  function classify(line) {
    if (/^[-_=]{4,}$/.test(line)) return "divider";
    if (/^\(?\s*\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\s*\)?(?:\s+|$)/.test(line)) return "date";
    if (/^(f[uú]tbol|tenis|ciclismo|baloncesto|motor|f[oó]rmula|motogp|golf|boxeo|mma|otros)\s*:/i.test(line)) return "section";
    if (!/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/.test(line) && /:$/.test(line)) return "section";
    return "event";
  }

  function removeLeadingDate(line) {
    return line
      .replace(/^\(?\s*\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\s*\)?\s*(?:[-–—|:]\s*)?/, "")
      .trim();
  }

  function formatAgendaDate(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const parts = new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).formatToParts(date);
    const part = function (type) {
      const match = parts.find(function (item) { return item.type === type; });
      return match ? match.value : "";
    };

    const label = part("weekday") + " · " + part("day") + " de " + part("month") + " de " + part("year");
    return label.charAt(0).toLocaleUpperCase("es-ES") + label.slice(1);
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

    const groups = new Map();
    let activeSection = "";

    lines.forEach(function (line) {
      let type = classify(line);
      if (type === "date") {
        line = removeLeadingDate(line);
        if (!line) return;
        type = "section";
      }
      if (type === "divider") return;
      if (type === "section") {
        activeSection = detectSport(line) || line.replace(/:$/, "").trim();
        return;
      }

      const sport = detectSport(line) || activeSection || "Otros deportes";
      if (!groups.has(sport)) groups.set(sport, []);
      groups.get(sport).push(cleanEventForGroup(line, sport));
    });

    const groupsContainer = document.createElement("div");
    groupsContainer.className = "agenda-groups";

    groups.forEach(function (events, sport) {
      const section = document.createElement("section");
      section.className = "agenda-sport-group";

      const heading = document.createElement("div");
      heading.className = "agenda-sport-heading";
      const title = document.createElement("h3");
      title.textContent = sport;
      const count = document.createElement("span");
      count.textContent = events.length + (events.length === 1 ? " evento" : " eventos");
      heading.append(title, count);

      const table = document.createElement("table");
      table.className = "agenda-table";
      table.setAttribute("aria-label", "Eventos de " + sport);
      const tbody = document.createElement("tbody");

      events.forEach(function (line) {
        const row = document.createElement("tr");
        row.className = "agenda-event";
        const cell = document.createElement("td");
        cell.appendChild(createEventLayout(line));
        row.appendChild(cell);
        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      section.append(heading, table);
      groupsContainer.appendChild(section);
    });

    target.appendChild(groupsContainer);
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

  window.SpinningTV = {
    renderAgenda: renderAgenda,
    browserName: browserName,
    formatAgendaDate: formatAgendaDate
  };
})();
