# SingularityGG

Static game launcher for now.gg. Browsing goes through the Singuloxy/wisp proxy copied from `SingularityNOW` (`proxy.js`).

- `index.html` – launcher UI (genre picker, search, sort, full game grid, game selection). **Sessions are not implemented yet.**
- `games.js` – parses now.gg's `__NEXT_DATA__` into game lists.
- `scripts/crawl_ref.py` – crawls now.gg into `ref/` for reference.
- Test: `node test/games.test.mjs`
