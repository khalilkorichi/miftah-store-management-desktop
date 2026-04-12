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
- **Desktop:** Electron + electron-builder (optional .exe build). Electron files use `.cjs` extension (CommonJS) because `package.json` has `"type": "module"`

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
- `src/components/ModalOverlay.jsx` — Unified modal overlay wrapper (backdrop blur, click-outside-to-close, ESC key)
- `src/components/NotificationContext.jsx` — Notification system context provider with localStorage persistence and sound effects
- `src/components/NotificationPanel.jsx` — Dropdown notification panel with category tabs, read/unread states, timestamps
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
- **Three Product Types:**
  1. منتج عادي/مستقل (Standalone): no parentId and no branches — visible in ALL pages
  2. منتج مفرع/وعاء (Branched Container): no parentId but HAS branch children — visible ONLY in ProductTable (hidden from Dashboard, Pricing, Bundles, Features, Reports, Operations)
  3. فرع (Branch): has parentId pointing to its container — visible in ALL pages as a standalone product
- **Smart Filtering:** `visibleProducts` in App.jsx = branches + standalone products; parent containers excluded. All non-ProductTable components use `visibleProducts`. ProductTable receives full `products` for hierarchical view.
- **Add Product Flow:** "إضافة منتج" button → ProductTypeSelector dialog → choose "منتج عادي" (opens AddProductModal) or "منتج مفرع" (opens CreateBranchedProductModal)
- **CreateBranchedProductModal:** Multi-branch creation modal — sets parent name, adds multiple branches (each with name, duration plans, activation methods, prices), creates parent+all branches atomically in one state update via `handleAddBranchedProduct`
- **Branch Products:** branch cards show indent + green left-border + parent name indicator; parent cards show branch count badge
- **Add Branch Button:** Each product card has a branch button (GitBranchIcon) to create a child branch product
- **Advanced Filter Panel:** Toggle button next to search reveals: product type filter (all/main/branches), supplier filter, category filter, sort by (name/price asc/desc); active filter count badge shown on button
- **Expandable Plans:** Click "عرض التفاصيل" to see full supplier price breakdowns per plan
- **Supplier Manager Panel:** Collapsible panel at top for managing suppliers and their contact info
- **Per-supplier Product Links (PDM):** In ProductDetailModal comparison table, each supplier row has an inline editable URL link stored at `product.supplierLinks[supplierId]`
- **Per-supplier Activation Methods (PDM):** Each supplier row in the comparison table shows its own activation method chips with a picker dropdown for adding/removing methods, stored at `product.supplierActivationMethods[supplierId]`
- **All numbers use Western Arabic numerals (0-9)** via CSS font-feature-settings and `toLocaleString('en-US')`

## Modal System
- **ModalOverlay component** (`src/components/ModalOverlay.jsx`): Unified overlay wrapper with `backdrop-filter: blur(8px)`, `rgba(0,0,0,0.45)` background, click-outside-to-close, ESC key handler
- **Z-Index Scale** (CSS variables in `:root`): `--z-nav: 100`, `--z-floating: 200`, `--z-modal-overlay: 1000`, `--z-modal-box: 1001`, `--z-toast: 1100`
- All modal overlays use unified positioning (`position: fixed; inset: 0`) and consistent blur/opacity
- Migrated modals: AddProductModal, AddSupplierModal, ConfirmModal, CompetitorsModal, ActivationMethodsModal, ImportSallaModal, ProductTypeSelector, CreateBranchedProductModal, NotesManager

## Notification System
- **NotificationContext** (`src/components/NotificationContext.jsx`): React context + provider for notification state management
  - Stores notifications in localStorage (`miftah_notifications` key), max 100 entries
  - Validates parsed data (Array.isArray + field checks) for corruption resilience
  - Functions: `addNotification({type, title, description, category, actionTab, playSound})`, `markAsRead(id)`, `markAllAsRead()`, `clearAll()`, `clearCategory(category)`
  - Sound utility: Web Audio API tone for success/error/info events
- **NotificationPanel** (`src/components/NotificationPanel.jsx`): Dropdown panel anchored to bell icon in header
  - Category filter tabs: الكل, المنتجات, التسعير, الحزم, العمليات, النظام
  - Notification items with type icons (success/error/warning/info), relative timestamps, read/unread state
  - Mark all read, clear all, close actions with proper aria-labels
  - Click notification → mark as read + navigate to relevant tab via handleTabChange
  - Close on outside click (mousedown) or ESC key
  - Fully accessible: role="dialog", aria-expanded on bell, keyboard Enter/Space on items
- **Bell icon**: In header-left next to theme toggle, with red unread count badge (animated)
- **Notification triggers**: Comprehensive coverage of all data operations:
  - **Products**: add, delete, duplicate, import, branch (move/detach/attach/add), category add/delete
  - **Pricing**: final prices save, cost add/toggle/delete, coupon add/toggle/delete, duration add/delete
  - **Bundles**: create, edit, delete, duplicate
  - **Operations**: task create/update/delete/status change, note create/update/delete, guide create/update/delete, renewal add/update/delete/renew, activation method add/delete
  - **System**: data reset, import, export, report PDF generation (success/error)
  - **Components with hooks**: CouponsManager, CostManager, TaskManager, NotesManager, ActivationGuidesManager, RenewalReminders, BundleBuilder, BundleOverview, ReportsExport
- **Categories**: products, pricing, bundles, operations, system — each with color and icon mapping

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

## Update System (Electron — GitHub Direct File Sync)
The update system in Settings → "التحديثات" tab uses direct GitHub file synchronization instead of electron-updater. It compares local files with the GitHub repository and downloads only changed files.

**Flow:**
1. User enters GitHub repo URL and saves it
2. Clicks "البحث عن تحديثات" → app queries GitHub API for repo tree
3. Compares local file SHAs (git blob SHA1 format) with remote SHAs
4. Shows categorized diff: modified/added files grouped by category (build, core, source, assets, config)
5. Optional: user creates backup to a chosen folder
6. Clicks "تطبيق التحديث" → downloads all files to staging dir first, verifies SHA integrity, then copies atomically to app directory
7. Restarts app to apply changes

**Security:**
- Path traversal protection: all file paths validated against tracked allowlist and containment check
- SHA integrity verification: downloaded files verified against expected git blob SHA before applying
- Atomic updates: all-or-nothing — if any file fails, entire update is cancelled
- Scan result stored in main process — renderer cannot inject arbitrary file paths

**Tracked files:** `dist/`, `electron/`, `src/`, `public/`, `scripts/`, `index.html`, `package.json`, `vite.config.js`, `eslint.config.js`

**States:** idle, checking, up-to-date, changes-found, downloading, applying, complete, error

**IPC Handlers (electron/main.js):**
- `updater:scan-changes` — compares local vs GitHub tree, returns categorized diff
- `updater:create-backup` — opens folder dialog, copies tracked files to backup
- `updater:apply-update` — downloads from GitHub raw, verifies SHAs, stages then copies
- `updater:restart-app` — relaunches the Electron app
- `updater:open-external` — safely opens GitHub URLs in browser

**Bridge (electron/preload.js):** `scanChanges`, `createBackup`, `applyUpdate`, `restartApp`, `openExternal`, `getVersion`, `onUpdateStatus`

## Deployment
Configured as a static site:
- Build: `npm run build`
- Output directory: `dist`

## GitHub Repositories
- Web: `khalilkorichi/miftah-store-management`
- Desktop: `khalilkorichi/miftah-store-management-desktop`
