# Studio Lumina

Studio location

 Google Maps

 Social media links

 WhatsApp CTA

 Instagram CTA

Footer

Modern premium footer including:

 Logo

 Quick links

 Services

 Social media

 Copyright

Technical Requirements

 Fully responsive.

 Mobile-first optimization.

 Ultra-fast loading.

 SEO-friendly.

 Accessibility compliant.

 Clean, scalable component architecture.

Animation Requirements

Use premium animations throughout:

 GSAP

 Framer Motion

 Lenis Smooth Scroll

 ScrollTrigger

 Three.js background effects (optional)

 Lottie animations where suitable

Include:

 Fade

 Scale

 Rotate

 Parallax

 Reveal

 Magnetic buttons

 Smooth page transitions

 Section-based scroll animations

 Cinematic loading screen

Overall Goal

The final website should feel like a luxury production studio's official website, combining cinematic storytelling with modern web experiences. It should have a handcrafted, premium aesthetic with exceptional animation quality, making it feel like an award-winning creative agency website rather than something AI-generated.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b54ae744-e5ee-459f-beac-27781c27da17).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

### MySQL connection

Use Node.js 22. Copy `.env.example` to `.env.local` and set your MySQL credentials,
admin password, and a random JWT secret. Local overrides are ignored by Git.
Start MySQL in XAMPP, then run:

```sh
npm run db:setup
npm run db:check
npm run dev
```

Setup creates missing tables in `MYSQL_DATABASE` and imports missing CMS sections
from `public/cms-store.json` without overwriting existing database sections.
It does not import visitor history or create an admin login; login uses
`ADMIN_PASSWORD`. The check command fails if MySQL or the required tables are
unavailable. Restart the dev server after changing environment variables.
For deployment, configure the same variables in the server environment; MySQL
credentials must never use the browser-exposed `VITE_` prefix.

### Rental shop and customer accounts

- `/rentals`: equipment catalog; `/costume-rentals`: wardrobe catalog.
- `/rental-item/:id`: item details and date availability; `/cart`: mixed rental checkout.
- `/account`: mobile-verified registration, OTP sign-in, profile, bookings,
  cancellation requests, payment retry and booking summary downloads.
- `/admin/rentals` or **Rental Commerce** in the existing admin: products, stock,
  sizes, bookings, customers, pickup receipts, returns, external refund records.

Run `npm run db:setup` once after updating. It adds the tables in
`commerce-schema.sql` and imports the existing public collections as visible
listings with zero bookable stock. Confirm the actual product name, daily price,
deposit, stock and costume size in the admin to enable bookings. Create a separate
product per costume size/fit. Normal setup preserves existing publication choices;
the explicit `--publish-imported` setup flag publishes legacy imported zero-stock drafts.
CMS page-content cards remain separate from bookable inventory.

Prices are stored in integer paise. Pickup and return days both count. All cart
items share the same date range (maximum 90 days). Server-side transactions lock
inventory, calculate peak concurrent use, recheck prices, and make checkout
retries idempotent. Changing a product does not change existing booking prices.
Customer data and session hashes are stored in MySQL, never public JSON files.
Database failure stops checkout instead of pretending a booking succeeded.

Pay-at-pickup bookings are confirmed with payment **unpaid**. An admin must record
the actual payment reference before marking items collected. Paid cancellations
require review; refunds and deposit returns are recorded only after they are
completed outside the app. No automatic money transfer is performed by an admin
status update. The downloadable summary is not a tax invoice.

