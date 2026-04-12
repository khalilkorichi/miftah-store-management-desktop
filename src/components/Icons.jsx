/**
 * SVG Icon Library — Lucide-inspired icons for Miftah Store.
 * Replaces emoji icons for professional UI per UI/UX Pro Max guidelines.
 * All icons: 24x24 viewBox, 2px stroke, currentColor.
 */

const d = 'none';
const s = 'currentColor';
const w = 2;
const base = { width: '1em', height: '1em', viewBox: '0 0 24 24', fill: d, stroke: s, strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round' };

const I = (paths, props = {}) => (
  <svg {...base} {...props} className={`icon ${props.className || ''}`} aria-hidden="true">
    {paths}
  </svg>
);

// ── Navigation / Tabs ──
export const PackageIcon = (p) => I(<><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>, p);

export const DollarSignIcon = (p) => I(<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>, p);

export const GiftIcon = (p) => I(<><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></>, p);

export const BarChartIcon = (p) => I(<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>, p);

export const SettingsIcon = (p) => I(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>, p);

// ── Actions ──
export const PlusIcon = (p) => I(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>, p);

export const PlusCircleIcon = (p) => I(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></>, p);

export const TrashIcon = (p) => I(<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></>, p);

export const EditIcon = (p) => I(<><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>, p);

export const SearchIcon = (p) => I(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>, p);

export const XIcon = (p) => I(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>, p);

export const DownloadIcon = (p) => I(<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>, p);

export const UploadIcon = (p) => I(<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>, p);

export const RefreshIcon = (p) => I(<><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></>, p);

// ── Data / Reports ──
export const ClipboardIcon = (p) => I(<><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></>, p);

export const BuildingIcon = (p) => I(<><path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18"/><path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2"/><path d="M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2"/><rect x="10" y="6" width="4" height="4"/><rect x="10" y="14" width="4" height="4"/></>, p);

export const TrendingUpIcon = (p) => I(<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>, p);

export const TrendingDownIcon = (p) => I(<><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>, p);

export const ScaleIcon = (p) => I(<><path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></>, p);

export const AwardIcon = (p) => I(<><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>, p);

export const StarIcon = (p) => I(<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>, p);

export const CalculatorIcon = (p) => I(<><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="18" x2="12" y2="18"/><line x1="8" y1="18" x2="8" y2="18"/></>, p);

export const DiamondIcon = (p) => I(<><path d="M6 3h12l4 6-10 12L2 9l4-6z"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="12" y1="21" x2="16" y2="9"/><line x1="12" y1="21" x2="8" y2="9"/><line x1="6" y1="3" x2="8" y2="9"/><line x1="18" y1="3" x2="16" y2="9"/></>, p);

export const LightbulbIcon = (p) => I(<><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A6 6 0 107.5 11.5c.76.76 1.23 1.52 1.41 2.5"/></>, p);

// ── Status ──
export const CheckCircleIcon = (p) => I(<><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>, p);

export const CheckIcon = (p) => I(<><polyline points="20 6 9 17 4 12"/></>, p);

export const XCircleIcon = (p) => I(<><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>, p);

export const InfoIcon = (p) => I(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>, p);

export const AlertTriangleIcon = (p) => I(<><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>, p);

// ── Communication ──
export const MessageCircleIcon = (p) => I(<><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></>, p);

export const SendIcon = (p) => I(<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>, p);

export const ShoppingCartIcon = (p) => I(<><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></>, p);

// ── UI Elements ──
export const ChevronDownIcon = (p) => I(<><polyline points="6 9 12 15 18 9"/></>, p);

export const ChevronLeftIcon = (p) => I(<><polyline points="15 18 9 12 15 6"/></>, p);

export const EyeIcon = (p) => I(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>, p);

export const TagIcon = (p) => I(<><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>, p);

export const SunIcon = (p) => I(<><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>, p);

export const MoonIcon = (p) => I(<><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></>, p);

export const PaletteIcon = (p) => I(<><circle cx="13.5" cy="6.5" r="2"/><circle cx="17.5" cy="10.5" r="2"/><circle cx="8.5" cy="7.5" r="2"/><circle cx="6.5" cy="12" r="2"/><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c.93 0 1.68-.75 1.68-1.68 0-.44-.17-.84-.44-1.15-.27-.31-.44-.71-.44-1.17 0-.93.75-1.68 1.68-1.68H16c3.31 0 6-2.69 6-6 0-5.17-4.49-9.32-10-9.32z"/></>, p);

export const DatabaseIcon = (p) => I(<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>, p);

export const ClockIcon = (p) => I(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>, p);

export const CalendarIcon = (p) => I(<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>, p);

export const ZapIcon = (p) => I(<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>, p);

export const GlobeIcon = (p) => I(<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>, p);

export const KeyIcon = (p) => I(<><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>, p);

export const UsersIcon = (p) => I(<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>, p);

export const UserIcon = (p) => I(<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>, p);

export const BookmarkIcon = (p) => I(<><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></>, p);

export const LinkIcon = (p) => I(<><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>, p);

export const ExternalLinkIcon = (p) => I(<><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>, p);

export const PinIcon = (p) => I(<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>, p);

export const SaveIcon = (p) => I(<><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>, p);

export const LockIcon = (p) => I(<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>, p);

export const TargetIcon = (p) => I(<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>, p);

export const CurrencyIcon = (p) => I(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="18"/><path d="M15.5 9.5H10a2 2 0 000 4h4a2 2 0 010 4H8"/></>, p);

export const FileTextIcon = (p) => I(<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>, p);

export const CopyIcon = (p) => I(<><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>, p);

export const HomeIcon = (p) => I(<><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>, p);

export const ArrowLeftIcon = (p) => I(<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>, p);

export const LayersIcon = (p) => I(<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>, p);

export const ActivityIcon = (p) => I(<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>, p);

export const PercentIcon = (p) => I(<><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></>, p);

export const ShieldCheckIcon = (p) => I(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></>, p);

export const ImageIcon = (p) => I(<><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>, p);

export const ListIcon = (p) => I(<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>, p);

export const BoldIcon = (p) => I(<><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></>, p);

export const ItalicIcon = (p) => I(<><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></>, p);

export const TypeIcon = (p) => I(<><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></>, p);

export const ChevronUpIcon = (p) => I(<><polyline points="18 15 12 9 6 15"/></>, p);

export const ArrowUpIcon = (p) => I(<><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>, p);

export const ArrowDownIcon = (p) => I(<><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>, p);

export const MinusIcon = (p) => I(<><line x1="5" y1="12" x2="19" y2="12"/></>, p);

export const UnderlineIcon = (p) => I(<><path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></>, p);

export const AlignRightIcon = (p) => I(<><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></>, p);

export const AlignCenterIcon = (p) => I(<><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></>, p);

export const AlignLeftIcon = (p) => I(<><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></>, p);

export const AlignJustifyIcon = (p) => I(<><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></>, p);

export const EraserIcon = (p) => I(<><path d="M20 20H7L3 16l10-10 7 7-3.5 3.5"/><path d="M6.5 17.5l4-4"/></>, p);

export const UndoIcon = (p) => I(<><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></>, p);

export const RedoIcon = (p) => I(<><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"/></>, p);

export const FilterIcon = (p) => I(<><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>, p);

export const GitBranchIcon = (p) => I(<><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></>, p);

export const SortIcon = (p) => I(<><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></>, p);

export const CheckSquareIcon = (p) => I(<><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></>, p);
export const BookOpenIcon = (p) => I(<><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></>, p);
export const GripIcon = (p) => I(<><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></>, p);
export const FlagIcon = (p) => I(<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>, p);
export const InboxIcon = (p) => I(<><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></>, p);
export const SparklesIcon = (p) => I(<><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75z"/><path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z"/></>, p);
export const GridIcon = (p) => I(<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>, p);

export const DownloadCloudIcon = (p) => I(<><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"/></>, p);

export const BellIcon = (p) => I(<><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>, p);

export const CheckAllIcon = (p) => I(<><polyline points="1 11 5 15 12 6"/><polyline points="7 11 11 15 20 4"/></>, p);

export const Trash2Icon = (p) => I(<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></>, p);

export const VolumeIcon = (p) => I(<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/></>, p);

export const CodeBracketIcon = (p) => I(<><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>, p);

export const HardDriveIcon = (p) => I(<><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></>, p);

export const PieChartIcon = (p) => I(<><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></>, p);
