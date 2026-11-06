import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseHub, parseGenrePage, loadGenre, filterGames, genreUrl } from "../games.js";

const ref = (p) => readFileSync(new URL("../ref/now.gg/" + p, import.meta.url), "utf8");
const hub = parseHub(ref("games.html"));
assert.ok(hub.categories.length > 10, "hub categories");
assert.ok(hub.categories.some((c) => c.slug === "action"), "has action");
assert.ok(hub.top.length > 0 && hub.top[0].title, "top games");

const page = parseGenrePage(ref("games/action.html"));
assert.ok(page.games.length >= 50, "action games parsed: " + page.games.length);
assert.ok(page.games.every((g) => g.slug && g.title && g.id), "games have slug/title/id");
assert.ok(page.games.some((g) => g.icon.startsWith("https://")), "icons present");

const calls = [];
const all = await loadGenre("action", async (u) => { calls.push(u); return ref("games/action.html"); });
assert.equal(all.length, page.games.length, "dedupe");
assert.equal(genreUrl("action", 2), "https://now.gg/games/action.html?page=2");

const hit = filterGames(page.games, { q: page.games[0].title.slice(0, 4), sort: "az" });
assert.ok(hit.length >= 1);
console.log("ok:", hub.categories.length, "categories,", page.games.length, "action games, fetches:", calls.length);
