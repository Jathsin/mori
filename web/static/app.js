(() => {
  const meeting = new Date("2024-11-14T00:00:00Z");
  const lifeStart = Date.UTC(2005, 0, 15);
  const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;
  const storageKey = "memore-moments-v1";
  const seasonStorageKey = "memore-seasons-v1";
  const portraitStorageKey = "memore-portraits-v1";
  const seasonColors = [
    "#a9473f", "#d89aa3", "#c87847", "#b84e68", "#e0a078", "#8f4656",
    "#d97964", "#ad6d78", "#df8b58", "#c65378", "#b86b4f", "#e2afb0",
  ];
  const memore = document.querySelector(".memore");
  const grid = document.querySelector("#life-grid");
  const portraits = document.querySelector(".portraits");
  const lineCanvas = document.querySelector("#life-lines");
  const dialog = document.querySelector("#moment-dialog");
  const form = document.querySelector("#moment-form");
  const dateInput = document.querySelector("#moment-date");
  const descriptionInput = document.querySelector("#moment-description");
  const imageInput = document.querySelector("#moment-image");
  const note = document.querySelector("#moment-note");
  const counter = document.querySelector(".counter");
  const detailDialog = document.querySelector("#moment-detail");
  const detailDate = document.querySelector("#detail-date");
  const detailDescription = document.querySelector("#detail-description");
  const detailImage = document.querySelector("#detail-image");
  const seasonDialog = document.querySelector("#season-dialog");
  const seasonForm = document.querySelector("#season-form");
  const seasonStartInput = document.querySelector("#season-start");
  const seasonEndInput = document.querySelector("#season-end");
  const seasonLabelInput = document.querySelector("#season-label");
  const portraitDialog = document.querySelector("#portrait-dialog");
  const portraitForm = document.querySelector("#portrait-form");
  const portraitKeyInput = document.querySelector("#portrait-key");
  const portraitDateInput = document.querySelector("#portrait-date");
  const portraitImageInput = document.querySelector("#portrait-image");
  const seasonList = document.querySelector("#season-list");
  let detailImageURL;
  const portraitImageURLs = new Map();
  let expandedSeasonId;
  let pendingSeasonColor;
  const fields = {
    days: document.querySelector("#days"),
    hours: document.querySelector("#hours"),
    minutes: document.querySelector("#minutes"),
    seconds: document.querySelector("#seconds"),
  };

  function updateCounter() {
    const elapsed = Math.max(0, Math.floor((Date.now() - meeting.getTime()) / 1000));
    const days = Math.floor(elapsed / 86400);
    const hours = Math.floor((elapsed % 86400) / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    fields.days.textContent = String(days).padStart(3, "0");
    fields.hours.textContent = String(hours).padStart(2, "0");
    fields.minutes.textContent = String(minutes).padStart(2, "0");
    fields.seconds.textContent = String(seconds).padStart(2, "0");

    counter.setAttribute("aria-label", "Tiempo juntos desde el 14 de noviembre de 2024");
  }

  function drawLifeLines() {
    const bounds = memore.getBoundingClientRect();
    const height = memore.scrollHeight;
    const ratio = window.devicePixelRatio || 1;
    lineCanvas.width = Math.round(bounds.width * ratio);
    lineCanvas.height = Math.round(height * ratio);
    lineCanvas.style.height = `${height}px`;

    const context = lineCanvas.getContext("2d");
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, bounds.width, height);
    context.strokeStyle = "rgba(26, 23, 19, 0.24)";
    context.fillStyle = "rgba(26, 23, 19, 0.34)";
    context.lineWidth = 0.65;

    document.querySelectorAll(".portrait-button img").forEach((portraitElement) => {
      const portrait = portraitElement.getBoundingClientRect();
      const targetWeek = Math.min(grid.children.length - 1, Math.max(0, weekIndex(portraitElement.dataset.birthDate)));
      const square = grid.children[targetWeek].getBoundingClientRect();
      const startX = portrait.left + portrait.width / 2 - bounds.left;
      const startY = portrait.bottom - bounds.top;
      const endX = square.left + square.width / 2 - bounds.left;
      const endY = square.top + square.height / 2 - bounds.top;

      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(startX, startY + 7);
      context.lineTo(endX, endY - 5);
      context.lineTo(endX, endY);
      context.stroke();

      context.beginPath();
      context.arc(endX, endY, 1.15, 0, Math.PI * 2);
      context.fill();
    });
  }

  function todayString() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function setDateWheel(input) {
    const wheel = document.querySelector(`[data-date-wheel="${input.id}"]`);
    if (!wheel || !input.value) return;
    const [year, month, day] = input.value.split("-");
    setDateWheelField(wheel.querySelector(".date-wheel-day"), Number(day));
    setDateWheelField(wheel.querySelector(".date-wheel-month"), Number(month));
    setDateWheelField(wheel.querySelector(".date-wheel-year"), Number(year));
  }

  function syncDateWheel(wheel) {
    const year = Number(wheel.querySelector(".date-wheel-year").dataset.value);
    const month = Number(wheel.querySelector(".date-wheel-month").dataset.value);
    const chosenDay = Number(wheel.querySelector(".date-wheel-day").dataset.value);
    const maximumDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const day = Math.min(chosenDay, maximumDay);
    const input = document.querySelector(`#${wheel.dataset.dateWheel}`);
    input.value = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (day !== chosenDay) setDateWheelField(wheel.querySelector(".date-wheel-day"), day);
  }

  function setDateWheelField(field, value) {
    const minimum = Number(field.dataset.min);
    const maximum = field.dataset.unit === "year"
      ? Math.min(Number(field.dataset.max), new Date().getFullYear())
      : Number(field.dataset.max);
    const range = maximum - minimum + 1;
    const wrapped = minimum + ((((value - minimum) % range) + range) % range);
    field.dataset.value = String(wrapped);
    field.replaceChildren();
    [-1, 0, 1].forEach((offset) => {
      const neighboringValue = minimum + ((((wrapped + offset - minimum) % range) + range) % range);
      const valueElement = document.createElement("span");
      valueElement.className = `date-wheel-value${offset === 0 ? " current" : ""}`;
      valueElement.textContent = field.dataset.unit === "year"
        ? String(neighboringValue)
        : String(neighboringValue).padStart(2, "0");
      field.append(valueElement);
    });
    field.setAttribute("aria-valuemin", String(minimum));
    field.setAttribute("aria-valuemax", String(maximum));
    field.setAttribute("aria-valuenow", String(wrapped));
    field.setAttribute("aria-valuetext", field.querySelector(".current").textContent);
  }

  function moveDateWheelField(field, amount) {
    setDateWheelField(field, Number(field.dataset.value) + amount);
    syncDateWheel(field.closest(".date-wheel"));
  }

  document.querySelectorAll(".date-wheel").forEach((wheel) => {
    wheel.querySelectorAll(".date-wheel-field").forEach((field) => {
      let startY;
      field.addEventListener("wheel", (event) => {
        event.preventDefault();
        moveDateWheelField(field, event.deltaY > 0 ? 1 : -1);
      }, { passive: false });
      field.addEventListener("pointerdown", (event) => {
        startY = event.clientY;
        field.setPointerCapture(event.pointerId);
      });
      field.addEventListener("pointerup", (event) => {
        if (startY === undefined) return;
        const movement = startY - event.clientY;
        if (Math.abs(movement) >= 8) moveDateWheelField(field, Math.round(movement / 18));
        startY = undefined;
      });
      field.addEventListener("keydown", (event) => {
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          event.preventDefault();
          moveDateWheelField(field, event.key === "ArrowUp" ? 1 : -1);
        }
      });
    });
  });

  function updateCalendar() {
    const now = Date.now();
    grid.querySelectorAll(".week").forEach((cell) => {
      const start = Date.parse(`${cell.dataset.start}T00:00:00Z`);
      cell.classList.toggle("completed", start <= now);
    });
  }

  function readMoments() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (!Array.isArray(value)) return [];
      return value.map((moment, index) => ({
        ...moment,
        id: moment.id || `legacy-${moment.date}-${index}`,
        hasImage: Boolean(moment.hasImage),
      }));
    } catch {
      return [];
    }
  }

  function readSeasons() {
    try {
      const value = JSON.parse(localStorage.getItem(seasonStorageKey) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function colorDistance(first, second) {
    const channels = (color) => [1, 3, 5].map((index) => Number.parseInt(color.slice(index, index + 2), 16));
    const a = channels(first);
    const b = channels(second);
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }

  function randomIndex(length) {
    if (globalThis.crypto?.getRandomValues) {
      const value = new Uint32Array(1);
      globalThis.crypto.getRandomValues(value);
      return value[0] % length;
    }
    return Math.floor(Math.random() * length);
  }

  function hslToHex(hue, saturation, lightness) {
    const s = saturation / 100;
    const l = lightness / 100;
    const chroma = (1 - Math.abs(2 * l - 1)) * s;
    const section = hue / 60;
    const x = chroma * (1 - Math.abs((section % 2) - 1));
    const [red, green, blue] = section < 1 ? [chroma, x, 0]
      : section < 2 ? [x, chroma, 0]
      : section < 3 ? [0, chroma, x]
      : section < 4 ? [0, x, chroma]
      : section < 5 ? [x, 0, chroma]
      : [chroma, 0, x];
    const match = l - chroma / 2;
    return `#${[red, green, blue].map((channel) => Math.round((channel + match) * 255).toString(16).padStart(2, "0")).join("")}`;
  }

  function randomSeasonColor(seasons) {
    const used = new Set(seasons.map((season, index) => season.color || seasonColors[index % seasonColors.length]));
    let available = seasonColors.filter((color) => !used.has(color));
    const previous = seasons.length
      ? seasons[seasons.length - 1].color || seasonColors[(seasons.length - 1) % seasonColors.length]
      : undefined;
    if (!available.length) {
      for (let attempt = 0; attempt < 80; attempt += 1) {
        const hue = randomIndex(2) === 0 ? 342 + randomIndex(19) : randomIndex(29);
        const candidate = hslToHex(hue % 360, 38 + randomIndex(28), 45 + randomIndex(25));
        const distinctFromPrevious = !previous || colorDistance(candidate, previous) >= 48;
        const distinctFromAll = [...used].every((color) => colorDistance(candidate, color) >= 20);
        if (!used.has(candidate) && distinctFromPrevious && distinctFromAll) return candidate;
      }
      return hslToHex(((seasons.length * 17) % 46 + 342) % 360, 52, 56);
    }
    if (previous) {
      available.sort((first, second) => colorDistance(second, previous) - colorDistance(first, previous));
      available = available.slice(0, Math.min(4, available.length));
    }
    return available[randomIndex(available.length)];
  }

  function readPortraitSettings() {
    const defaults = {
      january: { date: "2005-01-15" },
      may: { date: "2005-05-26" },
    };
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(portraitStorageKey) || "{}") };
    } catch {
      return defaults;
    }
  }

  function openMediaDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("memore-media-v1", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("images")) {
          request.result.createObjectStore("images");
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function storeImage(id, file) {
    const database = await openMediaDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction("images", "readwrite");
      transaction.objectStore("images").put(file, id);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }

  async function readImage(id) {
    const database = await openMediaDatabase();
    const image = await new Promise((resolve, reject) => {
      const transaction = database.transaction("images", "readonly");
      const request = transaction.objectStore("images").get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return image;
  }

  async function loadPortraits() {
    const settings = readPortraitSettings();
    await Promise.all(["january", "may"].map(async (key) => {
      const value = settings[key];
      const portrait = document.querySelector(`#portrait-${key}`);
      if (!portrait || !value) return;
      portrait.dataset.birthDate = value.date;
      portrait.alt = `Retrato asociado al ${value.date}`;
      try {
        const image = await readImage(`portrait-${key}`);
        if (!image) return;
        const previousURL = portraitImageURLs.get(key);
        if (previousURL) URL.revokeObjectURL(previousURL);
        const imageURL = URL.createObjectURL(image);
        portraitImageURLs.set(key, imageURL);
        portrait.src = imageURL;
      } catch {
        // Keep the bundled portrait if local media is unavailable.
      }
    }));
    window.requestAnimationFrame(drawLifeLines);
  }

  function openPortraitEditor(key) {
    const portrait = document.querySelector(`#portrait-${key}`);
    if (!portrait) return;
    portraitKeyInput.value = key;
    portraitDateInput.value = portrait.dataset.birthDate;
    setDateWheel(portraitDateInput);
    portraitImageInput.value = "";
    portraitImageInput.required = false;
    portraitDialog.querySelector("h2").textContent = "Editar retrato";
    portraitDialog.showModal();
  }

  function weekIndex(date) {
    return Math.floor((Date.parse(`${date}T00:00:00Z`) - lifeStart) / millisecondsPerWeek);
  }

  function renderSeasons() {
    const cells = grid.querySelectorAll(".week");
    cells.forEach((cell) => {
      cell.classList.remove("season", "season-start", "season-end", "season-selected", "delete-anchor");
      cell.removeAttribute("data-season");
      cell.removeAttribute("data-season-id");
      cell.style.removeProperty("--season-color");
      cell.querySelector(".delete-season-tag")?.remove();
    });

    const seasons = readSeasons();
    seasons.forEach((season, seasonIndex) => {
      const start = Math.max(0, weekIndex(season.start));
      const end = Math.min(cells.length - 1, weekIndex(season.end));
      if (start > end || season.start > todayString()) return;

      for (let index = start; index <= end; index += 1) {
        const cell = cells[index];
        cell.classList.add("season");
        cell.dataset.season = season.label;
        cell.dataset.seasonId = season.id;
        cell.style.setProperty("--season-color", season.color || seasonColors[seasonIndex % seasonColors.length]);
      }
      cells[start].classList.add("season-start");
      cells[end].classList.add("season-end");
    });
    renderSeasonIndex();
  }

  function renderSeasonIndex() {
    const seasons = readSeasons();
    const moments = readMoments().sort((a, b) => a.date.localeCompare(b.date));
    seasonList.replaceChildren();

    seasons.forEach((season, seasonIndex) => {
      const entry = document.createElement("article");
      entry.className = `season-entry${expandedSeasonId === season.id ? " open" : ""}`;

      const title = document.createElement("button");
      title.type = "button";
      title.className = "season-title";
      title.setAttribute("aria-expanded", String(expandedSeasonId === season.id));
      const swatch = document.createElement("span");
      swatch.className = "season-swatch";
      swatch.style.setProperty("--season-color", season.color || seasonColors[seasonIndex % seasonColors.length]);
      const titleText = document.createElement("span");
      titleText.textContent = season.label;
      title.append(swatch, titleText);

      const quotes = document.createElement("div");
      quotes.className = "season-quotes";
      const seasonMoments = moments.filter((moment) => moment.date >= season.start && moment.date <= season.end);
      if (seasonMoments.length === 0) {
        const empty = document.createElement("p");
        empty.className = "season-quote";
        empty.textContent = "Aún no hay notas en esta temporada.";
        quotes.append(empty);
      } else {
        seasonMoments.forEach((moment) => {
          const quote = document.createElement("blockquote");
          quote.className = "season-quote";
          const date = document.createElement("time");
          date.dateTime = moment.date;
          date.textContent = moment.date;
          quote.append(date, document.createTextNode(moment.description));
          quotes.append(quote);
        });
      }

      title.addEventListener("click", () => {
        const wasOpen = entry.classList.contains("open");
        seasonList.querySelectorAll(".season-entry.open").forEach((openEntry) => {
          openEntry.classList.remove("open");
          openEntry.querySelector(".season-title")?.setAttribute("aria-expanded", "false");
        });
        if (wasOpen) {
          expandedSeasonId = undefined;
        } else {
          expandedSeasonId = season.id;
          entry.classList.add("open");
          title.setAttribute("aria-expanded", "true");
        }
      });
      entry.append(title, quotes);
      seasonList.append(entry);
    });
  }

  function selectSeason(cell) {
    const seasonId = cell.dataset.seasonId;
    if (!seasonId) return;
    grid.querySelectorAll(".season-selected").forEach((selected) => selected.classList.remove("season-selected"));
    grid.querySelectorAll(".delete-anchor").forEach((anchor) => anchor.classList.remove("delete-anchor"));
    grid.querySelector(".delete-season-tag")?.remove();
    grid.querySelectorAll(`.week[data-season-id="${CSS.escape(seasonId)}"]`).forEach((seasonCell) => {
      seasonCell.classList.add("season-selected");
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-season-tag";
    deleteButton.textContent = "Eliminar";
    deleteButton.setAttribute("aria-label", `Eliminar ${cell.dataset.season}`);
    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const seasons = readSeasons().filter((season) => season.id !== seasonId);
      localStorage.setItem(seasonStorageKey, JSON.stringify(seasons));
      renderSeasons();
      renderMoments();
      note.textContent = "Temporada eliminada";
      note.hidden = false;
    });
    cell.classList.add("delete-anchor");
    cell.append(deleteButton);
  }

  function renderMoments() {
    const cells = grid.querySelectorAll(".week");
    cells.forEach((cell) => {
      cell.classList.remove("marked");
      cell.removeAttribute("data-moments");
      cell.removeAttribute("data-moment-id");
      cell.title = cell.dataset.start;
    });

    const grouped = new Map();
    readMoments().forEach((moment) => {
      const index = weekIndex(moment.date);
      if (index < 0 || index >= cells.length || moment.date > todayString()) return;
      const values = grouped.get(index) || [];
      values.push(moment);
      grouped.set(index, values);
    });

    grouped.forEach((moments, index) => {
      const cell = cells[index];
      const summary = moments.map((moment) => `${moment.date} · ${moment.description}`).join("\n");
      cell.classList.add("marked");
      cell.dataset.moments = summary;
      cell.dataset.momentId = moments[moments.length - 1].id;
      cell.title = summary;
      cell.setAttribute("aria-label", summary);
    });
    renderSeasonIndex();
  }

  async function showMoment(momentId) {
    const moment = readMoments().find((value) => value.id === momentId);
    if (!moment) return;

    detailDate.textContent = moment.date;
    detailDescription.textContent = moment.description;
    detailImage.hidden = true;
    detailImage.removeAttribute("src");
    if (detailImageURL) URL.revokeObjectURL(detailImageURL);

    if (moment.hasImage) {
      try {
        const image = await readImage(moment.id);
        if (image) {
          detailImageURL = URL.createObjectURL(image);
          detailImage.src = detailImageURL;
          detailImage.hidden = false;
        }
      } catch {
        detailImage.hidden = true;
      }
    }

    detailDialog.showModal();
  }

  function nearestMarkedCell(clientX, clientY) {
    const rect = grid.getBoundingClientRect();
    const column = Math.min(51, Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * 52)));
    const row = Math.min(89, Math.max(0, Math.floor(((clientY - rect.top) / rect.height) * 90)));
    const targetIndex = row * 52 + column;
    const direct = grid.children[targetIndex];
    if (direct?.classList.contains("marked")) return direct;

    let closest;
    let closestDistance = Infinity;
    grid.querySelectorAll(".week.marked").forEach((cell) => {
      const index = Number(cell.dataset.index);
      const markedRow = Math.floor(index / 52);
      const markedColumn = index % 52;
      const rowDistance = Math.abs(markedRow - row);
      const columnDistance = Math.abs(markedColumn - column);
      if (rowDistance > 2 || columnDistance > 2) return;
      const distance = rowDistance * rowDistance + columnDistance * columnDistance;
      if (distance < closestDistance) {
        closest = cell;
        closestDistance = distance;
      }
    });
    return closest;
  }

  let audioContext;

  function tick(frequency) {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.018, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.035);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.04);
  }

  document.addEventListener(
    "pointerdown",
    () => {
      audioContext ||= new AudioContext();
      if (audioContext.state === "suspended") audioContext.resume();
    },
    { once: true },
  );

  grid.addEventListener("pointerover", (event) => {
    if (event.target.classList.contains("week")) tick(510);
  });

  grid.addEventListener("pointerout", (event) => {
    if (event.target.classList.contains("week")) tick(390);
  });

  let pointerStart;

  function cellAtPoint(x, y) {
    const element = document.elementFromPoint(x, y);
    return element?.closest?.(".week.completed");
  }

  grid.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".delete-season-tag")) return;
    const cell = event.target.closest(".week.completed");
    if (!cell) return;
    pointerStart = { x: event.clientX, y: event.clientY };
  });

  grid.addEventListener("pointerup", (event) => {
    if (!pointerStart) return;
    const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
    pointerStart = undefined;
    if (distance > 10) return;
    const directCell = cellAtPoint(event.clientX, event.clientY);
    if (directCell?.classList.contains("season") && !directCell.classList.contains("marked")) {
      selectSeason(directCell);
      return;
    }
    const cell = nearestMarkedCell(event.clientX, event.clientY);
    if (!cell) return;
    note.textContent = cell.dataset.moments.replaceAll("\n", "  ·  ");
    note.hidden = false;
    showMoment(cell.dataset.momentId);
  });

  grid.addEventListener("pointercancel", () => {
    pointerStart = undefined;
  });

  document.querySelector("#add-moment").addEventListener("click", () => {
    const today = todayString();
    dateInput.max = today < dateInput.dataset.calendarMax ? today : dateInput.dataset.calendarMax;
    dateInput.value = dateInput.max;
    setDateWheel(dateInput);
    descriptionInput.value = "";
    imageInput.value = "";
    dialog.showModal();
    window.setTimeout(() => dateInput.focus(), 50);
  });

  document.querySelector("#add-season").addEventListener("click", () => {
    const today = todayString();
    seasonStartInput.value = today;
    seasonEndInput.value = today;
    setDateWheel(seasonStartInput);
    setDateWheel(seasonEndInput);
    seasonLabelInput.value = "";
    pendingSeasonColor = undefined;
    seasonDialog.showModal();
  });

  document.querySelector("#scroll-seasons").addEventListener("click", () => {
    document.querySelector(".season-index").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  portraits.addEventListener("click", (event) => {
    const portraitButton = event.target.closest(".portrait-button");
    if (portraitButton) openPortraitEditor(portraitButton.dataset.portrait);
  });

  document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
  document.querySelector("#close-season-dialog").addEventListener("click", () => seasonDialog.close());
  document.querySelector("#close-portrait-dialog").addEventListener("click", () => portraitDialog.close());
  document.querySelector("#close-detail").addEventListener("click", () => detailDialog.close());

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  detailDialog.addEventListener("click", (event) => {
    if (event.target === detailDialog) detailDialog.close();
  });

  seasonDialog.addEventListener("click", (event) => {
    if (event.target === seasonDialog) seasonDialog.close();
  });

  portraitDialog.addEventListener("click", (event) => {
    if (event.target === portraitDialog) portraitDialog.close();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    syncDateWheel(document.querySelector('[data-date-wheel="moment-date"]'));
    const date = dateInput.value;
    const description = descriptionInput.value.trim();
    const index = weekIndex(date);
    if (!date || !description || date > todayString() || index < 0 || index >= 90 * 52) return;

    const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const image = imageInput.files[0];
    let hasImage = false;
    if (image) {
      try {
        await storeImage(id, image);
        hasImage = true;
      } catch {
        hasImage = false;
      }
    }

    const moments = readMoments();
    moments.push({ id, date, description, hasImage });
    localStorage.setItem(storageKey, JSON.stringify(moments));
    renderMoments();
    dialog.close();

    note.textContent = `${date} · ${description}`;
    note.hidden = false;
  });

  seasonForm.addEventListener("submit", (event) => {
    event.preventDefault();
    syncDateWheel(document.querySelector('[data-date-wheel="season-start"]'));
    syncDateWheel(document.querySelector('[data-date-wheel="season-end"]'));
    const start = seasonStartInput.value;
    const end = seasonEndInput.value;
    const label = seasonLabelInput.value.trim();
    if (!start || !end || !label || start > end || end > todayString()) return;

    const seasons = readSeasons();
    seasons.push({
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      start,
      end,
      label,
      color: pendingSeasonColor || randomSeasonColor(seasons),
    });
    pendingSeasonColor = undefined;
    localStorage.setItem(seasonStorageKey, JSON.stringify(seasons));
    renderSeasons();
    renderMoments();
    seasonDialog.close();
    note.textContent = `${label} · ${start} — ${end}`;
    note.hidden = false;
  });

  portraitForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    syncDateWheel(document.querySelector('[data-date-wheel="portrait-date"]'));
    const key = portraitKeyInput.value;
    const date = portraitDateInput.value;
    const image = portraitImageInput.files[0];
    if (!key || !date || date > todayString()) return;
    if (image) await storeImage(`portrait-${key}`, image);

    const settings = readPortraitSettings();
    settings[key] = { date };
    localStorage.setItem(portraitStorageKey, JSON.stringify(settings));
    portraitDialog.close();
    await loadPortraits();
  });

  dateInput.dataset.calendarMax = dateInput.max;
  dateInput.max = todayString() < dateInput.max ? todayString() : dateInput.max;
  updateCalendar();
  renderSeasons();
  renderMoments();
  loadPortraits();
  updateCounter();
  window.requestAnimationFrame(drawLifeLines);
  setInterval(updateCounter, 1000);
  setInterval(updateCalendar, 60000);
  window.addEventListener("resize", () => window.requestAnimationFrame(drawLifeLines));
  window.addEventListener("load", () => window.requestAnimationFrame(drawLifeLines));
  document.fonts?.ready.then(() => window.requestAnimationFrame(drawLifeLines));

  if (new URLSearchParams(location.search).has("date")) {
    history.replaceState(null, "", `${location.pathname}${location.hash}`);
  }

  const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
  if ("serviceWorker" in navigator) {
    if (isLocal) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
      }
    } else {
      navigator.serviceWorker.register("./assets/service-worker.js");
    }
  }
})();
