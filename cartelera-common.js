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
      title: parts.shift() || line,
      competition: parts.join(" · "),
      channel: channel
    };
  }

  function eventKey(time, title) {
    return cleanLine(String(time || "") + "|" + String(title || "")).toLocaleLowerCase("es-ES");
  }

  function timeToMinutes(value) {
    const match = String(value || "").match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : -1;
  }

  function madridMinutes() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());
    const hour = Number((parts.find(function (part) { return part.type === "hour"; }) || {}).value || 0);
    const minute = Number((parts.find(function (part) { return part.type === "minute"; }) || {}).value || 0);
    return hour * 60 + minute;
  }

  function countdownLabel(minutes) {
    if (minutes <= 0) return "Empieza ahora";
    if (minutes < 60) return "Empieza en " + minutes + " min";
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return "Empieza en " + hours + " h" + (rest ? " " + rest + " min" : "");
  }

  function sportAccentClass(sport) {
    const value = normalizeForMatch(sport);
    if (/tenis|padel/.test(value)) return "sport-purple";
    if (/golf/.test(value)) return "sport-gold";
    if (/motor|formula|motogp/.test(value)) return "sport-orange";
    if (/baloncesto/.test(value)) return "sport-red";
    if (/ciclismo|atletismo/.test(value)) return "sport-green";
    if (/futbol sala|balonmano/.test(value)) return "sport-blue";
    return "sport-cyan";
  }

  function estimatedDuration(sport) {
    const value = normalizeForMatch(sport);
    if (value.includes("futbol americano")) return 210;
    if (value.includes("futbol sala")) return 110;
    if (value.includes("futbol")) return 120;
    if (value.includes("baloncesto")) return 135;
    if (value.includes("tenis")) return 180;
    if (value.includes("padel")) return 150;
    if (value.includes("ciclismo")) return 300;
    if (value.includes("golf")) return 360;
    if (value.includes("motor")) return 150;
    if (value.includes("balonmano")) return 110;
    if (value.includes("rugby") || value.includes("hockey")) return 120;
    if (value.includes("voleibol")) return 150;
    if (value.includes("atletismo")) return 180;
    if (value.includes("boxeo") || value.includes("mma")) return 240;
    return 120;
  }

  function sportForRow(row) {
    const group = row.closest(".agenda-sport-group");
    const heading = group ? group.querySelector(".agenda-sport-heading h3") : null;
    return heading ? heading.textContent.trim() : "Otros deportes";
  }

  function createEventLayout(line, eventUpdates) {
    const details = splitEventDetails(line);
    const layout = document.createElement("div");
    layout.className = "agenda-event-layout";

    const info = document.createElement("div");
    info.className = "agenda-event-info";

    if (details.time) {
      const time = document.createElement("time");
      time.textContent = details.time;
      info.appendChild(time);
    } else {
      info.className += " no-time";
    }

    const description = document.createElement("span");
    description.className = "agenda-event-description";
    const title = document.createElement("strong");
    title.className = "agenda-event-title";
    title.textContent = details.title;
    description.appendChild(title);

    if (details.competition) {
      const competition = document.createElement("span");
      competition.className = "agenda-event-competition";
      competition.textContent = details.competition;
      description.appendChild(competition);
    }

    const flags = document.createElement("span");
    flags.className = "agenda-event-flags";
    const update = eventUpdates[eventKey(details.time, details.title)];
    if (update && update.slot && update.slot !== "00:05") {
      const newBadge = document.createElement("span");
      newBadge.className = "agenda-new-badge";
      const newDot = document.createElement("span");
      newDot.className = "agenda-new-dot";
      newDot.setAttribute("aria-hidden", "true");
      const newText = document.createElement("span");
      newText.textContent = "NUEVO · añadido " + update.slot;
      newBadge.append(newDot, newText);
      flags.appendChild(newBadge);
    }
    if (flags.childElementCount) description.appendChild(flags);

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

  function updateNextEvent(target) {
    const rows = Array.from(target.querySelectorAll(".agenda-event[data-event-minutes]"));
    const now = madridMinutes();
    rows.forEach(function (row) {
      row.classList.remove("is-next");
      const minutes = Number(row.dataset.eventMinutes);
      const finished = Number.isFinite(minutes) && now >= minutes + estimatedDuration(sportForRow(row));
      row.hidden = finished;
      row.classList.toggle("is-past", !finished && Number.isFinite(minutes) && minutes < now);
      const oldBadge = row.querySelector(".agenda-next-badge");
      if (oldBadge) oldBadge.remove();
      const flags = row.querySelector(".agenda-event-flags");
      if (flags && !flags.childElementCount) flags.remove();
    });

    rows.forEach(function (row) {
      if (row.hidden) return;
      const eventMinutes = Number(row.dataset.eventMinutes);
      const remainingMinutes = eventMinutes - now;
      if (!Number.isFinite(eventMinutes) || remainingMinutes < 0 || remainingMinutes > 60) return;
      row.classList.add("is-next");
      const description = row.querySelector(".agenda-event-description");
      if (!description) return;
      let flags = description.querySelector(".agenda-event-flags");
      if (!flags) {
        flags = document.createElement("span");
        flags.className = "agenda-event-flags";
        description.appendChild(flags);
      }
      const badge = document.createElement("span");
      badge.className = "agenda-next-badge";
      const label = document.createElement("strong");
      label.textContent = "PRÓXIMO";
      const countdown = document.createElement("span");
      countdown.textContent = countdownLabel(remainingMinutes);
      badge.append(label, countdown);
      flags.prepend(badge);
    });

    Array.from(target.querySelectorAll(".agenda-sport-group")).forEach(function (group) {
      const visibleEvents = Array.from(group.querySelectorAll(".agenda-event")).filter(function (row) {
        return !row.hidden;
      });
      group.hidden = !visibleEvents.length;
      const count = group.querySelector(".agenda-sport-heading > span");
      if (count) {
        count.textContent = visibleEvents.length + (visibleEvents.length === 1 ? " evento" : " eventos");
      }
    });
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

  function renderAgenda(text, target, options) {
    const eventUpdates = options && options.eventUpdates && typeof options.eventUpdates === "object"
      ? options.eventUpdates
      : {};
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
      section.className = "agenda-sport-group " + sportAccentClass(sport);

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
        const details = splitEventDetails(line);
        const minutes = timeToMinutes(details.time);
        if (minutes >= 0) row.dataset.eventMinutes = String(minutes);
        const cell = document.createElement("td");
        cell.appendChild(createEventLayout(line, eventUpdates));
        if (cell.querySelector(".agenda-new-badge")) row.classList.add("has-new-update");
        row.appendChild(cell);
        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      section.append(heading, table);
      groupsContainer.appendChild(section);
    });

    target.appendChild(groupsContainer);
    if (options && options.highlightNext) updateNextEvent(target);
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
    updateNextEvent: updateNextEvent,
    estimatedDuration: estimatedDuration,
    browserName: browserName,
    formatAgendaDate: formatAgendaDate
  };
})();
