# Bank-transfer checkout

Delivery is to U.S. addresses only. Shipping is free when the USD merchandise subtotal is **at least $99**, before the service fee. A forwarding address is supported; onward shipment to Georgia is not provided by 2o.

The customer signs in, chooses a saved U.S. address, reviews a server-created quote, copies the bank details/reference, transfers the total in **either USD or lari**, uploads a PNG/JPEG/WebP receipt (maximum 2 MB), and places the order. The quote shows the USD total prominently and the same total in lari in smaller type; the customer pays one of them, in its own currency. The submit button enables only after the server stores the receipt. Orders enter `pending`, meaning **payment awaiting verification**, never automatically `paid`.

## Deployment settings

Add these to the server's environment (`.env.development` locally, `.env.production` in production). They are not Vite/public environment variables. All values must be set before checkout accepts a new payment. No fee, shipping cost or bank account is guessed.

| Variable                      | Meaning                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `CHECKOUT_IBAN`               | Receiving IBAN, including its country prefix and valid checksum. Confirm the account can receive both USD and GEL transfers.                |
| `CHECKOUT_SERVICE_FEE_BPS`    | Service fee in basis points: `500` means 5%; `0` means no fee. Applied to merchandise only, not shipping. Owner must choose the actual fee. |
| `CHECKOUT_SHIPPING_USD_CENTS` | Shipping below $99, in USD cents. Owner must supply the actual charge.                                                                      |
| `TELEGRAM_BOT_TOKEN`          | Bot token; keep secret.                                                                                                                     |
| `TELEGRAM_CHAT_ID`            | The team's private chat/group ID. The bot must have permission to post there.                                                               |

There is no exchange-rate, beneficiary or payment-currency variable. `CHECKOUT_BENEFICIARY`, `CHECKOUT_PAYMENT_CURRENCY`, `CHECKOUT_GEL_PER_USD` and `CHECKOUT_RATE_UPDATED_AT` from earlier versions are ignored and can be deleted from the env files.

## Exchange rate

New quotes use the National Bank of Georgia's [public USD rate feed](https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/?currencies=USD). No API key or manual rate configuration is required.
- The feed supplies a published rate and its effective date (`validFromDate`). Checkout uses that published rate without a margin; it does not query a live market price. Bank conversion rates may differ.
- The rate is cached in Redis for 15 minutes, so checkout does not call NBG on every page view. Redis being down only means each request asks NBG directly.
- Both cached and fetched rates must be positive, have an ISO timestamp, and be no more than seven days old or one day ahead. The past window allows holiday carryover; the future window allows a next-day publication. Invalid cache entries trigger a fresh fetch.
- If a valid rate cannot be read from cache or fetched, new checkouts are unavailable. Reopening or retrying an existing checkout does not contact NBG; its saved quote remains authoritative.
- The rate is **not shown to customers**. It is stored in the quote (`pricing.gelPerUsd`, `pricing.rateDate`) and included in the Telegram message so the team can reconcile a lari payment.
- The server needs outbound HTTPS to `nbg.gov.ge`.

All prices are integer minor units. Currency conversion uses `decimal.js` with explicit half-up rounding, avoiding binary floating-point errors at half-cent boundaries. GEL unit prices are converted and rounded to USD cents once, multiplied by quantity, then summed. This keeps item amounts and totals consistent. The fee is rounded once on the USD merchandise subtotal. Shipping is added last. The lari total is converted from the final USD total and rounded once. The UI shows the USD total and the lari total, never the rate.

The additional charge is a **service fee**, not a tax. No sales-tax engine or tax collection rules are implemented.

## Database and worker

1. Deploy the generated Drizzle migration using the existing `pnpm db:migrate` deployment flow. The migration adds private checkout sessions, a notification queue, and order snapshot fields; it does not delete existing orders. The quote is stored as JSON, so this change needs no new migration.
2. Set the payment/Telegram environment values above.
3. Run the application and `pnpm checkout:notifications`. Both development and production Compose include a `checkout-notifications` service that starts after migrations. Outside Compose, run the worker in a separate terminal with the same environment/database as the app.
4. Verify with a controlled test order and a real bank-transfer confirmation (in both USD and lari if you accept both) before accepting public orders.

Older JSON snapshots remain readable. `restoreCheckoutQuote` maps `rateUpdatedAt` to `rateDate`, preserves an explicitly quoted GEL `paymentTotal`, and derives the GEL equivalent of a USD quote from its original stored rate. Reads, submission, and queued notifications share this adapter. It never fetches a new rate or changes the stored USD total; no data deletion or migration is needed.

Telegram delivery runs in the worker, normally within five seconds of submission. Every message contains the order ID, customer name/email, UTC order time, U.S. address, items/quantities/SKUs, converted item prices, service fee, shipping, the USD total, the equivalent lari total, and the NBG rate and rate date used. The receipt is attached separately. Long orders are split into messages under Telegram's limit, with customer content HTML-escaped.

Order rows, item snapshots and the notification job commit together. Retries with the same checkout ID return the same order. The worker retries failures with backoff and keeps progress per message; delivery is at least once, so a crash immediately after Telegram accepts a message may produce a duplicate notification. Use the order ID to identify it. Inspect `order_notification.sent_at`, `attempts`, and `next_attempt_at` for delivery status.

Payment instructions last 24 hours and their rate/fees are immutable. The lari amount is fixed for that period even if NBG publishes a new rate. After expiry, the UI hides the bank instructions and asks an unpaid customer to start a new checkout. Receipts and submissions are still accepted for expired quotes because the customer may already have transferred; the team must reconcile these manually. Receipts never prove payment by themselves.

Receipt files are stored as base64 in the private PostgreSQL `checkout_session` table, not under `public/` or a public URL. The browser only receives an uploaded/not-uploaded flag. Ownership is checked on every checkout read/write. MIME type, size and file signature are checked; these checks do not authenticate the payment or inspect the transaction. The worker forwards the original file to the configured private Telegram chat.

Old unsubmitted drafts **without** evidence are deleted after 30 days. Submitted orders and payment evidence are retained for reconciliation; choose a retention policy before production use. Protect database backups and restrict Telegram group membership accordingly.

Bank payment verification, fulfillment, refunds and marking an order `paid` remain manual operations. This feature does not add an admin dashboard. After verifying the deposit (in USD or lari), an operator can update the existing order status using the project's authorized database administration workflow.

## Code boundaries

- `checkout.ts` contains shared types, validation, and limits. `checkout-quote.server.ts` owns money arithmetic and snapshot compatibility, keeping decimal arithmetic out of browser bundles. Amounts are integer cents/tetri; `gelPerUsd` is the exception, expressed as GEL per USD.
- `exchange-rate.server.ts` validates the upstream feed and cached values. `checkout-config.server.ts` combines that rate with merchant settings.
- `checkout.server.ts` owns authorization-scoped storage and transactional order creation. Rate requests happen before row locks; retries recheck for an existing snapshot inside the transaction.
- `checkout.functions.ts` validates RPC inputs and returns private, uncached responses. Existing checkout loads bypass rate availability checks.
- `use-checkout.ts` coordinates mutations and retry IDs with TanStack Query. The page composes address, bank-transfer, receipt, and summary components; shared address and item views avoid divergent markup.

Keep documentation comments at behavior boundaries: money units and rounding, idempotency, lock ordering, expiry exceptions, and notification delivery guarantees. Avoid narrating types or obvious JSX. Customer copy should explain payment choices and next steps; rounding implementation belongs here.
