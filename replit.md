# Miftah Digital Store Management Dashboard

## Overview
A web-based admin dashboard for managing a digital products store. Features include:
- **Dashboard home page** with key stats, alerts, quick actions, and product health overview
- Product and supplier management with card-based UI
- Pricing strategies and bundle management
- Exchange rate tracking (USD/SAR)
- Reports with PDF/Excel export + visual SVG charts (donut + bar charts)
- Product categories system with color/icon picker and inline creation
- Arabic-language UI (RTL layout)
- Western Arabic numerals (0-9) enforced throughout

## Tech Stack
- **Framework:** React 19
- **Build Tool:** Vite 8
- **Package Manager:** npm
- **Charts:** Recharts
- **Excel:** SheetJS (xlsx)
- **PDF:** jsPDF + jspdf-autotable
- **Desktop:** Electron + electron-builder (optional .exe build)

## Data Persistence
All state is saved to browser `localStorage` under the key `miftah_store_data`. No backend or database required.
- **Debounced saves** (500ms) to prevent excessive writes during rapid edits
- **Data versioning** (`_version` field) for future migration support
- **Backup recovery**: `_last_good` backup key; corrupted primary auto-falls back to backup
- **Quota handling**: On `QuotaExceededError`, clears auxiliary keys and retries save

## Project Structure
- `src/App.jsx` — Root component with state management and hash-based tab routing
- `src/components/Dashboard.jsx` — Dashboard home page with stats, alerts, product health, quick actions
- `src/components/ProductTable.jsx` — Card-based product grid with supplier manager panel
- `src/components/ReportsExport.jsx` — Reports page with PDF export, grouped analytics tables (expand/collapse), product/supplier reports
- `src/components/SettingsPage.jsx` — Settings with card grid layout, theme toggle, data management, duration chips
- `src/components/pricing/` — PricingDashboard, PricingOverview, CostManager, PricingMechanisms, CouponsManager
- `src/components/bundles/` — BundleManager, BundleOverview, BundleBuilder, BundlePricing
- `src/components/ProductFeatures.jsx` — Product descriptions & features editor with formatting toolbar, icon/badge picker, copy features, templates, AI bundle creation support
- `src/components/AIAssistantTab.jsx` — AI chat assistant with MIFTAH_ACTION support for product editing and bundle creation
- `src/components/GlobalAIAssistant.jsx` — Global floating AI chat with GLOBAL_ACTION support for store management and bundle creation
- `src/components/Icons.jsx` — SVG icon components (Lucide-inspired)
- `src/data/initialData.js` — Default configuration values
- `src/data/productTemplates.js` — Pre-built feature templates for popular products (ChatGPT, Spotify, Canva, etc.)
- `src/index.css` — Global styles (card layout, responsive grid, numeral settings)
- `public/` — Static assets

## Number Formatting Convention
All components use `toLocaleString('en-US')` helpers to ensure Western Arabic numerals:
- `fmt(v)` — formats to 2 decimal places (prices/costs)
- `fmtPct(v)` — formats to 1 decimal place (percentages)
- `fmtInt(v)` — formats with no decimals (integers)
- Dates use `ar-SA-u-nu-latn` locale to force Western numerals

## Tab Navigation
State-based routing: `dashboard` (default), `products`, `pricing`, `bundles`, `features`, `reports`, `settings`
- Sticky nav bar (stays visible while scrolling, below header)
- Active tab: subtle purple gradient bg, border highlight, bottom indicator line
- Hover: border reveal + partial indicator line preview
- Smooth page transitions on tab switch (fade in/out)

## UI Architecture
### Dashboard (Home)
- **Stats Cards:** Total products, suppliers, bundles, average margin
- **Alerts:** Products needing attention (unpriced, low margin, etc.)
- **Product Health Bar:** Visual status bar with good/warning/danger segments
- **Products Table:** Top products with margin indicators
- **Quick Actions:** Direct links to add product, create bundle, export report, etc.
- **Sidebar Widgets:** Pricing summary, best supplier

### Products & Prices Page
- **Card Grid Layout:** Products displayed as responsive cards (1 col mobile, 2 tablet, 3+ desktop)
- **Product Cards:** Show product name, account type, activation methods, plan summaries with best prices
- **Branch Products:** Products can have child "branches" (parentId); branch cards show indent + green left-border + parent name indicator; main cards show branch count badge
- **Add Branch Button:** Each product card has a branch button (GitBranchIcon) to create a child branch product
- **Advanced Filter Panel:** Toggle button next to search reveals: product type filter (all/main/branches), supplier filter, category filter, sort by (name/price asc/desc); active filter count badge shown on button
- **Expandable Plans:** Click "عرض التفاصيل" to see full supplier price breakdowns per plan
- **Supplier Manager Panel:** Collapsible panel at top for managing suppliers and their contact info
- **Per-supplier Product Links (PDM):** In ProductDetailModal comparison table, each supplier row has an inline editable URL link stored at `product.supplierLinks[supplierId]`
- **Per-supplier Activation Methods (PDM):** Each supplier row in the comparison table shows its own activation method chips with a picker dropdown for adding/removing methods, stored at `product.supplierActivationMethods[supplierId]`
- **All numbers use Western Arabic numerals (0-9)** via CSS font-feature-settings and `toLocaleString('en-US')`

## UX Features
- **Page transitions:** Smooth fade in/out animation when switching between tabs
- **Scroll to top:** Automatically scrolls to top on tab change (both click and browser back/forward)
- **Nav badge:** Dashboard tab shows alert count badge for products needing attention
- **Show more/less:** Dashboard alerts and products table have expand/collapse toggles
- **Back to top:** Floating button appears when scrolling down for quick navigation
- **Grouped tables:** Reports analytics table groups products with collapse/expand and summary chips
- **Footer:** Branded footer with product/supplier/bundle counts

## Development
```bash
npm install
npm run dev   # Runs on http://localhost:5000
```

## Electron Desktop Build
```bash
npm run electron:dev    # Dev mode with hot reload
npm run electron:build  # Build .exe installer (output in /release)
```

## Deployment
Configured as a static site:
- Build: `npm run build`
- Output directory: `dist`

## GitHub Repositories
- Web: `khalilkorichi/miftah-store-management`
- Desktop: `khalilkorichi/miftah-store-management-desktop`
