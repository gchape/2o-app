# Bank-transfer checkout

Delivery is to U.S. addresses only. Shipping is free when the USD merchandise subtotal is **at least $99**, before the service fee. A forwarding address is supported; onward shipment to Georgia is not provided by 2o.

The customer signs in, chooses a saved U.S. address, reviews a server-created quote, copies the bank details/reference, transfers the exact amount, uploads a PNG/JPEG/WebP receipt (maximum 2 MB), and places the order. The submit button enables only after the server stores the receipt. Orders enter `pending`, meaning **payment awaiting verification**, never automatically `paid`.

## Deployment settings

Add these to the server's environment (`.env.development` locally, `.env.production` in production). They are not Vite/public environment variables. All values must be set before checkout accepts a new payment. No fee, shipping cost, bank account, or exchange rate is guessed.

| Variable                      | Meaning                                                                                                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CHECKOUT_IBAN`               | Receiving IBAN, including its country prefix and valid checksum. Confirm the account can receive the chosen currency.                                            |
| `CHECKOUT_BENEFICIARY`        | Account holder's bank-registered name.                                                                                                                           |
| `CHECKOUT_PAYMENT_CURRENCY`   | `USD` or `GEL`: the currency the customer must actually transfer.                                                                                                |
| `CHECKOUT_GEL_PER_USD`        | Merchant's quoted rate: GEL for one USD (decimal string). Use the rate that covers the actual conversion cost.                                                   |
| `CHECKOUT_RATE_UPDATED_AT`    | ISO timestamp for that rate, e.g. `2026-10-26T08:00:00Z`. Rates older than seven days disable creation of new quotes. Refresh at least weekly, preferably daily. |
| `CHECKOUT_SERVICE_FEE_BPS`    | Service fee in basis points: `500` means 5%; `0` means no fee. Applied to merchandise only, not shipping. Owner must choose the actual fee.                      |
| `CHECKOUT_SHIPPING_USD_CENTS` | Shipping below $99, in USD cents. Owner must supply the actual charge.                                                                                           |
| `TELEGRAM_BOT_TOKEN`          | Bot token; keep secret.                                                                                                                                          |
| `TELEGRAM_CHAT_ID`            | The team's private chat/group ID. The bot must have permission to post there.                                                                                    |

The exchange rate is explicitly configured, not fetched live. NBG rates are indicative and may differ from a bank's rate. The UI shows the quoted conversion rate and the exact transfer currency/amount.

All prices are integer minor units. GEL unit prices are converted and rounded to USD cents once, multiplied by quantity, then summed. This keeps item amounts and totals consistent. The fee is rounded once on the USD merchandise subtotal. Shipping is added last. A GEL transfer amount, when configured, is converted from the final USD total and rounded once.

The additional charge is a **service fee**, not a tax. No sales-tax engine or tax collection rules are implemented.

## Database and worker

1. Deploy the generated Drizzle migration using the existing `pnpm db:migrate` deployment flow. The migration adds private checkout sessions, a notification queue, and order snapshot fields; it does not delete existing orders.
2. Set the payment/Telegram environment values above.
3. Run the application and `pnpm checkout:notifications`. Both development and production Compose include a `checkout-notifications` service that starts after migrations. Outside Compose, run the worker in a separate terminal with the same environment/database as the app.
4. Verify with a controlled test order and a real bank-transfer confirmation before accepting public orders.

Telegram delivery runs in the worker, normally within five seconds of submission. Every message contains the order ID, customer name/email, UTC order time, U.S. address, items/quantities/SKUs, converted item prices, service fee, shipping, total and transfer amount. The receipt is attached separately. Long orders are split into messages under Telegram's limit, with customer content HTML-escaped.

Order rows, item snapshots and the notification job commit together. Retries with the same checkout ID return the same order. The worker retries failures with backoff and keeps progress per message; delivery is at least once, so a crash immediately after Telegram accepts a message may produce a duplicate notification. Use the order ID to identify it. Inspect `order_notification.sent_at`, `attempts`, and `next_attempt_at` for delivery status.

Payment instructions last 24 hours and their rate/fees are immutable. After expiry, the UI hides the bank instructions and asks an unpaid customer to start a new checkout. Receipts and submissions are still accepted for expired quotes because the customer may already have transferred; the team must reconcile these manually. Receipts never prove payment by themselves.

Receipt files are stored as base64 in the private PostgreSQL `checkout_session` table, not under `public/` or a public URL. The browser only receives an uploaded/not-uploaded flag. Ownership is checked on every checkout read/write. MIME type, size and file signature are checked; these checks do not authenticate the payment or inspect the transaction. The worker forwards the original file to the configured private Telegram chat.

Old unsubmitted drafts **without** evidence are deleted after 30 days. Submitted orders and payment evidence are retained for reconciliation; choose a retention policy before production use. Protect database backups and restrict Telegram group membership accordingly.

Bank payment verification, fulfillment, refunds and marking an order `paid` remain manual operations. This feature does not add an admin dashboard. After verifying the deposit, an operator can update the existing order status using the project's authorized database administration workflow.
