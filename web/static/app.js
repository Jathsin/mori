(() => {
  const meeting = new Date("2024-11-14T00:00:00Z");
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
  }

  function updateCalendar() {
    const now = new Date();
    document.querySelectorAll(".week").forEach((cell) => {
      const start = new Date(`${cell.dataset.start}T00:00:00Z`);
      cell.classList.toggle("completed", start <= now);
    });
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

  document.querySelector("#life-grid").addEventListener("pointerover", (event) => {
    if (event.target.classList.contains("week")) tick(510);
  });

  document.querySelector("#life-grid").addEventListener("pointerout", (event) => {
    if (event.target.classList.contains("week")) tick(390);
  });

  updateCalendar();
  updateCounter();
  setInterval(updateCounter, 1000);
  setInterval(updateCalendar, 60000);

  const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
  if ("serviceWorker" in navigator && !isLocal) {
    navigator.serviceWorker.register("./assets/service-worker.js");
  }
})();
