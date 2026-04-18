# KioskOS Audit Report 2

**Datum:** 18. April 2026  
**Status:** Das Projekt ist in einem soliden MVP-Zustand — alle Kernfeatures laufen auf echter Supabase-DB, die wichtigsten Sicherheitsrisiken sind begrenzt durch fehlende Auth, aber nicht durch fehlerhafte Queries.

---

## Executive Summary

KioskOS hat alle vier Hauptbereiche (Dashboard, Produkte, Bestellungen, Kunden) erfolgreich auf Supabase migriert. Der Tagesabschluss und CSV-Import sind funktional. Die kritischsten offenen Punkte sind: (1) **fehlende Toast-Alerts bei Mutations-Fehlern** in `use-orders.ts` und `use-products.ts`, (2) **hardcodierte Shop-Stammdaten** in `ShopSettings.tsx` ohne DB-Anbindung, (3) **`ean`-Feld in `types.ts`** stimmt nicht mit dem tatsächlichen DB-Feld `gtin` überein (Schema-Drift), und (4) der Kategorie-Lösch-Button in `ShopSettings` ist **UI-dead** (existiert, tut aber nichts). Kein kritisches Sicherheitsproblem gefunden.

---

## 1. Sicherheit & Datenkonsistenz

### Store-ID-Filter

Alle Supabase-Queries sind korrekt mit `.eq('store_id', DEMO_STORE_ID)` gefiltert. Kein einziger Query ohne Store-Filter gefunden.

| Datei | Queries mit Store-Filter |
|-------|--------------------------|
| `use-products.ts` | ✅ fetchProducts, fetchCategories, addProduct, addCategory |
| `use-orders.ts` | ✅ fetchOrders |
| `use-customers.ts` | ✅ fetchCustomers |
| `use-dashboard-stats.ts` | ✅ todayOrders, productCount, recentOrders |
| `use-daily-closing.ts` | ✅ fetchTodaySummary, saveClosing, fetchHistory |
| `use-csv-import.ts` | ✅ categories fetch, category insert, products insert |

### Mutations ohne vollständige Fehlerbehandlung

| Fund | Datei | Zeile | Schweregrad |
|------|-------|-------|-------------|
| `toggleAvailability`: Rollback korrekt, aber **kein Toast** bei Fehler — User sieht nichts | `use-products.ts` | 61–67 | 🟡 mittel |
| `advanceStatus`: Rollback korrekt, aber **kein Toast** bei Fehler | `use-orders.ts` | 85–91 | 🟡 mittel |
| `cancelOrder`: Bei Fehler nur `fetchOrders()` — **kein Toast, kein Rollback** in UI | `use-orders.ts` | 103–106 | 🟡 mittel |
| `use-dashboard-stats.ts` catch: `console.error` ohne jegliches User-Feedback | `use-dashboard-stats.ts` | 100–102 | 🟢 minor |
| `fetchTodaySummary` in `use-daily-closing.ts`: kein try/catch-Error-Handling im finally-Fall — bei Supabase-Fehler wirft die Funktion unbehandelt | `use-daily-closing.ts` | 40–66 | 🟡 mittel |
| `fetchHistory`: kein catch — Fehler werden still geschluckt | `use-daily-closing.ts` | 117–130 | 🟢 minor |

### Sensible Felder

- `stripe_payment_intent_id` ist in `Order`-Type definiert, wird aber **nirgendwo gerendert** ✅
- `stripe_account_id` existiert nicht im Frontend-Schema ✅
- `owner_id` im `Store`-Type, wird nicht genutzt ✅

### Schema-Drift: `ean` vs `gtin`

🔴 **Kritisch (Datenintegrität):** `lib/supabase/types.ts` definiert `Product.ean: string | null` (Zeile 31), aber das DB-Feld heißt laut Migration 002 `gtin`. Das bedeutet:
- `use-products.ts` selektiert mit `.*` — das `gtin`-Feld kommt in die App als `gtin`, aber der TypeScript-Type sagt `ean`
- Wenn irgendwo `product.ean` genutzt wird, ist es immer `undefined`
- `ProductDrawer.tsx` rendert möglicherweise das falsche Feld

---

## 2. Feature-Status