Customer login and signup use Fast2SMS mobile OTP only. Configure FAST2SMS_API_KEY,
FAST2SMS_SENDER_ID=KKWMRT, FAST2SMS_MESSAGE_ID=225363,
FAST2SMS_OTP_VARIABLES={otp}, and a random OTP_SECRET (32+ characters) on the server.
Template 225363 states a 10-minute validity; the server enforces that same expiry,
a 60-second resend cooldown, five wrong-code attempts and request rate limits.
Codes are stored as keyed hashes and consumed once. The DLT entity is linked to
the sender/template in Fast2SMS's dashboard; route=dlt does not take entity_id.
See [Fast2SMS DLT SMS](https://docs.fast2sms.com/reference/dlt-sms-single).

Existing unique mobile numbers can be verified to retain the same customer and
bookings. Duplicate legacy mobile numbers require studio-assisted account recovery.
Old password sessions do not grant access until mobile verification; first migration
revokes them. Verified phone numbers are read-only in profile. Email is a contact
field, not a login or verified identity. Admin authentication is unchanged.

### Optional online payment

Cashfree is implemented but disabled until configured. Set these **server-only**
values in .env.local locally or your hosting environment:

```dotenv
APP_ORIGIN=https://your-domain.com
RENTAL_PAYMENT_PROVIDER=cashfree
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
CASHFREE_ENV=sandbox
```

Whitelist your website domain in Cashfree and configure the payment-success
webhook at https://your-domain.com/api/rentals/webhook. Use sandbox credentials
first, verify a real sandbox payment and webhook delivery, then set
CASHFREE_ENV=production with live credentials. The integration uses Cashfree API
version 2025-01-01, hosted checkout, server-created payment sessions, and server
verification of order PAID status, captured SUCCESS payment, currency and amounts.
Browser redirects are never treated as proof of payment. Webhooks validate the
Base64 HMAC-SHA256 signature over the timestamp plus the unchanged raw body using
the Cashfree PG secret key. See [Cashfree web checkout](https://www.cashfree.com/docs/payments/online/web/redirect)
and [webhook verification](https://www.cashfree.com/docs/payments/online/webhooks/signature-verification).

Callback/webhook retries are idempotent. Unpaid online bookings hold stock for
15 minutes; late payments that cannot be fulfilled are flagged for a full refund
instead of overselling stock. Customers can check payment status in their account.
Live Cashfree credentials are not included. All refund actions in the admin are
records of externally completed refunds, not automated Cashfree refund requests.

### Admin WhatsApp booking notifications

Configure WABA_NOTIFICATIONS_ENABLED=true, WABA_API_BASE=https://waba.kkwebmart.in/api/v1,
WABA_API_KEY, WABA_ADMIN_PHONE=916001263561,
WABA_BOOKING_TEMPLATE=buddies_booking_confirmed and WABA_TEMPLATE_LANGUAGE=en_US.
The server sends POST /messages using a Bearer key and template.params in this order:
booking reference, products (including sizes and quantities), customer name, phone,
start date, end date, inclusive rental duration. The template's static header/footer
come from the approved template.

Only new confirmed bookings are queued: pickup reservations immediately, online
reservations after verified Cashfree payment. There is one durable notification row
per booking, claimed atomically before sending. Existing historical bookings are not
backfilled. Failed notifications do not roll back bookings. In admin, open Payments
& notifications to see status and retry explicit rejections or queued messages.
Accepted is provider acceptance, not confirmed handset delivery. Timeouts/interrupted
sends are marked unknown and require checking KK WABA logs before any resend; the
provider has no documented idempotency guarantee. No automatic background retry
worker is installed. The older event outbox remains an audit record for other future
notification types; it is not replayed by this integration.

### Verification and deployment

Use a local MySQL database. Tests start isolated servers and mock SMS/WhatsApp:

```sh
npm run test:rentals:otp
npm run test:rentals:payments
# After building the Node deployment:
npm run build:node
npm run test:rentals:production
```

The OTP runner uses port 8184 and runs security, rental integration and browser tests.
The underlying test:rentals / test:rentals:browser scripts require its mock environment
and refuse to send real OTPs. Tests clean up their own fixtures. The browser
test uses installed Microsoft Edge by default (`PLAYWRIGHT_CHANNEL` can override
it) and writes ignored screenshots to `.rental-test-artifacts/`. Payment tests
start an isolated app on port 8182 with a mocked provider; they do not charge money.
Production verification starts the built Node server on port 8183 with an ephemeral
test admin password, checks image storage and secret isolation, and runs the full
desktop/mobile browser journey. All tests require a local database and clean up
their own product/customer/booking fixtures.

For a self-hosted MySQL deployment, run `npm run build:node` and `npm start`
(builds with `NITRO_PRESET=node-server` and runs `.output/server/index.mjs` under Node.js 22) with the
server environment configured. New uploads use `storage/uploads/`, served through
`/uploads/:filename`; set `UPLOAD_DIR` to a persistent volume on your host. The standard
Lovable build target is unchanged; Cloudflare hosting needs a supported database
connection and durable image storage before use with this MySQL/file-backed app.
Set `APP_ORIGIN` to the exact public origin behind a proxy. Use a random
`JWT_SECRET` of at least 32 characters and an `ADMIN_PASSWORD` of at least 12
characters (or a bcrypt hash). The previous hardcoded signing secret is rejected;
the development password `admin123` is rejected in production. After changing the
secret, restart the server and sign in to the admin again.
