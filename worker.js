const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

async function readFavorites(env) {
  const raw = await env.FAVORITES.get("list");
  return raw ? JSON.parse(raw) : [];
}

async function writeFavorites(env, list) {
  await env.FAVORITES.put("list", JSON.stringify(list));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/favorites" && request.method === "GET") {
      const list = await readFavorites(env);
      return new Response(JSON.stringify(list), { headers: JSON_HEADERS });
    }

    if (url.pathname === "/api/favorites" && request.method === "POST") {
      let dish;
      try {
        dish = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "invalid json" }), { status: 400, headers: JSON_HEADERS });
      }
      if (!dish || typeof dish.name !== "string" || !dish.name) {
        return new Response(JSON.stringify({ error: "missing name" }), { status: 400, headers: JSON_HEADERS });
      }
      const list = await readFavorites(env);
      // Same dish name is treated as already-saved rather than duplicated.
      if (!list.some((d) => d.name === dish.name)) {
        list.push({ ...dish, id: crypto.randomUUID(), saved_at: new Date().toISOString() });
        await writeFavorites(env, list);
      }
      return new Response(JSON.stringify(list), { headers: JSON_HEADERS });
    }

    const deleteMatch = url.pathname.match(/^\/api\/favorites\/([^/]+)$/);
    if (deleteMatch && request.method === "DELETE") {
      const id = deleteMatch[1];
      const list = (await readFavorites(env)).filter((d) => d.id !== id);
      await writeFavorites(env, list);
      return new Response(JSON.stringify(list), { headers: JSON_HEADERS });
    }

    return env.ASSETS.fetch(request);
  },
};