| Feature | Status | Notizen |
|---------|--------|---------|
| **Dashboard — Tagesumsatz** | ✅ | `todayRevenue` aus Supabase, korrekt formatiert |
| **Dashboard — Bestellungen heute** | ✅ | `todayOrderCount`, Cancelled/Refunded ausgeschlossen |
| **Dashboard — Neu-Badge** | ✅ | Animierter Dot bei newOrderCount > 0 |
| **Dashboard — Produkte-Count** | ✅ | Live aus DB via COUNT query |
| **Dashboard — Offen-Betrag** | ✅ | Conditional angezeigt bei openAmount > 0 |
| **Dashboard — Letzte Bestellungen** | ✅ | 3 neueste, mit items_summary, Zeitanzeige |
| **Dashboard — Loading States** | ✅ | Skeleton für alle Karten |
| **Dashboard — Tagesabschluss-Button** | ✅ | Öffnet DailyClosingSheet |
| **Produkte — Liste/Grid** | ✅ | Beide Ansichten funktional, Toggle in ShopSettings |
| **Produkte — Hinzufügen** | ✅ | Via ProductDrawer + useProducts.addProduct |
| **Produkte — Bearbeiten** | ✅ | Edit-Drawer, updateProduct |
| **Produkte — Archivieren** | ✅ | is_archived = true, aus UI entfernt |
| **Produkte — Toggle Verfügbarkeit** | ✅ | Optimistic update mit Rollback |
| **Produkte — CSV-Import** | ✅ | Drag&Drop, BOM-Strip, gtin korrekt |
| **Produkte — Kategorie-Filter** | ✅ | Scroll mit Fade-Indikator |
| **Produkte — Suche** | ✅ | Client-seitig, live |
| **Bestellungen — Live-Daten** | ✅ | useOrders Hook, letzten 50 |
| **Bestellungen — Status-Filter-Tabs** | ✅ | mit Count-Badge bei Neu |
| **Bestellungen — Status-Machine** | ✅ | new→confirmed→ready→picked_up |
| **Bestellungen — Stornieren** | ✅ | cancelled_at Timestamp |
| **Bestellungen — Relative Zeit** | ✅ | timeAgo() Funktion |
| **Bestellungen — Empty State** | ✅ | ShoppingBag Icon mit Text |
| **Kunden — Live-Daten** | ✅ | useCustomers, mit order join |
| **Kunden — Suche** | ✅ | Client-seitig, Name + Email |
| **Kunden — Order-Count** | ✅ | Cancelled/Refunded ausgeschlossen |
| **Kunden — Total-Spent** | ✅ | Berechnet aus order.total |
| **Kunden — Newsletter-Badge** | ✅ | newsletter_opt_in korrekt |
| **Tagesabschluss — Kassensturz** | ✅ | expectedCash = totalRevenue - onlineRevenue |
| **Tagesabschluss — Speichern** | ✅ | upsert avec RLS-Policy |
| **Tagesabschluss — Verlauf** | ✅ | Letzte 30 Abschlüsse |
| **ShopSettings — View-Mode Toggle** | ✅ | Tabelle/Kacheln, persistent im State |
| **ShopSettings — Kategorien verwalten** | ✅ | Hinzufügen funktional |
| **ShopSettings — Kategorie löschen** | ❌ | Button existiert, tut nichts ("Phase 2") |
| **ShopSettings — Shop-Stammdaten** | ❌ | Hardcoded, readOnly, keine DB-Anbindung |

---

## 3. UI/UX Findings

### Konsistenz — Farben & Design

| Fund | Datei | Fix |
|------|-------|-----|
| `bg-zinc-800` für Tagesabschluss-Button im Dashboard — weicht von roter Primärfarbe ab | `Dashboard.tsx:104` | Entweder bewusst (Dark-Call-to-Action) oder auf `bg-gray-800` vereinheitlichen |
| `bg-gray-100 hover:bg-gray-100` — hover identisch mit Normal-State | `Customers.tsx:114`, `Orders.tsx:199` | `hover:bg-gray-200` als Hover-State |
| Kunden-Details-Button hat keinen onClick — dead UI element | `Customers.tsx:114` | Deaktivieren oder mit Funktionalität versehen |

### Mobile UX

| Fund | Status | Details |
|------|--------|---------|
| BottomNav Overlap | ✅ OK | KioskApp hat `pb-20 md:pb-8` auf main container |
| BottomNav `fixed bottom-0 left-0 right-0 z-50` | ✅ OK | Korrekte Fixed-Positionierung |
| Orders Filter-Tabs horizontal scroll | ⚠️ | Hat `scrollbar-hide` Klasse aber **kein Tailwind-Plugin** — der Browser zeigt möglicherweise eine Scrollbar. Kein Fade-Indikator wie bei Produkten |
| Products Kategorie-Scroll | ✅ | Hat Fade-Indikator und scrollbar-hidden via Bracket-Notation |
| Formulare (ProductDrawer) | Nicht geprüft (Datei nicht analysiert) | — |

