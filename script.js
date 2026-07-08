(() => {
  "use strict";

  const STORAGE_KEY = "focus-fire:v1";

  const dateLabelEl = document.getElementById("dateLabel");
  const fireSvgEl = document.getElementById("fireSvg");
  const flameGroupEl = document.getElementById("flameGroup");
  const emberFieldEl = document.getElementById("emberField");
  const timerReadoutEl = document.getElementById("timerReadout");
  const timerStageEl = document.getElementById("timerStage");
  const durationsEl = document.getElementById("durations");
  const durChips = Array.from(document.querySelectorAll(".dur-chip"));
  const startPauseBtn = document.getElementById("startPauseBtn");
  const resetBtn = document.getElementById("resetBtn");
  const todayTotalEl = document.getElementById("todayTotal");
  const todayCountEl = document.getElementById("todayCount");
  const logListEl = document.getElementById("logList");
  const emptyLogEl = document.getElementById("emptyLog");

  /** @typedef {{minutes: number, ts: string}} Session */

  let selectedMinutes = 25;
  let totalSeconds = selectedMinutes * 60;
  let remainingSeconds = totalSeconds;
  let status = "idle"; // idle | running | paused
  let tickHandle = null;
  let emberHandle = null;

  /** @type {Session[]} */
  let sessions = loadSessions();

  init();

  function init() {
    renderDateLabel();
    updateReadout();
    renderStage(0);
    renderLog();

    durChips.forEach((chip) => {
      chip.addEventListener("click", () => selectDuration(Number(chip.dataset.minutes)));
    });
    startPauseBtn.addEventListener("click", onStartPause);
    resetBtn.addEventListener("click", onReset);
  }

  // -----------------------------------------
  // Storage
  // -----------------------------------------
  function loadSessions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveSessions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // storage unavailable — session still works for this visit
    }
  }

  // -----------------------------------------
  // Date helpers
  // -----------------------------------------
  function renderDateLabel() {
    const fmt = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    dateLabelEl.textContent = fmt.format(new Date());
  }

  function isSameDay(isoA, isoB) {
    const a = new Date(isoA);
    const b = new Date(isoB);
    return a.toDateString() === b.toDateString();
  }

  // -----------------------------------------
  // Duration selection
  // -----------------------------------------
  function selectDuration(minutes) {
    if (status !== "idle") return;
    selectedMinutes = minutes;
    totalSeconds = minutes * 60;
    remainingSeconds = totalSeconds;
    durChips.forEach((chip) => {
      chip.classList.toggle("is-selected", Number(chip.dataset.minutes) === minutes);
    });
    updateReadout();
  }

  // -----------------------------------------
  // Timer control
  // -----------------------------------------
  function onStartPause() {
    if (status === "idle" || status === "paused") {
      startRunning();
    } else if (status === "running") {
      pauseRunning();
    }
  }

  function startRunning() {
    status = "running";
    startPauseBtn.textContent = "Pause";
    resetBtn.hidden = false;
    setDurationChipsDisabled(true);
    startEmberLoop();

    tickHandle = setInterval(() => {
      remainingSeconds -= 1;
      if (remainingSeconds <= 0) {
        completeSession();
        return;
      }
      updateReadout();
      renderStage(progressFraction());
    }, 1000);
  }

  function pauseRunning() {
    status = "paused";
    clearInterval(tickHandle);
    stopEmberLoop();
    startPauseBtn.textContent = "Resume";
    timerStageEl.textContent = "Paused — the fire is holding steady";
  }

  function completeSession() {
    clearInterval(tickHandle);
    stopEmberLoop();
    remainingSeconds = 0;
    updateReadout();
    renderStage(1);
    timerStageEl.textContent = "Fire's roaring — session complete";

    sessions.push({ minutes: selectedMinutes, ts: new Date().toISOString() });
    saveSessions();
    renderLog();

    // let the fire sit at its peak for a moment, then settle back to idle
    setTimeout(() => {
      resetToIdle();
    }, 2200);
  }

  function onReset() {
    clearInterval(tickHandle);
    stopEmberLoop();
    resetToIdle();
  }

  function resetToIdle() {
    status = "idle";
    remainingSeconds = totalSeconds;
    startPauseBtn.textContent = "Start focusing";
    resetBtn.hidden = true;
    setDurationChipsDisabled(false);
    updateReadout();
    renderStage(0);
    timerStageEl.textContent = "Ready when you are";
  }

  function setDurationChipsDisabled(disabled) {
    durChips.forEach((chip) => { chip.disabled = disabled; });
  }

  function progressFraction() {
    return 1 - remainingSeconds / totalSeconds;
  }

  function updateReadout() {
    const m = Math.floor(remainingSeconds / 60).toString().padStart(2, "0");
    const s = Math.floor(remainingSeconds % 60).toString().padStart(2, "0");
    timerReadoutEl.textContent = `${m}:${s}`;
  }

  // -----------------------------------------
  // Fire rendering
  // -----------------------------------------
  function renderStage(fraction) {
    const scale = 0.15 + fraction * 1.0; // 0.15 spark -> 1.15 roaring
    flameGroupEl.setAttribute("transform", `translate(100,182) scale(${scale.toFixed(3)})`);

    if (status === "running") {
      if (fraction < 0.15) timerStageEl.textContent = "Just a spark";
      else if (fraction < 0.4) timerStageEl.textContent = "Catching";
      else if (fraction < 0.75) timerStageEl.textContent = "Building";
      else timerStageEl.textContent = "Roaring";
    }
  }

  function startEmberLoop() {
    stopEmberLoop();
    emberHandle = setInterval(() => {
      const fraction = progressFraction();
      if (fraction < 0.35) return; // embers only once the fire has caught
      spawnEmber();
    }, 500);
  }

  function stopEmberLoop() {
    if (emberHandle) clearInterval(emberHandle);
    emberHandle = null;
    emberFieldEl.innerHTML = "";
  }

  function spawnEmber() {
    const ns = "http://www.w3.org/2000/svg";
    const circle = document.createElementNS(ns, "circle");
    const drift = 100 + (Math.random() * 26 - 13);
    circle.setAttribute("cx", String(drift));
    circle.setAttribute("cy", "170");
    circle.setAttribute("r", String(1.2 + Math.random() * 1.3));
    circle.classList.add("ember-particle");
    circle.style.animationDuration = `${2.6 + Math.random() * 1.4}s`;
    emberFieldEl.appendChild(circle);
    circle.addEventListener("animationiteration", () => circle.remove());
    setTimeout(() => circle.remove(), 4200);
  }

  // -----------------------------------------
  // Log rendering
  // -----------------------------------------
  function renderLog() {
    const today = new Date().toISOString();
    const todaySessions = sessions.filter((s) => isSameDay(s.ts, today));
    const todayMinutes = todaySessions.reduce((sum, s) => sum + s.minutes, 0);

    todayTotalEl.textContent = `${todayMinutes} min focused today`;
    todayCountEl.textContent = `${todaySessions.length} session${todaySessions.length === 1 ? "" : "s"}`;

    const recent = [...sessions].reverse().slice(0, 12);
    emptyLogEl.hidden = recent.length > 0;
    logListEl.innerHTML = "";

    const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
    const dayFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

    recent.forEach((session) => {
      const li = document.createElement("li");
      li.className = "log-item";

      const mark = document.createElement("span");
      mark.className = "log-mark";

      const minutes = document.createElement("span");
      minutes.className = "log-minutes";
      minutes.textContent = `${session.minutes} min`;

      const when = document.createElement("span");
      when.className = "log-time";
      const d = new Date(session.ts);
      const sameDay = isSameDay(session.ts, today);
      when.textContent = sameDay ? timeFmt.format(d) : `${dayFmt.format(d)}, ${timeFmt.format(d)}`;

      li.appendChild(mark);
      li.appendChild(minutes);
      li.appendChild(when);
      logListEl.appendChild(li);
    });
  }
})();
