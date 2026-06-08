# Store Audit Report — 2026-06-08

## Build Status

| Check | Result | Detail |
|-------|--------|--------|
| `tsc --noEmit` | ✅ | 0 errors |
| `pnpm build` | ✅ | Compiled in 3.5s |
| Static pages | ✅ | 96 pages generated |
| Shared JS bundle | ✅ | 103 KB |
| Middleware | ✅ | 52.4 KB |

---

## Per-Store Results (static code analysis)

### ElectroMarket — ECOMMERCE (`STORE_SLUG=electromarket`)

**Seed / presence:**
- `primaryMode`: not set in seed → DB default (likely `ONLINE`)
- `phone`: not set in seed → Footer fallback `+38 (097) 123-45-67` (UA placeholder)
- `email`: not set in seed → not shown in footer
- `address`: not set → `hasPhysicalLocation = false`
- `openingHours`: not set → shows default `t('schedule')` = "Mon–Sun: 9:00–20:00"

**Homepage sections** (`homeSections` ECOMMERCE): categories → bestsellers → product-of-day → brands → how-it-works → trust-strip → subscribe → popular-tags

**Footer:**
- storeName: "ElectroMarket" ✅ (from DB)
- aboutDesc: "Online store of professional power tools..." ✅ correct vertical
- Categories: drills, grinders, perforators, jigsaws, sanders, lasers ✅
- Phone: fallback `+38 (097) 123-45-67` ⚠️ placeholder, not from DB
- Email: not shown ⚠️
- deliveryNova: **shown** ("Nova Poshta delivery across Ukraine") — store is UA region, so acceptable
- schedule: "Mon–Sun: 9:00–20:00" ⚠️ online-only store should not show hours, but not critical

**Catalog:**
- Gender filter: NOT shown ✅ (vertical ≠ SHOE_MARKET)
- Filters: category, brand, price ✅
- `?new=true` / `?sale=true`: supported ✅

**Hardcoded "ElectroMarket":** none in source code ✅ (storeName from DB)

---

### Krajina — FOOD_MARKET (`STORE_SLUG=krajina`)

**Seed / presence:**
- `primaryMode`: `HYBRID`
- `address`: 'Marktstraße 15', `city`: set → `hasPhysicalLocation = true`
- `openingHours`: 'Mon-Sat 7:00-20:00' (from DB)
- `phone`: '+49 30 1234 5678' ✅
- `email`: set ✅

**Homepage sections**: hero → categories → bestsellers → product-of-day → how-it-works → delivery-zones → trust-strip → subscribe

**Footer:**
- storeName: from DB ✅
- aboutDesc: `t('aboutDescFood')` = "Fresh groceries, local produce..." ✅
- Categories: fruits, vegetables, dairy, meat, bakery, drinks, frozen, grocery ✅
- Phone: '+49 30 1234 5678' from DB ✅
- deliveryNova: **NOT shown** (isFoodMarket=true → excluded from condition) ✅
- schedule: 'Mon-Sat 7:00-20:00' from DB ✅

**Catalog:**
- Gender filter: NOT shown ✅
- Food categories shown ✅

---

### Adriano — RESTAURANT (`STORE_SLUG=adriano`)

**Seed / presence:**
- `primaryMode`: not found in seed-adriano.ts (restaurant likely PHYSICAL)
- Restaurant-specific data present (menu, reservations, gallery)

**Homepage sections**: hero → menu-categories → daily-specials → reservations → gallery → about → trust-strip

**Footer:**
- Dark theme (isDark = isRestaurant) ✅
- aboutDesc: `t('aboutDescRestaurant')` = "Authentic Italian cuisine with family recipes from Naples..." ✅
- Categories: antipasti, primi, secondi, pizza, dolci, bevande ✅ (RESTAURANT_CATEGORIES)
- deliveryNova: NOT shown (isRestaurant=true) ✅
- schedule: restaurant-specific (uses tMenu-style keys) ✅

**Catalog:**
- Gender filter: NOT shown ✅
- Menu items layout ✅

---

### StepStyle — SHOE_MARKET (`STORE_SLUG=stepstyle`)

**Seed / presence:**
- `primaryMode`: `ONLINE`
- `phone`: '+49 30 9876 5432' ✅ (DE phone)
- `email`: 'hello@stepstyle.eu' ✅
- `address`: not set → `hasPhysicalLocation = false`
- `openingHours`: not set → shows default `t('schedule')` = "Mon–Sun: 9:00–20:00"

**Homepage sections**: promo-banner → categories → bestsellers → product-of-day → new-arrivals → brands → how-it-works → trust-strip → subscribe ✅

