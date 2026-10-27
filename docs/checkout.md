# Bank-transfer checkout

Delivery is to U.S. addresses, including forwarding addresses. Shipping is calculated **separately for each warehouse**, then added to one checkout total. Each warehouse has an explicit flat rate and an optional free-shipping threshold; only that warehouse’s merchandise counts toward its threshold.

The customer signs in, chooses a saved U.S. address, reviews a server-created quote, copies the bank details/reference, transfers the total in **either USD or lari**, selects **Upload payment proof**, uploads a PNG/JPEG/WebP receipt (maximum 2 MB), and places the order. The quote shows the USD total prominently and the same total in lari in smaller type; the customer pays one of them, in its own currency. The submit button enables only after the server stores the receipt. Orders enter `pending`, meaning **payment awaiting verification**, never automatically `paid`.

## Deployment settings

Add these to the server's environment (`.env.development` locally, `.env.production` in production). They are not Vite/public environment variables. All values must be set before checkout accepts a new payment. No fee, shipping cost or bank account is guessed.

| Variable                   | Meaning                                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `CHECKOUT_IBAN`            | Receiving IBAN, including its country prefix and valid checksum. Confirm the account can receive both USD and GEL transfers.                |
| `CHECKOUT_SERVICE_FEE_BPS` | Service fee in basis points: `500` means 5%; `0` means no fee. Applied to merchandise only, not shipping. Owner must choose the actual fee. |
| `WAREHOUSE_SHIPPING_RULES` | JSON object keyed by exact catalog warehouse domain, with `flatRateUsd` and `freeFromUsd` in USD cents. See below.                          |
| `TELEGRAM_BOT_TOKEN`       | Bot token; keep secret.                                                                                                                     |
| `TELEGRAM_CHAT_ID`         | The team's private chat/group ID. The bot must have permission to post there.                                                               |

There is no exchange-rate, beneficiary or payment-currency variable. `CHECKOUT_BENEFICIARY`, `CHECKOUT_PAYMENT_CURRENCY`, `CHECKOUT_GEL_PER_USD` and `CHECKOUT_RATE_UPDATED_AT` from earlier versions are ignored and can be deleted from the env files.

## Warehouse shipping rules

Configure only warehouses whose shipping costs are predictable for the supported U.S. destinations and products. The current model supports one flat charge per warehouse, with an optional inclusive free-shipping threshold. It does not model weight, item surcharges, state/ZIP variations, memberships or coupon-dependent rates. Do not configure a warehouse as a uniform rate if those conditions change its actual cost.

Example `.env` entry (illustrative domains and rates, not production defaults):

```dotenv
WAREHOUSE_SHIPPING_RULES='{"warehouse-a.example":{"flatRateUsd":600,"freeFromUsd":5000},"warehouse-b.example":{"flatRateUsd":800,"freeFromUsd":7500},"warehouse-c.example":{"flatRateUsd":500,"freeFromUsd":null}}'
```

- Keys must match `product.warehouse` exactly: the host extracted from the product URL, with leading `www.` removed. Use lowercase bare domains, without a scheme or path. Subdomains are separate warehouses; there is no wildcard or parent-domain fallback.
- `flatRateUsd` is integer USD cents (0–100,000). Set it to `0` for always-free shipping.
- `freeFromUsd` is integer USD cents (0–2,000,000,000), or explicitly `null` when free shipping is not offered. Do not omit the field.
- Quantities and different SKUs from the same warehouse combine into one shipment. Fees and other warehouses’ items do not help reach its threshold.
- A $70 subtotal at A qualifies for free shipping; a $40 subtotal at B still costs $8 to ship. The combined $110 subtotal does not qualify B for free shipping.
- Missing or malformed configuration, or a cart warehouse without a matching rule, prevents a new quote. The cart identifies affected shipments; no bank instructions are created until all shipping costs are known.
- The old `CHECKOUT_SHIPPING_USD_CENTS` variable and global $99 threshold are retired. Replace the old variable with warehouse rules before accepting new orders. Recreate Compose app containers after changing environment values; a plain container restart keeps the old environment.

The cart and checkout group items as **Shipment 1**, **Shipment 2**, etc., with the same anonymous store code shown on product cards and pages, without displaying supplier domains. The cart’s **Shop more from this store** link opens all available products from that store and closes the drawer. Cart estimates show each shipment’s shipping and the amount still needed to qualify for free shipping. GEL cart estimates use the cached NBG rate and the same unit-rounding method as checkout; if the rate is unavailable, the cart remains usable but cannot show an estimate. Final prices are recalculated on the server before payment.

