# AUDIT_REPORT.md

## 1. PROJEKT-GRUNDSTRUKTUR
- **Framework**: Next.js 13.5.1
- **Package Manager**: npm
- **App-Typ**: Single App (kein Monorepo)
- **Struktur**: Keine `apps/` oder `packages/` Ordner
- **Sprache**: TypeScript
- **Root-Level-Ordner**:
    - `app/`: Next.js App-Router Dateien (Pages, Layouts, Global CSS)
    - `components/`: UI-Komponenten (Kiosk-Logik und shadcn/ui)
    - `hooks/`: Custom React Hooks (z.B. `use-toast`)
    - `lib/`: Hilfsfunktionen, Mock-Daten und TypeScript-Interfaces
    - `.bolt/`: Konfigurationsdateien für die Bolt-Lernumgebung
    - `node_modules/`: Installierte Abhängigkeiten

## 2. DEPENDENCIES
### Production Dependencies
- `next`: 13.5.1
- `react`, `react-dom`: 18.2.0
- `@supabase/supabase-js`: ^2.58.0 (Installiert, aber nicht initialisiert)
- `lucide-react`: ^0.446.0 (Icons)
- `recharts`: ^2.12.7 (Charts)
- `react-hook-form`: ^7.53.0
- `zod`: ^3.23.8 (Validierung)
- `sonner`, `vaul`: (UI-Feedback/Drawers)
- `@radix-ui/*`: (Primitiv-Komponenten für shadcn/ui)

### Dev Dependencies (Key)
- `typescript`: 5.2.2
- `eslint-config-next`: 13.5.1
- `tailwindcss`: 3.3.3
- `autoprefixer`, `postcss`: CSS-Processing

### Frameworks & Libraries
- **Supabase-Client**: `@supabase/supabase-js` ist vorhanden, aber es gibt noch keine Initialisierung (kein `client.ts`).
- **UI-Library**: shadcn/ui (basierend auf Radix UI) ist voll integriert.
- **State-Management**: Kein zentrales State-Management (Zustand/Jotai fehlt). Aktuell wird React `useState` auf Top-Level Ebene (`KioskApp.tsx`) genutzt.

## 3. ROUTING & PAGES
- **Routes**:
    - `/`: Die einzige echte Route (`app/page.tsx`). Sie rendert die `KioskApp`-Komponente, die das interne View-Management übernimmt.
- **Views (Internes Routing)**:
    - `dashboard`: Dashboard-Statistiken und Schnellzugriff.
    - `products`: Produktverwaltung.
    - `orders`: Bestellübersicht.
    - `customers`: Kundenliste.
    - `settings`: Shop-Einstellungen.
- **Layouts**:
    - `app/layout.tsx`: Root-Layout mit Font-Initialisierung und Providern.
- **Middleware**: Keine Middleware vorhanden.

## 4. KOMPONENTEN
- **Gesamtanzahl**: ca. 57 Komponenten (10 projektspezifisch, 47 UI-Basiskomponenten).
- **Top-Level Components (`/components/kiosk`)**:
    - `KioskApp.tsx`: Orchestriert die gesamte App.
    - `Sidebar.tsx`: Navigation für Desktop.
    - `BottomNav.tsx`: Navigation für Mobile.
    - `Dashboard.tsx`: Statistikkarten und Charts.
    - `Products.tsx` / `ProductDrawer.tsx`: Produktverwaltung.
    - `Orders.tsx` / `OrderStatusBadge.tsx`: Bestellverwaltung.
    - `Customers.tsx`: Kundenübersicht.
    - `ShopSettings.tsx`: Konfiguration.
- **shadcn/ui Components**: Vollständige Palette vorhanden (Accordion, Button, Card, Dialog, Table, etc.).
- **Header/Nav**: Sidebar (Desktop) und BottomNav (Mobile) sind implementiert.

## 5. DATEN & STATE
- **Datenquelle**: Aktuell ausschließlich lokale Mock-Daten aus `lib/kiosk-data.ts`.
- **Mock-Data Struktur**:
    - **Products**:
      ```typescript
      interface Product {
        id: number;
        name: string;
        category: string;
        price: number;
        sale_price: number | null;
        available: boolean;
        image: string | null;
        stock_count: number | null;
        sku: string;
        supplier?: string;
      }
      ```
    - **Orders**:
      ```typescript
      interface Order {
        id: string;
        customer: string;
        items: string;
        total: number;
        status: 'new' | 'confirmed' | 'ready' | 'picked_up' | 'cancelled';
        time: string;
        type: 'pickup' | 'delivery';
      }
      ```
    - **Customers**:
      ```typescript
      interface Customer {
        id: number;
        name: string;
        email: string;
        orders: number;
        newsletter: boolean;
      }
      ```

## 6. STYLING
- **Tailwind CSS**: Installiert und konfiguriert (`tailwind.config.ts`).
- **Custom CSS**: `app/globals.css` enthält die shadcn/ui Variable-Definitionen.
- **Theme**:
    - **Dark Mode**: Konfiguriert via `.dark` Klasse (Next-Themes integriert).
    - **Farbe**: Akzentfarbe ist ein kräftiges Orange/Rot (`--accent: 13 100% 54%`).
    - **Hintergrund**: `bg-[#DEDEDE]` wird auf Root-Ebene genutzt.

## 7. AUTH & SUPABASE
- **Supabase Integration**: `@supabase/supabase-js` ist in der `package.json`, aber es gibt **keinen** initialisierten Client und keine API-Nutzung im Code.
- **Auth-Flows**: Keine Auth-Pages (Login/Signup) vorhanden. Die App startet direkt im Dashboard.
- **Environment**: Keine `.env` oder `.env.example` Dateien im Root gefunden.

## 8. BUILD & DEV
- **Dev-Command**: `npm run dev`
- **Build-Check**: `npm run build` läuft fehlerfrei durch (Verifiziert am 17.04.2026).
- **Lint-Check**: `npm run lint` liefert keine Fehler (Verifiziert).
- **TypeScript-Check**: `tsc --noEmit` liefert keine Fehler (Verifiziert).

## 9. FEATURE-STATUS (aus dem UI)
- **Navigation**: Funktioniert echt via React State (Local Routing).
- **Produkt hinzufügen**: Funktioniert im Memory (wird zur Liste hinzugefügt), geht aber nach Reload verloren (da Mock data).
- **Produkt-Toggle (Verfügbar)**: Funktioniert im Memory.
- **Bestellung bestätigen**: Funktioniert im Memory (Status-Change UI-technisch echt).
- **Kategorie hinzufügen**: Funktioniert im Memory (ShopSettings).

## 10. BEKANNTE PROBLEME
- **TODOs**: Keine "TODO", "FIXME" oder "HACK" Kommentare im Source-Code gefunden.
- **Console**: Keine kritischen Fehlermeldungen bei der statischen Analyse.
- **Fehlende Teile**: Supabase-Integration ist zwar vorbereitet (Dependency), aber technisch noch nicht gestartet.
