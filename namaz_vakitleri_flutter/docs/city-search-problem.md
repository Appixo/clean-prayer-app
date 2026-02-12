# City Search Problem – Detailed Description

## TL;DR

Prayer-times app uses **Nominatim** (OpenStreetMap) for city search. Problem: short queries (`ut`, `utr`, `utre`) often show wrong cities or organizations as “best match” (e.g. “UTREC Organic Crops Unit” or “Sainte-Marie-Outre-l’Eau” instead of **Utrecht**). We need a solution that works within Nominatim constraints and restores user trust without adding a new geocoding API unless necessary.

---

## 1. Context

- **App:** Flutter prayer-times app (Turkish). Users must pick a **city** for prayer times.
- **Feature:** City search used in **onboarding** (“Şehir Ara”) and **Settings** (“Yeni Konum Ekle”). User types a query, taps “Ara”, sees a list of `SearchResult` (city, country, lat/lon). Tapping a row selects that location.
- **Constraint:** We use **Nominatim** (OpenStreetMap) as the only backend. No other geocoding API. We want to avoid adding a new backend if possible.

---

## 2. Data Source (Nominatim)

### Critical Nominatim behavior to understand

- Returns what **contains** the query anywhere (in name, address, etc.), not just cities.
- For `"utr"` it might return: organizations named “UTREC”, villages with “utr” in them, “Sainte-Marie-Outre-l’Eau” (contains “utre”), etc.
- We have **no control** over what Nominatim returns — only how we rank and filter it.
- If Utrecht is not in the first 40/60 results for a given query, we **cannot** show it.

### Current parsing

- **Endpoint:** `https://nominatim.openstreetmap.org/search?q=<query>&format=json&limit=40|60&addressdetails=1&accept-language=tr`
- We take **city** as: `address.city ?? address.town ?? address.village ?? address.municipality ?? first part of display_name`. So an organisation with no city can end up with a long “city” label (e.g. “UTREC Organic Crops Unit”). We do **not** use Nominatim’s `type` or `class` (e.g. city vs organisation) anywhere.

---

## 3. Current Pipeline (Repository)

1. **Min length:** Query trimmed; if length &lt; 2, return empty list.
2. **Two requests:**
   - Primary: full query, limit 40.
   - If query length ≥ 3: second request with **first 3 characters only**, limit 60 (to get more candidates for typo/short query).
3. **Merge:** Combine both lists; dedupe by `city + country + lat (2 dec) + lon (2 dec)` so same place from both calls appears once.
4. **Rank:** Sort by similarity between **query** and **city** string (both lowercased):
   - If `city.startsWith(query)`: score ≈ 0.98–1.0 (e.g. “Utrecht” vs “utre”).
   - Else if `city.contains(query)`: score ≈ 0.72–0.80 (e.g. “Sainte-Marie-Outre-l’Eau” contains “utre”).
   - Else: Levenshtein-based score `1 - (distance / max(query.length, city.length))`.
     - Example: “utrech” vs “Utrecht” → distance 1 (insert `t`), max length 7 → score 1 − (1/7) ≈ 0.857 (high score, good for typo).
   - So we compare **query** to **city name**; we do not use country or display_name for scoring.
5. **Filter:** Drop results with similarity &lt; 0.45.
6. **Collapse:** Dedupe by `city + country` only, **keeping first** (best after ranking). So at most one row per “Utrecht, Hollanda”.
7. **Return:** First 20 results.

So: **we cannot add Utrecht if Nominatim never returns it** for the two requests we send. We can only reorder and filter what we get.

---

## 4. Current UI Behaviour

- **Sections:** “En iyi eşleşme” (best match) is shown **only if** the **first** result’s city (case-insensitive) **starts with** the query. Otherwise all results are under “Diğer sonuçlar” (other results).
- **Empty state:** If the list is empty we show: “Tam eşleşme bulunamadı. Daha fazla harf deneyin.”
- **Stale responses:** We only apply results when the current query still matches the one that was sent.

---

## 5. The Problem in Practice (Utrecht Example)

| Query     | Expected        | Often get instead                    | Why “best match” fails              |
|----------|------------------|--------------------------------------|-------------------------------------|
| `utrecht`| Utrecht, NL      | ✓ Usually correct                     | Works                               |
| `utrech` | Utrecht, NL      | Sometimes UTREC / Outre-l’Eau        | Typo; Nominatim may not return it   |
| `utre`   | Utrecht, NL      | Sainte-Marie-Outre-l’Eau             | “Contains” scores high              |
| `utr`    | Utrecht, NL      | UTREC Organic Crops Unit             | Organisation starts with “Utr”      |
| `ut`     | Utrecht, NL      | Often missing entirely               | Not in Nominatim top 40/60          |

So the **same intended city (Utrecht)** can be missing, or ranked below irrelevant or non-city results, depending on query length and what Nominatim returns.

---

## 6. Why This Happens (Root Causes)

1. **Nominatim decides availability** — For short queries we only get a prefix (e.g. “Utr”) and a full query (e.g. “Utre”). If Utrecht is not in Nominatim’s top 40/60 for those strings, we **cannot** show it. So the main limit is **data**, not just ranking.

2. **“Contains” and non-cities rank too high** — “Sainte-Marie-**Outre**-l’Eau” gets 0.72–0.80 (contains “utre”) and can beat “Utrecht” at ~0.857 (Levenshtein) **if** “Utrecht” doesn’t start with the query (e.g. when “Utrecht” is not in the result set or is ranked second). We also don’t down-rank **non-cities** (organisations, etc.), so “UTREC Organic Crops Unit” can be first and even get “En iyi eşleşme” because it starts with “Utre”.

