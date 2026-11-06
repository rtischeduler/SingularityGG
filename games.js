// Pure helpers for reading now.gg game lists out of the __NEXT_DATA__ blob on its pages.
export const ORIGIN = "https://now.gg";

export function extractNextData(html) {
  const m = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(String(html || ""));
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

const pick = (m, k) => (m && m[k]) || {};
export function normalizeGame(g) {
  if (!g || !g.slug || !(g.title || g.name)) return null;
  const d = pick(g.media, "desktop"), mo = pick(g.media, "mobile");
  return {
    id: String(g.nowgg_id || g.id || g.slug),
    nowggId: String(g.nowgg_id || ""),
    slug: g.slug,
    title: g.title || g.name,
    pkg: g.packageName || "",
    genres: Array.isArray(g.genre) ? g.genre : [],
    tags: (g.subCategories || []).map((s) => s.slug).filter(Boolean),
    rating: Number(g.rating) || 0,
    ratings: Number(g.ratingCount) || 0,
    icon: d.icon || d.logo || mo.icon || mo.logo || "",
    banner: d.banner || d.ogimage || mo.banner || mo.ogimage || "",
    upcoming: !!g.upcoming,
  };
}

const uniqBy = (arr, key) => { const seen = new Set(); return arr.filter((x) => x && !seen.has(key(x)) && seen.add(key(x))); };

// /games.html -> genre list + top games
export function parseHub(html) {
  const pp = (extractNextData(html) || {}).props?.pageProps;
  if (!pp) return { categories: [], top: [] };
  const mk = (main) => (c) => ({ slug: c.slug, name: c.name, main });
  const ok = (c) => c && c.slug && c.name;
  const cats = [...(((pp.allGameCategories || {}).data) || []).filter(ok).map(mk(true)), ...(pp.moreGameCategories || []).filter(ok).map(mk(false))];
  return { categories: uniqBy(cats, (c) => c.slug), top: (pp.topGames || []).map(normalizeGame).filter(Boolean) };
}

// /games/<slug>.html?page=N -> games on that page + paging info
export function parseGenrePage(html) {
  const pp = (extractNextData(html) || {}).props?.pageProps;
  if (!pp) return { games: [], pageCount: 0, pageSize: 0 };
  const data = (pp.genreDetails || {}).data || {};
  const raw = data.games || data.category_games || data.popularGames || [];
  return {
    games: uniqBy(raw.map(normalizeGame).filter(Boolean), (g) => g.id),
    pageCount: Number(pp.pageCount) || Number(((pp.genreDetails || {}).meta || {}).maxPage) || 1,
    pageSize: Number(pp.pageSize) || 60,
  };
}

export const genreUrl = (slug, page = 1) => `${ORIGIN}/games/${encodeURIComponent(slug)}.html` + (page > 1 ? `?page=${page}` : "");

// Loads every page of one genre. fetchText(url) -> html string.
export async function loadGenre(slug, fetchText, onPage = () => {}) {
  const first = parseGenrePage(await fetchText(genreUrl(slug)));
  let all = first.games;
  onPage(all, 1, first.pageCount);
  // some responses already carry the whole list on page 1; only page through when it looks truncated
  if (first.pageCount > 1 && first.games.length <= first.pageSize) {
    for (let p = 2; p <= first.pageCount; p++) {
      const next = parseGenrePage(await fetchText(genreUrl(slug, p)));
      all = uniqBy([...all, ...next.games], (g) => g.id);
      onPage(all, p, first.pageCount);
    }
  }
  return all;
}

export const mergeGames = (...lists) => uniqBy(lists.flat(), (g) => g.id);

export function filterGames(games, { q = "", sort = "popular" } = {}) {
  const s = q.trim().toLowerCase();
  const out = s ? games.filter((g) => g.title.toLowerCase().includes(s) || g.genres.some((x) => x.toLowerCase().includes(s)) || g.tags.includes(s)) : games.slice();
  const by = { popular: (a, b) => b.ratings - a.ratings, rating: (a, b) => b.rating - a.rating || b.ratings - a.ratings, az: (a, b) => a.title.localeCompare(b.title) };
  return out.sort(by[sort] || by.popular);
}
