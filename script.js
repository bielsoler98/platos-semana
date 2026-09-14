const CATEGORY_COLORS = {
  pasta: "var(--c-pasta)",
  carne: "var(--c-carne)",
  arroz: "var(--c-arroz)",
  pescado: "var(--c-pescado)",
  libre: "var(--c-libre)",
};

const CATEGORY_LABELS = {
  pasta: "pasta",
  carne: "carne",
  arroz: "arroz",
  pescado: "pescado",
  libre: "plato libre",
};

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatWeekTitle(weekOf) {
  if (!weekOf) return "Menú de la semana";
  const d = new Date(weekOf + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "Menú de la semana";
  return `Semana del ${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`;
}

// Fields snapshotted into a favorite so it survives the weekly menu being
// overwritten — deliberately excludes any id/timestamp the server adds.
const SNAPSHOT_FIELDS = [
  "category", "name", "description", "prep_time_minutes", "servings",
  "ingredients", "steps", "batch_cooking_notes", "image_url",
];

function dishSnapshot(dish) {
  const snap = {};
  SNAPSHOT_FIELDS.forEach((f) => { snap[f] = dish[f]; });
  return snap;
}

function renderDish(dish, { mode } = { mode: "weekly" }) {
  const tpl = document.getElementById("dish-template");
  const node = tpl.content.cloneNode(true);
  const details = node.querySelector(".dish");

  const color = CATEGORY_COLORS[dish.category] || "var(--ink-soft)";
  details.style.setProperty("--dot-color", color);

  node.querySelector(".dish-category").textContent =
    CATEGORY_LABELS[dish.category] || dish.category || "";
  node.querySelector(".dish-name").textContent = dish.name || "";
  node.querySelector(".dish-description").textContent = dish.description || "";

  const timeEl = node.querySelector(".dish-time");
  timeEl.textContent = dish.prep_time_minutes
    ? `${dish.prep_time_minutes} min`
    : "";

  const servingsEl = node.querySelector(".dish-servings");
  servingsEl.textContent = dish.servings
    ? `${dish.servings} raciones`
    : "";

  node.querySelector(".dish-batch").textContent = dish.batch_cooking_notes || "";

  const ingredientsList = node.querySelector(".ingredients-list");
  (dish.ingredients || []).forEach((ing) => {
    const li = document.createElement("li");
    li.textContent = ing;
    ingredientsList.appendChild(li);
  });

  const stepsList = node.querySelector(".steps-list");
  (dish.steps || []).forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    stepsList.appendChild(li);
  });

  // The image URL is never fetched or validated server-side, so a broken or
  // unreachable one is expected occasionally — hide it rather than showing a
  // broken-image icon.
  const thumb = node.querySelector(".dish-thumb");
  const hero = node.querySelector(".dish-image");
  if (dish.image_url) {
    [thumb, hero].forEach((img) => {
      img.addEventListener("error", () => img.remove(), { once: true });
      img.src = dish.image_url;
      img.alt = dish.name || "";
    });
  } else {
    thumb.remove();
    hero.remove();
  }

  const saveBtn = node.querySelector(".dish-save");
  const removeBtn = node.querySelector(".dish-remove");

  if (mode === "favorite") {
    saveBtn.remove();
    removeBtn.hidden = false;
    removeBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      removeBtn.disabled = true;
      removeBtn.textContent = "Quitando…";
      await removeFavorite(dish.id);
    });
  } else {
    saveBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      saveBtn.disabled = true;
      saveBtn.textContent = "Guardando…";
      const ok = await saveFavorite(dishSnapshot(dish));
      saveBtn.textContent = ok ? "★ Guardado" : "☆ Guardar";
      if (!ok) saveBtn.disabled = false;
    });
  }

  return node;
}

async function fetchFavorites() {
  const res = await fetch("/api/favorites", { cache: "no-store" });
  if (!res.ok) throw new Error("no favorites");
  return res.json();
}

async function saveFavorite(dishData) {
  try {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(dishData),
    });
    if (!res.ok) return false;
    const list = await res.json();
    renderFavoritesList(list);
    return true;
  } catch {
    return false;
  }
}

async function removeFavorite(id) {
  try {
    const res = await fetch(`/api/favorites/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) return;
    const list = await res.json();
    renderFavoritesList(list);
  } catch {
    /* leave the list as-is on failure */
  }
}

function renderFavoritesList(list) {
  const container = document.getElementById("favorites-list");
  const emptyMsg = document.getElementById("favorites-empty");
  const countEl = document.getElementById("favorites-count");

  container.innerHTML = "";
  emptyMsg.hidden = list.length > 0;
  countEl.textContent = list.length ? `(${list.length})` : "";

  list.forEach((dish) => container.appendChild(renderDish(dish, { mode: "favorite" })));
}

async function initFavorites() {
  const toggle = document.getElementById("favorites-toggle");
  const section = document.getElementById("favorites-section");
  let loaded = false;

  try {
    const list = await fetchFavorites();
    document.getElementById("favorites-count").textContent = list.length ? `(${list.length})` : "";
  } catch {
    /* count stays blank if the API isn't reachable yet */
  }

  toggle.addEventListener("click", async () => {
    const opening = section.hidden;
    section.hidden = !opening;
    toggle.setAttribute("aria-expanded", String(opening));
    if (opening && !loaded) {
      loaded = true;
      try {
        renderFavoritesList(await fetchFavorites());
      } catch {
        document.getElementById("favorites-empty").hidden = false;
        document.getElementById("favorites-empty").textContent =
          "No se han podido cargar los favoritos ahora mismo.";
      }
    }
  });
}

async function main() {
  const titleEl = document.getElementById("week-title");
  const container = document.getElementById("dishes");

  try {
    const res = await fetch("data/platos.json", { cache: "no-store" });
    if (!res.ok) throw new Error("no data");
    const data = await res.json();
    const dishes = Array.isArray(data.dishes) ? data.dishes : [];

    titleEl.textContent = formatWeekTitle(data.week_of);

    if (dishes.length === 0) {
      container.appendChild(
        document.getElementById("empty-template").content.cloneNode(true)
      );
      return;
    }

    dishes.forEach((dish) => container.appendChild(renderDish(dish)));
  } catch (err) {
    titleEl.textContent = "Menú de la semana";
    container.appendChild(
      document.getElementById("empty-template").content.cloneNode(true)
    );
  }
}

main();
initFavorites();