3. **No notion of “place type”** — We only have a single string “city” per result. We don’t use Nominatim’s type (city, town, village, organisation, etc.), so we can’t prefer real cities over organisations or odd administrative names.

4. **Trust vs reality** — Users assume “first result” or “En iyi eşleşme” is the intended city. When it’s an organisation or a village in another country, trust drops even if the rest of the list is fine.

---

## 7. What We’ve Already Tried

- Two-phase fetch (full + 3-char prefix) to get more candidates.
- Similarity ranking: starts-with &gt; contains &gt; Levenshtein.
- Filtering out similarity &lt; 0.45.
- Collapsing by city+country so we don’t show duplicate “Utrecht, Hollanda”.
- Showing “En iyi eşleşme” **only** when the first result’s city **starts with** the query (prefix rule).
- Softer empty message: “Tam eşleşme bulunamadı. Daha fazla harf deneyin.”

So the problem is **not** “we never added typo tolerance or best-match logic” — it’s that **results are still often wrong or missing** for short/partial queries and we have no way to prefer real cities or to get Utrecht when Nominatim doesn’t return it.

---

## 8. What We Need From a Solution

- **Short queries (`ut`, `utr`, `utre`):** Ideally Utrecht (or the intended city) appears and is clearly the best match when that’s what the user is typing toward. If that’s impossible with Nominatim alone, we need a clear strategy (e.g. when to show “type more” vs when to show a list).
- **Typos (`utrech`):** Should still tend to show Utrecht at or near the top when Nominatim returns it.
- **No false “best match”:** Avoid labelling organisations or irrelevant “contains” matches as “En iyi eşleşme” (or equivalent). Prefer real cities/towns when we can.
- **Consistency:** Behaviour should be explainable and stable (e.g. adding a letter shouldn’t make the obvious city disappear without reason).
- **Constraints:** Prefer solutions that work **with** Nominatim (different query strategy, use of `type`/`class`, optional small cache, or UI/UX changes) rather than “add Google/another API” unless necessary.

---

## 9. Technical Details

- **Repository:** `lib/data/repositories/location_repository_impl.dart` — `searchCities`, `_nominatimSearch`, `_rankBySimilarity`, `_similarity`, `_collapseByCityCountry`, filter at 0.45.
- **Domain:** `SearchResult` has only `latitude`, `longitude`, `city`, `country`. No place type, no score in the API.
- **UI:** Onboarding and Settings build the list with “En iyi eşleşme” only when `firstResult.city.toLowerCase().startsWith(query.trim().toLowerCase())`.
- **Nominatim:** Response includes `type`, `class`, `address`, `display_name`. We currently use only `address` (and first part of `display_name` as city fallback), not `type`/`class`.

---

## 10. What We Explicitly DON’T Want

- **“Just use Google Places”** — Adds cost, API key management, quota limits; we want to stay on Nominatim if possible.
- **“Show all 100 results”** — UX nightmare; doesn’t fix ranking.
- **“Require 4+ characters”** — Users expect short queries to work.
- **“Remove ‘best match’ section”** — Users need a clear top result when we are confident.
- **Local city database only** — Maintenance burden; may miss smaller cities; we’d consider a small cache **in addition to** Nominatim, not a full replacement.

---

## 11. Success Criteria

- User types `ut` → sees Utrecht as top result if Nominatim returns it, **or** sees “type more” message; **never** shows an organisation as “best match”.
- User types `utre` → Utrecht is clearly the top result when it appears (not an organisation or “Outre” match).
- User types `utrech` → Utrecht still appears despite typo when Nominatim returns it.
- No organisation/building ever labeled “En iyi eşleşme”.
- Behaviour is predictable: adding a letter doesn’t remove the intended city without a clear reason (e.g. we don’t collapse or filter it out incorrectly).

---

## 12. Sample Nominatim Responses (Optional Reference)

<details>
<summary>Typical response shape for a short query like "utr"</summary>

Nominatim can return both organisations and real cities. Example structure:

```json
[
  {
    "place_id": 123456,
    "lat": "40.123",
    "lon": "-74.456",
    "display_name": "UTREC Organic Crops Unit, Some County, United States",
    "type": "amenity",
    "class": "research_institute",
    "address": {
      "amenity": "UTREC Organic Crops Unit",
      "county": "Some County",
      "country": "United States"
    }
  },
  {
    "place_id": 789012,
    "lat": "52.0907",
    "lon": "5.1214",
    "display_name": "Utrecht, Utrecht, Netherlands",
    "type": "city",
    "class": "place",
    "address": {
      "city": "Utrecht",
      "state": "Utrecht",
      "country": "Netherlands"
    }
  }
]
```

**Key observations:**

- The organisation has `type: "amenity"`, `class: "research_institute"`; we currently take “city” from the first part of `display_name` or address, so we might show “UTREC Organic Crops Unit”.
- The real city has `type: "city"`, `class: "place"`. We could use these to prefer cities over amenities.
- We currently **ignore** `type` and `class` when parsing and ranking.

</details>

Nominatim response fields we could use: `lat`, `lon`, `display_name`, `address` (city, town, village, municipality, country, state), `type`, `class`. We currently use only `address` and the first segment of `display_name` for the “city” label; we do not filter or boost by `type`/`class`.