**Footer:**
- storeName: "StepStyle" ✅
- aboutDesc: `t('aboutDesc')` = **"Online store of professional power tools..."** ❌ WRONG — power tools copy for shoe store
- Categories: drills, grinders, perforators, jigsaws, sanders, lasers ❌ WRONG — power tools categories for shoe store
- Phone: '+49 30 9876 5432' from DB ✅
- Email: 'hello@stepstyle.eu' shown ✅
- deliveryNova: **"Nova Poshta delivery across Ukraine"** ❌ WRONG — StepStyle is a DE/EU market store
- schedule: "Mon–Sun: 9:00–20:00" ⚠️ online-only store shouldn't show work hours

**Catalog:**
- Gender filter: shown (All / Men / Women / Kids chips) ✅
- `?gender=men` → Men + Unisex products ✅
- `?new=true` / `?sale=true` ✅
- Gender chips auto-apply ✅
- State sync on soft navigation ✅

**Image Lightbox:**
- Zoom trigger on hover ✅ (code confirmed)
- createPortal to body ✅
- ESC / backdrop close ✅

---

## Footer Issues Summary

| Issue | ElectroMarket | Krajina | Adriano | StepStyle | Severity |
|-------|:---:|:---:|:---:|:---:|:---:|
| storeName in copyright | ✅ DB | ✅ DB | ✅ DB | ✅ DB | — |
| aboutDesc text (first words) | "power tools..." ✅ | "fresh groceries..." ✅ | "authentic Italian..." ✅ | **"power tools..."** ❌ | 🔴 High |
| Categories in footer | drills/grinders ✅ | fruits/vegs ✅ | antipasti/pizza ✅ | **drills/grinders** ❌ | 🔴 High |
| Phone (from DB or default?) | fallback +38 ⚠️ | +49 DB ✅ | DB ✅ | +49 DB ✅ | 🟡 Med |
| Email shown? | ❌ not in seed | ✅ DB | ✅ DB | ✅ DB | 🟡 Med |
| "deliveryNova" shown? | ✅ UA store, OK | ❌ not shown | ❌ not shown | **✅ shown** ❌ | 🔴 High |
| schedule text | "Mon–Sun" default ⚠️ | DB "Mon-Sat 7-20" ✅ | handled ✅ | "Mon–Sun" default ⚠️ | 🟡 Med |
| Hardcoded "ElectroMarket"? | ❌ none | ❌ none | ❌ none | ❌ none | ✅ |

---

## Cross-Vertical Issues

### 5a. Missing i18n keys
```
grep "aboutDescShoe" messages/ → 0 results ❌
```
No `footer.aboutDescShoeMarket` key in any locale. Footer falls back to `aboutDesc` (power tools).

### 5b. SHOE_MARKET footer category links
Footer renders `CATALOG_CATEGORIES` for StepStyle:
- `/catalog?category=drills` — 0 results for StepStyle (wrong)
- Missing: `SHOE_MARKET_CATEGORIES` = sneakers, running, boots, sandals, dress-shoes, sport, kids

All these category keys **exist** in `messages/*/categories` namespace (added in prompt-shoe-categories-grid.md), just not wired into Footer.

### 5c. ElectroMarket seed — missing presence fields
`prisma/seed.ts` creates ElectroMarket without `phone`, `email`, `primaryMode`. Footer uses hardcoded fallback `+38 (097) 123-45-67`. Should add real contact to seed.

### 5d. Login page
`/en/login` — placeholder "Customer accounts coming soon". No form, no auth flow. Affects all 4 stores.

---

## Missing Features (all stores)

- [ ] **Testimonials section** — zero stores have it, not in any `homeSections` config
- [ ] **Registration / Login** — placeholder page only
- [ ] **Footer: `aboutDescShoeMarket`** — i18n key missing in all 7 locales
- [ ] **Footer: SHOE_MARKET categories** — Footer.tsx needs `SHOE_MARKET_CATEGORIES` array + logic
- [ ] **Footer: `deliveryNova` hidden for DE stores** — needs vertical/region check (StepStyle is ONLINE + EU)
- [ ] **ElectroMarket seed** — add `phone`, `email`, `primaryMode: 'ONLINE'` to seed.ts

---

## Recommended Fix Order

| Priority | Task | Files |
|----------|------|-------|
| 🔴 1 | Footer `aboutDesc` for SHOE_MARKET | `Footer.tsx` + `messages/*.json` (7 locales) |
| 🔴 2 | Footer categories for SHOE_MARKET | `Footer.tsx` — add `SHOE_MARKET_CATEGORIES` |
| 🔴 3 | Hide `deliveryNova` for non-UA stores | `Footer.tsx` — check regionBundle or vertical |
| 🟡 4 | ElectroMarket seed — add phone/email | `prisma/seed.ts` |
| 🟡 5 | Remove default schedule for online stores | `Footer.tsx` — condition tweak |
| 🟢 6 | Testimonials section | New component + homeSections config |
| 🟢 7 | Registration / Login | New pages + auth flow |
