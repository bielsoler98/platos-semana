# platos-semana

Web estática que muestra 5 platos para cocinar en batch cada semana. Se actualiza sola: una rutina programada de Claude reescribe `data/platos.json` cada jueves y lo sube a este repo; la Raspberry Pi hace `git pull` periódicamente y sirve los ficheros directamente (no hay build step).

## Estructura

- `index.html`, `style.css`, `script.js` — la web (estática, sin dependencias, sin build).
- `data/platos.json` — el menú de la semana. Es el único fichero que la rutina programada debe tocar.

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
- Cada plato lleva una foto del resultado final en `image_url` (buscada en Wikimedia Commons, ver prompt de la rutina).
