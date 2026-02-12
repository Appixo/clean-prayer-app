# City Search Fix – Implementation Notes

## Summary

- **Domain:** Added `PlaceType` enum (`city`, `village`, `other`) and `SearchResult.placeType` (default `other`).
- **Repository:** Parse Nominatim `type` and `class`; map to `PlaceType`; rank by `similarity(query, city) * placeTypeMultiplier(placeType)`; no filtering of non-cities (only downranking).
- **UI:** "En iyi eşleşme" is shown only when the first result's city starts with the query **and** `placeType == PlaceType.city`.

## Place type classification

- **city:** `type` in `city`, `town`; or `type == "administrative"` and `class == "boundary"` when `address` has `city` or `town` (e.g. Utrecht).
- **village:** `type` in `village`, `municipality`, `hamlet`, `locality`, `suburb`, `neighbourhood`; or `class == "place"` when type is not city/town.
- **other:** `class` in `building`, `office`, `amenity`, `tourism`, `shop`, `leisure`, or any unlisted type/class (e.g. organizations).

## Ranking multipliers

- **city:** 1.2  
- **village:** 1.0  
- **other:** 0.6  

So a city with similarity 0.8 scores 0.96; an organization with 0.95 scores 0.57 — real cities outrank organizations.

## Best-match rule

"En iyi eşleşme" only if: first result's city starts with query (case-insensitive) **and** first result's `placeType == PlaceType.city`. If the top result is an organization/building, only "Diğer sonuçlar" is shown.

## Test cases (Utrecht)

1. **ut** – Utrecht in top 3 if present; no org as best match.
2. **utre** – Utrecht #1; Utrecht as best match if it starts with "utre".
3. **utr** – "UTREC Organic Crops Unit" never as best match; Utrecht #1 if present.
4. **utrech** – Utrecht in top 3 (Levenshtein); best match if similarity high.
5. **utrecht** – Utrecht #1 and best match.

## Trade-offs

- Villages do not get "En iyi eşleşme" (only `PlaceType.city`). To allow villages, relax to `placeType != PlaceType.other`.
- Non-cities are downranked, not removed.
- No "type more characters" message for short queries.

## Files changed

- `lib/domain/repositories/location_repository.dart` – `PlaceType` enum, `SearchResult.placeType`
- `lib/data/repositories/location_repository_impl.dart` – parse type/class, `_classifyPlaceType(type, cls, address)`, `_placeTypeMultiplier`, ranking uses multiplier; **administrative+boundary with address.city/town** treated as city (fixes Utrecht "En iyi eşleşme"); optional debug logging for short queries (query length ≤ 4) in debug mode; **multi-word fallback**: `_performSearch`, `_tryFallbackQueries` (when 0 results and query has spaces, try dropping last 1–2 words)
- `lib/features/onboarding/presentation/onboarding_screen.dart` – best match requires `placeType == PlaceType.city`; "Diğer sonuçlar" excludes any result with same city+country as best match (no duplicate)
- `lib/features/settings/presentation/settings_screen.dart` – same

## Duplicate result fix

When Nominatim returns multiple hits for the same place (e.g. Utrecht as both city and administrative boundary, or different country strings), the same city can appear under both "En iyi eşleşme" and "Diğer sonuçlar". We now build "others" by excluding **all** results that share the best match's city+country (case-insensitive), so the same place is never shown twice.

## Nominatim short-query limitation

For very short queries (e.g. "Utr", "Utre"), Nominatim often does **not** return cities like Utrecht in the raw response. Debug logs confirm: for "Utr" and "Utre", Utrecht is absent from the API response. So missing results for short queries are a **data limitation**, not a ranking bug. Options: document as known limitation; later consider a small "top cities" cache or fuzzy query expansion if needed.

## Multi-word query fallback

When the original query returns **0 results** and contains **multiple words**, we try up to 2 fallback queries by removing words from the end: first 1 word, then 2 words. Each fallback must be at least 3 characters. Results from a fallback are ranked and filtered by the **original** user query (so "Loenen aan de Vecht" still scores well for "Loenen aan de vechct"). Single-word queries (e.g. "Utrech") do not use fallback. Example: "Loenen aan de vechct" → try "Loenen aan de" → Nominatim returns "Loenen aan de Vecht" → shown to user.

## Debug logging (short queries)

In debug builds, for Nominatim requests with query length ≤ 4, the repo logs the first 10 raw items (type, class, city) so you can see whether Utrecht (or other cities) appear in the response and at what position. Use this to distinguish "ranking problem" vs "Nominatim doesn't return it".
