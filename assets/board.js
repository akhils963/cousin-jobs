// Job board: loads data/<person>.json and keeps the applied log in this browser.
(function () {
  const person = document.body.dataset.person;
  const storeKey = "jobboard-applied-" + person;
  const $ = (s) => document.querySelector(s);
  let data = { jobs: [], categories: [] };
  let filter = "all";
  let city = "all";

  const todayIST = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
  const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  function load() {
    try { return JSON.parse(localStorage.getItem(storeKey)) || {}; } catch (e) { return {}; }
  }
  function save(log) {
    try { localStorage.setItem(storeKey, JSON.stringify(log)); } catch (e) {}
  }
  let applied = load();

  function latestBatch() {
    return data.jobs.reduce((m, j) => (j.added > m ? j.added : m), "");
  }

  function render() {
    const batch = latestBatch();
    const log = Object.values(applied);
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    $("#s-applied").textContent = log.length;
    $("#s-week").textContent = log.filter((a) => a.date >= weekAgo).length;
    $("#s-new").textContent = data.jobs.filter((j) => j.added === batch).length;
    $("#s-open").textContent = data.jobs.filter((j) => !applied[j.url]).length;
    if (data.updated) {
      $("#updated").textContent = "Updated " + new Date(data.updated).toLocaleString("en-IN", {
        day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata",
      }) + " IST. New jobs every day at 12 PM.";
    }

    const chips = [["all", "All"], ["new", "New today"], ["todo", "Not applied"], ["applied", "Applied"]]
      .concat(data.categories.map((c) => ["cat:" + c, c]));
    $("#chips").innerHTML = chips.map(([k, l]) =>
      `<button class="chip" data-f="${esc(k)}" aria-pressed="${k === filter}">${esc(l)}</button>`).join("");

    const cities = data.cities || [];
    $("#cities").innerHTML = cities.length ? [["all", "All cities"]].concat(cities.map((c) => [c, c])).map(([k, l]) =>
      `<button class="chip city" data-c="${esc(k)}" aria-pressed="${k === city}">${esc(l)}</button>`).join("") : "";

    const shown = data.jobs.filter((j) => city === "all" || j.city === city).filter((j) => {
      if (filter === "new") return j.added === batch;
      if (filter === "todo") return !applied[j.url];
      if (filter === "applied") return !!applied[j.url];
      if (filter.startsWith("cat:")) return j.category === filter.slice(4);
      return true;
    });
    $("#list").innerHTML = shown.length ? shown.map((j) => {
      const a = applied[j.url];
      return `<div class="job${a ? " applied" : ""}">
        <div class="main">
          <a class="title" href="${esc(j.url)}" target="_blank" rel="noopener">${esc(j.title)}</a>
          <div class="meta">${esc(j.company)} · ${esc(j.location)} · posted ${fmt(j.posted)}</div>
          <div class="tags">
            ${j.added === batch ? '<span class="tag new">New</span>' : ""}
            <span class="tag" data-cat="${esc(j.category)}">${esc(j.category)}</span>
            ${j.city ? `<span class="tag place" data-city="${esc(j.city)}">${esc(j.city)}</span>` : ""}
            ${a ? `<span class="tag ok">Applied ${fmt(a.date)}</span>` : ""}
          </div>
        </div>
        <button class="btn" data-url="${esc(j.url)}">${a ? "Undo" : "Mark applied"}</button>
      </div>`;
    }).join("") : '<p class="empty">Nothing here yet.</p>';

    const sorted = log.sort((x, y) => (x.date < y.date ? 1 : -1));
    $("#log").innerHTML = sorted.length
      ? sorted.map((a) => `<div><b>${esc(a.title)}</b>&nbsp;${esc(a.company)}<span>${fmt(a.date)}</span></div>`).join("")
      : '<div class="empty">Tap "Mark applied" on a job and it shows up here.</div>';
  }

  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (chip && chip.dataset.c) { city = chip.dataset.c; render(); return; }
    if (chip) { filter = chip.dataset.f; render(); return; }
    const btn = e.target.closest(".btn");
    if (btn) {
      const url = btn.dataset.url;
      if (applied[url]) delete applied[url];
      else {
        const j = data.jobs.find((x) => x.url === url);
        applied[url] = { title: j.title, company: j.company, date: todayIST() };
      }
      save(applied);
      render();
    }
  });

  $("#backup").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(applied, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = person + "-applied-" + todayIST() + ".json";
    a.click();
  });
  $("#restore").addEventListener("click", () => $("#file").click());
  $("#file").addEventListener("change", async (e) => {
    try {
      const incoming = JSON.parse(await e.target.files[0].text());
      applied = Object.assign({}, incoming, applied);
      save(applied);
      render();
    } catch (err) { alert("That file could not be read."); }
  });

  fetch("../data/" + person + ".json?t=" + Date.now())
    .then((r) => r.json())
    .then((d) => { data = d; render(); })
    .catch(() => { $("#list").innerHTML = '<p class="empty">Could not load jobs. Try refreshing.</p>'; });
})();
