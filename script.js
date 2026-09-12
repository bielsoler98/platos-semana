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

function renderDish(dish) {
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

  const img = node.querySelector(".dish-image");
  if (dish.image_url) {
    // The image URL is never fetched or validated server-side, so a broken
    // or unreachable one is expected occasionally — hide it rather than
    // showing a broken-image icon.
    img.addEventListener("error", () => img.remove(), { once: true });
    img.src = dish.image_url;
    img.alt = dish.name || "";
  } else {
    img.remove();
  }

  return node;
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