### Tap Targets

| Fund | Datei | Status |
|------|-------|--------|
| BottomNav Items: `min-h-[48px]` | `BottomNav.tsx:29` | ✅ OK |
| Order Action Buttons: `min-h-[44px]` | `Orders.tsx:158,177,188,199` | ✅ OK |
| Products Toggle Button: `min-h-[44px]` | `Products.tsx:392` | ✅ OK |
| Products Edit Button: `min-w-[44px] min-h-[44px]` | `Products.tsx:403,460` | ✅ OK |
| Kategorie-Löschen-Button: `w-8 h-8` (32px) | `ShopSettings.tsx:109` | 🟡 Unter 44px — aber dead button |

### User Feedback & Toasts

| Aktion | Toast | Status |
|--------|-------|--------|
| Produkt hinzufügen | ✅ | "Produkt hinzugefügt" |
| Produkt bearbeiten | ✅ | "Produkt aktualisiert" |
| Produkt archivieren | ✅ | "Produkt archiviert" |
| Toggle Verfügbarkeit | ❌ | Kein Toast (weder Erfolg noch Fehler) |
| Status bestätigen | ❌ | Kein Toast |
| Bestellung stornieren | ❌ | Kein Toast |
| Kategorie hinzufügen | ✅ | Toast vorhanden |
| Tagesabschluss speichern | ✅ | "Tagesabschluss gespeichert" |
| CSV-Import | ✅ | Erfolg + Fehler-Count |

### Bestätigungsdialoge

| Aktion | Dialog | Status |
|--------|--------|--------|
| Produkt archivieren | ✅ | `window.confirm('Produkt wirklich archivieren?')` — Deutsch, OK |
| Bestellung stornieren | ❌ | Kein Bestätigungsdialog — direktes Stornieren |

### Sprache & Texte

| Fund | Datei | Zeile | Fix |
|------|-------|-------|-----|
| `"Fetching..."` oder englische Texte | — | ✅ Keine gefunden |
| Alle UI-Texte auf Deutsch | ✅ | — |
| Zahlenformat | ✅ | `toLocaleString('de-DE')` und `.toFixed(2)` mit `€` Prefix |
| `timeAgo` gibt "Gerade eben" / "vor X Min" | ✅ | Korrekt Deutsch |

---

## 4. Shop Optionen — Erweiterungsplan

### Bereits vorhanden & funktional
- ✅ **View-Mode Toggle** (Tabelle/Kacheln) — State-basiert, kein DB-Persist (bewusst als UX-Präferenz)
- ✅ **Kategorien hinzufügen** — DB-Anbindung funktional
- ❌ **Kategorien löschen** — UI-Button existiert, Logik fehlt

### Im `stores`-Table vorhanden, noch nicht im UI

| Setting | DB-Feld | MVP-kritisch? | Priorität |
|---------|---------|---------------|-----------|
| Shop-Name | `stores.name` | ✅ Ja | 🔴 Hoch — aktuell hardcoded |
| Adresse | `stores.address` | ✅ Ja | 🔴 Hoch — auf Belegen/Storefront |
| E-Mail | `stores.email` | ✅ Ja | 🔴 Hoch |
| Telefon | `stores.phone` | 🟡 Mittel | 🟡 Mittel |
| Logo | `stores.logo_url` | 🟡 Mittel | 🟡 Mittel |

### Fehlend — für die `store_settings`-Tabelle (falls vorhanden)

| Setting | MVP-kritisch? | Empfehlung |
|---------|---------------|------------|
| Theme / Primärfarbe | ❌ Nein | Nice-to-have Phase 3 |
| Fulfillment-Optionen (Pickup/Delivery aktiv) | ✅ Ja | Phase 2 — bestimmt welche Order-Typen möglich sind |
| Mindestbestellwert | 🟡 Mittel | Phase 2 |
| Lokale Lieferung (Radius, Gebühr) | ❌ Nein | Phase 3 |

### Fehlend komplett (kein Schema)

| Setting | MVP-kritisch? | Empfehlung |
|---------|---------------|------------|
| Öffnungszeiten | 🟡 Mittel | Schema-Migration empfohlen, Phase 2 |
| E-Mail-Benachrichtigung bei neuer Bestellung | ✅ Ja | Supabase Edge Function, Phase 2 |
| Drucker/Bon-Integration | ❌ Nein | Phase 3 |

---

## 5. Technische Schulden