New quotes freeze each shipment’s item IDs, merchandise subtotal, shipping charge and policy in the existing JSON snapshot. Existing quotes without this breakdown keep their original totals and render the original combined shipping amount. Updating rules never reprices an existing checkout or submitted order. This change requires no database migration.

## Development preview with seeded products

The seed script uses four fictional warehouse domains. To preview their shipping costs, add the following sample rates to your local `.env.development`. Seeding does not configure shipping, and these rates are not committed defaults. Never copy these fictional rates into production.

| Seed warehouse     | Shipping charge | Free shipping threshold |
| ------------------ | --------------- | ----------------------- |
| `sportmax.example` | $6              | $50                     |
| `urbanfit.example` | $8              | $75                     |
| `kidzone.example`  | $5              | None                    |
| `shoebox.example`  | $0              | Always free             |

```dotenv
WAREHOUSE_SHIPPING_RULES='{"sportmax.example":{"flatRateUsd":600,"freeFromUsd":5000},"urbanfit.example":{"flatRateUsd":800,"freeFromUsd":7500},"kidzone.example":{"flatRateUsd":500,"freeFromUsd":null},"shoebox.example":{"flatRateUsd":0,"freeFromUsd":null}}'
```

Start the development stack using the [README quick start](../README.md#quick-start). If it is already running, recreate the app so it receives the updated environment:

```sh
docker compose --env-file .env.development -f docker-compose.dev.yaml up -d --no-deps --force-recreate app
```

If payment or Telegram settings also changed, recreate `checkout-notifications` with the same command. For a host-run dev server, stop it and start it with the updated environment. Refresh the browser, add seeded products to the cart, and adjust quantities to see shipping costs and progress toward each shipment’s free-shipping threshold. The cart labels groups as Shipment 1, Shipment 2, etc., alongside an anonymous store code. Use **Shop more from this store** to find more items from the same source without displaying its name.

Cart shipping previews do not require bank or Telegram settings. Seeded prices use GEL, so their USD shipping estimates need a valid NBG rate. Creating a new checkout additionally requires a valid IBAN, an explicit service fee, Telegram settings, and a U.S. address. Already saved quotes retain their old amounts; start a new checkout to see changed rules.

## Exchange rate

New quotes use the National Bank of Georgia's [public USD rate feed](https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/?currencies=USD). No API key or manual rate configuration is required.
- The feed supplies a published rate and its effective date (`validFromDate`). Checkout uses that published rate without a margin; it does not query a live market price. Bank conversion rates may differ.
- The rate is cached in Redis for 15 minutes, so checkout does not call NBG on every page view. If the rate cache is unavailable, rate retrieval falls back to NBG directly; this does not make the rest of checkout independent of Redis, which still stores the cart and auth state.
- Both cached and fetched rates must be positive, have an ISO timestamp, and be no more than seven days old or one day ahead. The past window allows holiday carryover; the future window allows a next-day publication. Invalid cache entries trigger a fresh fetch.
- If a valid rate cannot be read from cache or fetched, new checkouts are unavailable. Reopening or retrying an existing checkout does not contact NBG; its saved quote remains authoritative.
- The rate is **not shown to customers**. It is stored in the quote (`pricing.gelPerUsd`, `pricing.rateDate`) and included in the Telegram message so the team can reconcile a lari payment.
- The server needs outbound HTTPS to `nbg.gov.ge`.

All prices are integer minor units. Currency conversion uses `decimal.js` with explicit half-up rounding, avoiding binary floating-point errors at half-cent boundaries. GEL unit prices are converted and rounded to USD cents once, multiplied by quantity, then summed. This keeps item amounts and totals consistent. The fee is rounded once on the USD merchandise subtotal. Each warehouse’s shipping charge is calculated against its converted merchandise subtotal; the charges are summed and added last. The lari total is converted from the final USD total and rounded once. The UI shows the USD total and the lari total, never the rate.

The additional charge is a **service fee**, not a tax. No sales-tax engine or tax collection rules are implemented.

## Database and worker

1. Apply the repository’s migrations through the existing `pnpm db:migrate` deployment flow. The schema includes private checkout sessions, a notification queue, and order snapshots. Per-warehouse shipping uses those existing JSON snapshot columns and adds no migration.
2. Set the payment, Telegram, and warehouse shipping environment values above.
3. Run the application and `pnpm checkout:notifications`. Both development and production Compose include a `checkout-notifications` service that starts after migrations. Outside Compose, run the worker in a separate terminal with the same environment/database as the app.
4. Verify with a controlled test order and a real bank-transfer confirmation (in both USD and lari if you accept both) before accepting public orders.

Older JSON snapshots remain readable. `restoreCheckoutQuote` maps `rateUpdatedAt` to `rateDate`, preserves an explicitly quoted GEL `paymentTotal`, and derives the GEL equivalent of a USD quote from its original stored rate. Reads, submission, and queued notifications share this adapter. It never fetches a new rate or changes the stored USD total; no data deletion or migration is needed.

The worker polls for jobs every five seconds when idle; network calls, queued work and retries can delay delivery. Across the notification’s message chunks, it includes the order ID, customer name/email, UTC order time, U.S. address, items/quantities/SKUs, converted item prices, service fee, combined shipping, the USD total, the equivalent lari total, and the NBG rate and rate date used. New quotes also include each shipment’s item numbers and shipping policy/charge; legacy quotes retain their combined shipping breakdown. The receipt is attached separately. Long orders are split into messages under Telegram's limit, with customer content HTML-escaped.

Order rows, item snapshots and the notification job commit together. Retries with the same checkout ID return the same order. The worker retries failures with backoff and keeps progress per message; delivery is at least once, so a crash immediately after Telegram accepts a message may produce a duplicate notification. Use the order ID to identify it. Inspect `order_notification.sent_at`, `attempts`, and `next_attempt_at` for delivery status.

New checkout creation is limited to 10 drafts per account in a rolling 24-hour window. Reusing an existing checkout ID returns its saved quote without fetching a new rate.

Payment instructions last 24 hours and their rate, service fee and shipment charges are immutable. The lari amount is fixed for that period even if NBG publishes a new rate. After expiry, the UI hides the bank instructions and asks an unpaid customer to start a new checkout. Receipts and submissions are still accepted for expired quotes because the customer may already have transferred; the team must reconcile these manually. Receipts never prove payment by themselves.

Receipt files are stored as base64 in the private PostgreSQL `checkout_session` table, not under `public/` or a public URL. The browser only receives an uploaded/not-uploaded flag. Ownership is checked on every checkout read/write. MIME type, size and file signature are checked; these checks do not authenticate the payment or inspect the transaction. The worker forwards the original file to the configured private Telegram chat.

The worker checks for cleanup at startup and approximately daily. It deletes unsubmitted drafts **without** evidence once their expiry is more than 30 days old. Submitted orders and payment evidence are retained for reconciliation; choose a retention policy before production use. Protect database backups and restrict Telegram group membership accordingly.

Bank payment verification, fulfillment, refunds and marking an order `paid` remain manual operations. This feature does not add an admin dashboard. After verifying the deposit (in USD or lari), an operator can update the existing order status using the project's authorized database administration workflow.

## Code boundaries

- `checkout.ts` contains shared types, validation, and limits. `checkout-quote.server.ts` owns money arithmetic and snapshot compatibility, keeping decimal arithmetic out of browser bundles. Amounts are integer cents/tetri; `gelPerUsd` is the exception, expressed as GEL per USD.
- `src/features/shipping/` owns rule configuration, shipment grouping, shared USD conversion, and shipment summaries. Cart reads derive the warehouse from the catalog and attach the configured rule; checkout never accepts shipping rules or prices from client input.
- `exchange-rate.server.ts` validates the upstream feed and cached values. `checkout-config.server.ts` combines that rate with merchant settings.
- `checkout.server.ts` owns authorization-scoped storage and transactional order creation. Rate requests happen before row locks; retries recheck for an existing snapshot inside the transaction.
- `checkout.functions.ts` validates RPC inputs and returns private, uncached responses. Existing checkout loads bypass rate availability checks.
- `use-checkout.ts` coordinates mutations and retry IDs with TanStack Query. The page composes address, bank-transfer, receipt, and summary components; shared address and item views avoid divergent markup.

Keep documentation comments at behavior boundaries: money units and rounding, idempotency, lock ordering, expiry exceptions, and notification delivery guarantees. Avoid narrating types or obvious JSX. Customer copy should explain payment choices and next steps; rounding implementation belongs here.
