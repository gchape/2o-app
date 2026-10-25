# Codebase review

Reviewed on 2026-10-26 against the installed dependencies and their current
maintainer documentation. Existing infrastructure edits were preserved.

## Architecture and stack

The feature folders, validated server-function inputs, request-scoped QueryClient,
Router/Query SSR integration, URL-based catalog state, and shared Base UI
components form a sound foundation. Keep these boundaries as features grow:
- Routes own navigation, search parameters, loaders, and page metadata.
- Feature query/mutation factories own cache keys and synchronization.
- Server functions validate input and enforce access; `.server.ts` modules own
  database, Redis, and authentication operations.
- Shared components own visual tokens and accessible interactions. Product copy
  remains in the English/Georgian translation catalogs.

The installed Start version uses `.validator()`, and Query uses `.query()` and
`.infiniteQuery()`. These are current APIs, despite older examples recommending
different names. The installed devtools plugin explicitly supports Vite 8;
the bundled skill's Vite 6/7 limitation is stale. Drizzle already uses relations
v2 and Better Auth's matching adapter.

References: [Start migration guide](https://tanstack.com/start/latest/docs/framework/react/migrate-from-release-candidate),
[QueryClient](https://tanstack.com/query/latest/docs/framework/react/reference/classes/QueryClient).

## Changes made

| Area              | Finding and correction                                                                                                                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deprecated APIs   | Replaced React's deprecated `FormEvent` with `SubmitEvent`. Added `pnpm check:deprecations`, using the installed TypeScript compiler's suggestion diagnostics.                                                               |
| Test architecture | Unit tests inherited Start/Nitro RPC transforms and bypassed mocks, failing five locale tests. A dedicated `vitest.config.ts` keeps these tests independent of application server transforms.                                |
| CI                | Added compiler deprecation checks and production builds. Updated checkout/setup-node to v7 and pnpm/action-setup to v6, using their Node 24 action runtimes while keeping application Node 26 and pinned pnpm.               |
| Navigation        | Added Deals to desktop/mobile navigation and the footer, active route styling, and mobile category shortcuts. The desktop menu appears only when the translated labels fit.                                                  |
| Responsive layout | Split mobile result counts from filter/sort controls, removed fixed mobile sort widths, and fixed clipped Georgian homepage buttons at 320px.                                                                                |
| Images            | Added localized missing/broken-image placeholders, deferred offscreen catalog images, asynchronous decoding, and high-priority loading for product detail images.                                                            |
| Product pages     | Kept the product image visible while scrolling desktop options; reset price-slider drafts when facet bounds change.                                                                                                          |
| Accessibility     | Added a semantic search landmark, product list semantics, visible link focus, readable link colors on light surfaces, larger cart quantity targets, and cart status announcements.                                           |
| Cart consistency  | Shared a mutation scope across add/quantity actions, cancelled stale reads, applied confirmed quantity changes, and refreshed after the final queued write. Failed writes no longer restore an obsolete whole-cart snapshot. |
| Cart layout       | Made the mobile drawer use the available width, allowed long names/prices to wrap, and kept line items independently scrollable.                                                                                             |
| Empty catalog     | The homepage CTA links to Deals when the deals section is absent.                                                                                                                                                            |

References: [Vitest configuration](https://vitest.dev/config/),
[mutation scopes](https://tanstack.com/query/latest/docs/framework/react/guides/mutations#mutation-scopes),
[WCAG reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html),
[checkout](https://github.com/actions/checkout),
[setup-node](https://github.com/actions/setup-node),
[pnpm/action-setup](https://github.com/pnpm/action-setup).

## Verification

- `pnpm verify`: formatting, TypeScript, and 143 tests across 30 files pass.
- `pnpm check:deprecations`: no deprecated TypeScript APIs in project source.
  An intentionally deprecated temporary fixture was also rejected with exit 1,
  then removed. This detects compiler-marked APIs, not every possible behavioral
  deprecation or transitive dependency warning.
- `pnpm knip`: no unused-code findings.
- `pnpm build`: production client/server build succeeds. Dependencies still emit
  bundler warnings about module-level `use client` directives; these are distinct
  from deprecated application APIs.
- Chromium review of real components with isolated sample data: Georgian home at
  320/768/1440px, Georgian catalog at 320/390px, English catalog at 768px,
  Georgian product at 390px, and Georgian sign-in at 320px.
- Browser interactions: menu opens, Escape restores trigger focus, category links
  appear, active department styling survives category navigation, cart controls
  disable while updating and totals refresh, filters expand, empty search appears,
  and clearing search restores products. No JavaScript exceptions in these checks.

The sample-data preview does not replace live PostgreSQL/Redis/authentication
integration tests. No database services were running during this review. The
GitHub-hosted workflow changes also require their first CI run after push.

## Remaining production work

1. **Checkout is explicitly a placeholder.** Ordering, payments, shipping/tax
   calculation, and order confirmation are not implemented. Existing delivery
   promises should be checked against the eventual fulfillment service before
   accepting orders.
2. **Cart server constraints need atomic enforcement across clients.**
   `cart.server.ts` checks currency and line limits before its Redis write, and
   quantity changes check existence before setting. Two tabs or devices can race
   these checks. The shared client mutation scope fixes in-app ordering, but does
   not make separate HTTP clients transactional. Use a Redis script or isolated
   WATCH/MULTI transaction and test concurrent requests against Redis before launch.
3. **Add service-backed end-to-end coverage.** Exercise direct server-function
   authorization, email verification/password reset, address ownership, reload
   persistence, and unavailable catalog services against isolated test services.
4. **Track prerelease infrastructure deliberately.** Drizzle 1.0 RC and Nitro 3
   beta are pinned. Update them with migration/build/integration checks, rather
   than assuming a newer package is a safe drop-in replacement.

The existing charcoal/yellow palette, type scale, spacing tokens, department
tiles, deal carousel, filters, and product options provide a coherent storefront.
Further visual expansion should follow real product data and completed shopping
flows; this review does not certify full WCAG conformance or production readiness.
