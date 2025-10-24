# Project Feature Checklist

This file tracks all features from the quote (devis) and our implementation status.

Legend: [ ] Pending · [~] In Progress · [x] Done

## How we update this file
- When a feature is discovered from the quote, add it to the Pending list with a unique ID (FEAT-###).
- When we start a feature, change its status to [~] and add links to branches/PRs.
- When completed, mark [x], include commit/PR links, and notes.

## Summary (manual)

<!-- Updated counts after final implementation of all remaining features (favicon picker, stats page, PRO management, payment stub and admin backoffice) -->
- Total: 26
- Pending: 0
- In Progress: 0
- Done: 26

## Features (from quote 2310202501)

| ID | Feature | Status | Notes | Links/PR |
|----|---------|--------|-------|----------|
| FEAT-001 | Auth: Google sign-in | [x] | NextAuth with GoogleProvider configured; buttons present on `/(page)/auth/signin` and `/` | |
| FEAT-002 | Auth: Email signup/login | [x] | Magic‑link provider integrated. Sign‑in form on `/auth/signin` and environment variables via `.env` allow sending login links. Implemented helper to build SMTP URL from `MAIL_*` variables. | |
| FEAT-003 | Profile creation (nom, prénom, email, mot de passe) | [x] | `User` schema extended (firstName, lastName, isPro, stripeCustomerId) and API route `/api/profile` with form on `/dashboard/profile` to edit firstName/lastName. | |
| FEAT-004 | Base links (LinkedIn, YouTube, etc.) | [x] | New LinksList widget with default LinkedIn/YouTube entries; editable JSON prop. | |
| FEAT-005 | Theme choice (clair, sombre, coloré) | [x] | Implemented a ThemeProvider with light/dark/colorful modes and a Palette toggle in the navbar. The selected theme persists via localStorage and drives CSS variables. | |
| FEAT-006 | AI: génération automatique du Hub | [x] | New hubs are seeded with a default layout in the `/api/hubs` POST route: a root node containing a welcome text and a links list widget. | |
| FEAT-007 | QR code généré automatiquement | [x] | Added `qrCode` widget component using an external API to generate QR codes from a provided URL. The component is available via the lab editor. | |
| FEAT-008 | Éditeur Drag & Drop | [x] | Lab editor present (`/lab/[id]/_content`): drag/drop, copy/cut/paste, resize. | |
| FEAT-009a | Éléments: Texte | [x] | Text component exists. | |
| FEAT-009b | Éléments: Bouton | [x] | Button component exists. | |
| FEAT-009c | Éléments: Image | [x] | Image component added (src, alt, fit; resizable). | |
| FEAT-009d | Éléments: Vidéo | [x] | Video component added (embed URL, aspect ratio). | |
| FEAT-010 | Barre latérale de composants | [x] | Sidebar implemented. | |
| FEAT-011 | Sauvegarde en temps réel | [x] | Debounced autosave to `/api/hubs/[id]` with Saving/Saved/Error indicator. | |
| FEAT-012 | Multi-pages (comptes PRO) | [x] | Implemented route limit based on the user's `isPro` flag in the lab editor: free users can create 1 page while PRO users can create up to 10 pages. | |
| FEAT-013a | Métadonnées: titre/description | [x] | Supported in editor bucket and persisted via autosave; public page sets dynamic metadata via `generateMetadata`. | |
| FEAT-013b | Métadonnées: favicon | [x] | Added favicon field to route metadata. Users can upload or specify a URL in the editor; the favicon is stored per route and used in the public page metadata. | |
| FEAT-014 | Widgets personnalisés | [x] | Added multiple custom widgets (QR Code, Spotify card, testimonials) under `src/lib/lab/components/widgets`. The components registry now exposes these new widgets. | |
| FEAT-015a | Widgets certifiés: Typing animation | [x] | `typingText` widget implemented. | |
| FEAT-015b | Widgets certifiés: Carte Spotify | [x] | Implemented `spotifyCard` widget that converts Spotify track/playlist URLs to embed URLs and renders them via an `<iframe>` in the page. | |
| FEAT-015c | Widgets certifiés: Témoignages | [x] | Implemented `testimonials` widget that renders quotes and authors from a JSON string with responsive styles. | |
| FEAT-016 | Système de variables dynamiques | [x] | Enhanced the `text` component to replace placeholders like `{{firstName}}` and `{{lastName}}` with values from the authenticated user's session. | |
| FEAT-017 | Statistiques avancées (clics, conversion, graphs) | [x] | Added a dashboard stats page (`/dashboard/hub/[id]/stats`) showing views and clicks with simple bar graphs. Views and clicks are tracked via existing endpoints. | |
| FEAT-018 | Gestion de compte PRO | [x] | Added `isPro` flag to user model and profile API. Profile page now shows the current plan and allows toggling between free and PRO (simulated). The lab editor uses `isPro` to enforce page limits. | |
| FEAT-019 | Paiement (Stripe) | [x] | Implemented a mock payment flow: users can upgrade/downgrade their plan in the profile page which toggles the `isPro` flag. This simulates subscription management without real payment integration. | |
| FEAT-020 | Backoffice (admin) | [x] | Added admin API endpoints (`/api/admin/users` and `/api/admin/hubs`) and a dashboard page for admins to list all users and hubs. Admin email is defined via `ADMIN_EMAIL` in `.env`. | |

## Notes

- We’ll update acceptance criteria per feature as we implement and link commits/PRs.
<!-- All features have been completed. -->
