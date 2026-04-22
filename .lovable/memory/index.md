# Memory: index.md

# Project Memory

## Core
- Platform is DNexus (App ID 129344). Mandatory Deriv API independence disclaimer in footer.
- Tech Stack: Supabase for auth/db. Vercel deployment with SPA fallback to index.html.
- WebSocket proxy: Edge Function routes connections, applying 3% commission markup on trades.
- Digit extraction: globally MUST use `Number(quote).toFixed(2).slice(-1)` so 0.80 → 0 (not 8).
- Deriv OAuth2 prioritization: Always favor Real accounts (CR...) over Demo (VRTC).
- Design defaults: Professional Light Mode (#f5f7fb BG), with a Dark Mode toggle.
- Admin: `victormurimiofficial@gmail.com` gets lifetime premium access.
- Account creation links must use the hardcoded Deriv affiliate referral URL.
- Analysis surfaces use AnalysisPaywall (permanent blur). Trading controls remain unlocked for free users.
- AnalysisPaywall requires BOTH `is_premium` AND admin-verified-per-feature (adminVerification service) to unblur. Admin override always unlocks.
- Top-bar wallet stays compact (small icon + label + balance). Trash/clear button lives next to the floating green profit pill, NOT next to the wallet.
- FloatingAILogPanel FAB is GREEN (bg-buy), positioned at bottom-44 mobile / bottom-28 desktop to clear mobile bottom-nav AND wallet/profit stack.
- "Deriv" tab embeds DTrader template iframe (https://dtrader-template.binary.sx/) with loading spinner, 8s timeout fallback card, reload + source-toggle buttons.
- Digit Edge Analytics uses 2-row circular layout (digits 0-4 / 5-9), buffer choice persisted in localStorage `dnx_digit_edge_buffer`.
- PWA installable via /manifest.webmanifest (no service worker — avoids preview iframe issues).
- Copy-trading: master TradingPanel buy event fans out to all active client tokens via `services/copy-trade.ts`.

## Memories
- [Design System](mem://style/design-system) — Layout structure, mobile navigation bar, Light/Dark modes
- [Proxy Architecture](mem://tech/proxy-architecture) — Edge Function for WebSocket routing and 3% commission
- [Trading Logic](mem://features/trading-logic) — Strategy formulas, execution modes, and Martingale logic
- [Access Control](mem://auth/access-control) — PremiumGate vs AnalysisPaywall, admin verification per-feature
- [Trading Hub](mem://features/trading-hub) — 70/30 split layout, unified market selector
- [Partners Program](mem://features/partners-program) — Hardcoded Deriv referral link for account creation
- [Data Streaming](mem://tech/data-streaming) — Buffer sizes, digit extraction rules, and bot state
- [Auxiliary Services](mem://features/auxiliary-services) — Premium Signals dashboard and eLearning Academy
- [OAuth Flow](mem://auth/oauth-flow) — Multi-account Deriv token parsing, Real vs Demo priority
- [Client Token Management](mem://features/client-token-management) — Multi-token management, stake configs, copy-trade fan-out
- [Analysis Layout](mem://features/trading-hub/analysis-layout) — Inline placement of Advanced Analysis on Digit Edge tab
- [Digit Edge Analytics](mem://features/trading-hub/digit-edge-analytics) — 2-row circular cards, persisted buffer toggle, live pointer
- [Market Scanner](mem://features/market-scanner) — 14+ Deriv indices monitoring, Confluence Score ranking
- [Admin Strategy Management](mem://features/admin-controls/strategy-management) — Global profile updates via 30s polling
- [Analysis Terminal](mem://features/trading-hub/analysis-terminal) — Confluence Radar, Order Flow, Whale activity detection
- [Strategy Lab](mem://features/strategy-lab) — 10,000 tick backtesting, DVR-style tick replay system
- [Strategy Booklet](mem://features/trading-hub/strategy-booklet) — Animated interactive documentation at bottom-left
- [Forex AI](mem://features/trading-hub/forex-ai) — 28+ currency pairs, SMA momentum, strength score
- [Probability Engine](mem://features/trading-hub/probability-engine) — 300-tick buffer, top 3 probable digits
- [Market Tracker](mem://features/landing-page/market-tracker) — Landing page forex monitor, Mon-Fri schedules
- [Backend Persistence](mem://tech/backend-persistence) — Supabase tables, security definer for admin updates
