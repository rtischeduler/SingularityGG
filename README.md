# SingularityGG

Static game launcher for now.gg. Browsing and play both go through the Singuloxy/wisp proxy copied from `SingularityNOW` (`proxy.js`). All genres load automatically; "Play game" opens now.gg's own play page in a sandboxed Sandstone frame.

- `index.html` – launcher UI (genre picker, search, sort, full game grid, game selection).
- `games.js` – parses now.gg's `__NEXT_DATA__` into game lists.
- `scripts/crawl_ref.py` – crawls now.gg into `ref/` for reference.
- Test: `node test/games.test.mjs`
