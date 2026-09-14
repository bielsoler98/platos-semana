# platos-semana

Web estática que muestra 5 platos para cocinar en batch cada semana. Se actualiza sola: una rutina programada de Claude reescribe `data/platos.json` cada jueves y lo sube a este repo; la Raspberry Pi hace `git pull` periódicamente y sirve los ficheros directamente (no hay build step).

## Estructura

- `index.html`, `style.css`, `script.js` — la web (estática, sin dependencias, sin build).
- `data/platos.json` — el menú de la semana. Es el único fichero que la rutina programada debe tocar.
- `worker.js` — Cloudflare Worker: sirve la web estática y expone `/api/favorites` (ver abajo).
- `wrangler.jsonc` — config del Worker: assets estáticos + binding al KV `FAVORITES`.

## Favoritos

Como `data/platos.json` se sobrescribe entero cada semana, guardar un plato como favorito hace una copia completa de su contenido en un KV namespace de Cloudflare (binding `FAVORITES`), para que sobreviva a futuras actualizaciones del menú. Lista compartida, sin usuarios ni login.

- `GET /api/favorites` — lista de favoritos guardados.
- `POST /api/favorites` — guarda un plato (body: el objeto del plato). Si ya existe uno con el mismo `name`, no duplica.
- `DELETE /api/favorites/:id` — quita un favorito por su id.

## Esquema de `data/platos.json`

```json
{
  "week_of": "YYYY-MM-DD",
  "dishes": [
    {
      "category": "pasta | carne | arroz | pescado | libre",
      "name": "Nombre del plato",
      "description": "1-2 frases describiendo el plato.",
      "prep_time_minutes": 25,
      "servings": 2,
      "ingredients": ["...", "..."],
      "steps": ["...", "..."],
      "batch_cooking_notes": "Cómo se conserva / cómo repartirlo para la semana.",
      "image_url": "URL de una foto del plato ya cocinado, o cadena vacía si no se encontró ninguna"
    }
  ]
}
```

Debe haber exactamente 5 platos, uno por categoría (`pasta`, `carne`, `arroz`, `pescado`, `libre`), en ese orden. `week_of` es el lunes de la semana a la que corresponde el menú.

Requisitos de contenido (los aplica la rutina programada al generar el JSON):
- Recetas simples y rápidas, pensadas para cocinar varias de golpe (batch cooking).
- Ingredientes fáciles de encontrar en supermercados de Mallorca, España.
- Receta completa: ingredientes con cantidades y pasos de elaboración detallados.
- Cantidades siempre para 2 personas (`servings` siempre a `2`).
- Cada plato lleva una foto del resultado final en `image_url` si se encuentra una URL de imagen directa razonable (ver prompt de la rutina); si no, se deja vacía — la web la oculta sola si no carga, así que nunca inventes una URL.