### TypeScript `any`-Typen

| Datei | Zeile | Kontext | Handlungsbedarf |
|-------|-------|---------|-----------------|
| `use-orders.ts` | 37 | Supabase join result mapping | 🟢 Kommentiert, akzeptabel |
| `use-orders.ts` | 120 | `productsToInsert: any[]` | 🟢 Kommentiert, akzeptabel |
| `use-customers.ts` | 34,35,41 | Supabase join result | 🟢 Kommentiert, akzeptabel |
| `use-dashboard-stats.ts` | 54,57–62 | Partial-Select rows | 🟢 Kommentiert, akzeptabel |
| `use-daily-closing.ts` | 47,48 | Partial-Select rows | 🟢 Kommentiert, akzeptabel |

### Schema-Drift (wichtigster Fund)

🔴 `lib/supabase/types.ts` Line 31: `ean: string | null` sollte `gtin: string | null` sein, wenn die DB-Migration `gtin` verwendet. Der CSV-Import schreibt korrekt `gtin`, aber der TypeScript-Type kennt es nicht. Dies führt zu:
- TypeScript sieht `product.ean` als valide, aber DB gibt `gtin` zurück
- `product.ean` ist immer `undefined` im Frontend
- `ProductDrawer` zeigt EAN-Feld falsch an (falls es `product.ean` liest)

### useEffect Dependencies

| Datei | Issue |
|-------|-------|
| `DailyClosingSheet.tsx:26` | `// eslint-disable-next-line react-hooks/exhaustive-deps` — `fetchTodaySummary` und `fetchHistory` sind via `useCallback([])` stabil, das Disable ist korrekt aber unelegant |

### TODO/FIXME Kommentare

| Datei | Zeile | Kommentar |
|-------|-------|-----------|
| `ShopSettings.tsx` | 110 | `title="Kategorie löschen (Phase 2)"` |
| `ShopSettings.tsx` | 175 | `Bearbeitung in Einstellungen verfügbar (Phase 2)` |
| `use-daily-closing.ts` | 90–91 | `// closed_by = null bis Auth implementiert ist` |

### Duplizierte Logik

| Duplikat | Dateien |
|----------|---------|
| `timeAgo()` Funktion | `Orders.tsx` — aber Dashboard.tsx zeigt Uhrzeit statt `timeAgo` (kein Duplikat, bewusst unterschiedlich) |
| `todayStart` Berechnung | `use-dashboard-stats.ts:37–39` und `use-daily-closing.ts:37–38` — identische Logik, könnte in `lib/utils.ts` extrahiert werden |

### Memory Leaks

- Keine Realtime-Subscriptions offen — alle Hooks nutzen one-shot `fetchX()` ohne Cleanup-Bedarf ✅
- Kein `setInterval` oder ähnliches ohne Cleanup ✅

### `lib/kiosk-types.ts` nach Cleanup

✅ Enthält nur noch `NavPage` — korrekt bereinigt.

---

## Empfohlene nächste Schritte (nach Priorität)

### 🔴 1. Schema-Drift beheben: `ean` → `gtin` in types.ts
```typescript
// lib/supabase/types.ts, Zeile 31
gtin: string | null  // war: ean: string | null
```
Und alle Stellen prüfen die `product.ean` referenzieren (ProductDrawer, Products.tsx).

### 🔴 2. Fehlende Toasts bei Status-Aktionen nachrüsten
In `use-orders.ts`: Toast nach `advanceStatus` und `cancelOrder`. Da die Hooks keine Toast-Abhängigkeit haben sollen, können die Toasts direkt in `Orders.tsx` in den `onClick`-Handlern abgefeuert werden.

### 🟡 3. Shop-Stammdaten mit Supabase verbinden
`ShopSettings.tsx` — Shop-Name, Adresse, E-Mail, Telefon aus der `stores`-Tabelle laden und bearbeitbar machen (einen eigenen Hook `use-store-settings.ts` erstellen).

### 🟡 4. Bestätigungsdialog vor Stornierung + Storno-Toast
```tsx
// Orders.tsx — onCancel Handler
if (!window.confirm('Bestellung wirklich stornieren?')) return;
cancelOrder(order.id);
toast.success('Bestellung storniert');
```

### 🟢 5. Kategorie-Lösch-Funktion implementieren
In `use-products.ts` eine `deleteCategory(id)` Funktion ergänzen und den Button in `ShopSettings.tsx` verdrahten (mit Bestätigungsdialog und Warnung falls Produkte in der Kategorie vorhanden).
