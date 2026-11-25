import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Camera,
  Check,
  Search,
  ShieldCheck,
  Shirt,
  SlidersHorizontal,
} from "lucide-react";
import { rentalRequest } from "@/lib/rental-client";
import { money, type RentalKind, type RentalProduct } from "@/lib/rental-types";
import { useRentalCart } from "./cart-context";
import {
  buttonClass,
  DateFields,
  EmptyState,
  inputClass,
  Notice,
  rentalImage,
  RentalShell,
  secondaryClass,
} from "./shared";
import cameraImage from "@/assets/rental-camera.jpg";
import costumeImage from "@/assets/costume-rental.jpg";

export function RentalCatalog({ kind }: { kind: RentalKind }) {
  const { cart, setCart, addItem } = useRentalCart();
  const [products, setProducts] = useState<RentalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [sort, setSort] = useState("featured");
  const [added, setAdded] = useState("");
  const [dates, setDates] = useState({ start: "", end: "" });
  const [reload, setReload] = useState(0);
  const costume = kind === "costume";
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const search = dates.start && dates.end ? `?start=${dates.start}&end=${dates.end}` : "";
    rentalRequest<{ products: RentalProduct[] }>(`catalog${search}`)
      .then((r) => {
        if (active) setProducts(r.products);
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dates, reload]);
  const ownProducts = products.filter((p) => p.kind === kind);
  const categories = [...new Set(ownProducts.map((p) => p.category))];
  const filtered = useMemo(
    () =>
      products
        .filter(
          (p) =>
            p.kind === kind &&
            (category === "All categories" || p.category === category) &&
            `${p.name} ${p.category} ${p.description} ${p.size}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "low"
            ? a.price_paise - b.price_paise
            : sort === "high"
              ? b.price_paise - a.price_paise
              : a.name.localeCompare(b.name),
        ),
    [products, kind, category, query, sort],
  );
  return (
    <RentalShell title={costume ? "Costume rentals" : "Equipment rentals"}>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,#60132740,transparent_65%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-20">
          <div>
            <p className="mb-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              <span className="h-px w-8 bg-primary" />
              The Buddies rental collection
            </p>
            <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              {costume ? "Every character." : "Your vision."}
              <br />
              <span className="text-primary">{costume ? "Every detail." : "Our gear."}</span>
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">
              {costume
                ? "Wardrobe that brings a story to life. Explore costumes, find your fit and book your next character’s look."
                : "Build your next shoot with cinema cameras, beautiful glass and production essentials. Pick your dates. Find your kit. Make something great."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#collection" className={buttonClass}>
                Explore {costume ? "costumes" : "equipment"}
                <ArrowRight size={16} />
              </a>
              <a href={costume ? "/rentals" : "/costume-rentals"} className={secondaryClass}>
                {costume ? <Camera size={16} /> : <Shirt size={16} />}
                {costume ? "Equipment rentals" : "Costume rentals"}
              </a>
            </div>
            <div className="mt-9 flex flex-wrap gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-primary" />
                Transparent daily pricing
              </span>
              <span className="flex items-center gap-2">
                <Check size={15} className="text-primary" />
                Pickup in Guwahati
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-primary/10 blur-3xl" />
            <img
              src={costume ? costumeImage : cameraImage}
              alt={costume ? "Studio costume wardrobe" : "Professional cinema camera"}
              className="relative aspect-[5/4] w-full rounded-[2rem] border border-border object-cover"
            />
            <div className="absolute inset-x-5 bottom-5 flex items-center justify-between rounded-2xl border border-border bg-black/65 text-primary-foreground p-4 backdrop-blur-xl">
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-primary-foreground/70">
                  For your next production
                </p>
                <p className="mt-1 font-display text-lg font-semibold">
                  {costume ? "Dress the story." : "Ready. Set. Create."}
                </p>
              </div>
              {costume ? (
                <Shirt className="text-primary" size={28} />
              ) : (
                <Camera className="text-primary" size={28} />
              )}
            </div>
          </div>
        </div>
      </section>
      <section id="collection" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-12 sm:px-8">
        <div className="mb-10 grid gap-6 rounded-2xl border border-border bg-muted p-5 lg:grid-cols-[1fr_1.4fr_auto] lg:items-end">
          <div>
            <p className="font-display text-xl font-semibold">When’s your next shoot?</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Choose dates to see what’s available. Both days count.
            </p>
          </div>
          <DateFields
            start={cart.startDate}
            end={cart.endDate}
            onChange={(startDate, endDate) => setCart({ ...cart, startDate, endDate })}
          />
          <button
            className={buttonClass}
            disabled={!cart.startDate || !cart.endDate || loading}
            onClick={() => setDates({ start: cart.startDate, end: cart.endDate })}
          >
            Check availability
          </button>
        </div>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-primary">
              The collection
            </p>
            <h2 className="font-display text-3xl font-semibold">
              {costume ? "Find your character" : "Find your next kit"}
              <span className="ml-3 align-middle text-sm font-normal text-muted-foreground">
                {filtered.length} items
              </span>
            </h2>
          </div>
          <div className="flex gap-1 rounded-xl bg-muted p-1">
            <a
              href="/rentals"
              className={`rounded-lg px-4 py-2 text-xs ${!costume ? "bg-muted text-foreground" : "text-muted-foreground"}`}
            >
              Equipment
            </a>
            <a
              href="/costume-rentals"
              className={`rounded-lg px-4 py-2 text-xs ${costume ? "bg-muted text-foreground" : "text-muted-foreground"}`}
            >
              Costumes
            </a>
          </div>
        </div>
        <div className="mb-8 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <label className="relative">
            <Search className="absolute left-4 top-3.5 text-muted-foreground" size={17} />
            <input
              aria-label="Search rentals"
              placeholder={
                costume ? "Search costumes, styles or sizes…" : "Search cameras, lighting, audio…"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${inputClass} pl-11`}
            />
          </label>
          <label className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-muted-foreground" />
            <select
              aria-label="Category"
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>All categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <select
            aria-label="Sort rentals"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={inputClass}
          >
            <option value="featured">Name: A–Z</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </div>
        {added && (
          <div className="mb-6">
            <Notice>
              Added {added} to your cart.{" "}
              <a className="ml-2 underline" href="/cart">
                View cart →
              </a>
            </Notice>
          </div>
        )}
        {error ? (
          <Notice error>
            {error}{" "}
            <button className="ml-3 underline" onClick={() => setReload((v) => v + 1)}>
              Retry
            </button>
          </Notice>
        ) : loading ? (
          <div aria-label="Loading rentals" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : !filtered.length ? (
          <EmptyState
            title={ownProducts.length ? "No matching rentals" : "The collection is being prepared"}
          >
            {ownProducts.length
              ? "Try a different category or search term."
              : "Our team is preparing the bookable collection. Please check back shortly or contact the studio for availability."}
          </EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <article
                key={p.id}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:border-border"
              >
                <a href={`/rental-item/${p.id}`} className="relative block overflow-hidden">
                  <img
                    src={rentalImage(p.image)}
                    alt={p.name}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-full border border-border bg-black/70 px-3 py-1.5 text-[10px] text-primary-foreground backdrop-blur">
                    {p.category}
                  </span>
                  {p.size && (
                    <span className="absolute bottom-4 left-4 rounded-lg bg-black/70 text-primary-foreground px-2.5 py-1 text-xs backdrop-blur">
                      Size: {p.size}
                    </span>
                  )}
                </a>
                <div className="p-5">
                  <div className="mb-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span
                      className={`size-1.5 rounded-full ${(p.available ?? p.stock) > 0 ? "bg-emerald-400" : "bg-amber-300"}`}
                    />
                    {p.available !== undefined
                      ? p.available > 0
                        ? `${p.available} available for selected dates`
                        : "Unavailable for selected dates"
                      : p.stock > 0
                        ? "Select dates to check availability"
                        : "Currently unavailable"}
                  </div>
                  <a
                    href={`/rental-item/${p.id}`}
                    className="font-display text-xl font-semibold hover:text-primary"
                  >
                    {p.name}
                  </a>
                  <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">
                    {p.description}
                  </p>
                  <div className="mt-5 flex items-end justify-between gap-2 border-t border-border pt-4">
                    <div>
                      <p className="text-xl font-semibold">
                        {money(p.price_paise)}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          / day
                        </span>
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {p.deposit_paise
                          ? `${money(p.deposit_paise)} refundable deposit`
                          : "No security deposit"}
                      </p>
                    </div>
                    {(p.available ?? p.stock) < 1 ? (
                      <a
                        href={`/rental-item/${p.id}`}
                        className="shrink-0 rounded-xl bg-muted px-4 py-2.5 text-xs font-semibold hover:bg-primary"
                      >
                        View details
                      </a>
                    ) : (
                      <button
                        className="rounded-xl bg-muted px-4 py-2.5 text-xs font-semibold hover:bg-primary disabled:opacity-30"
                        disabled={(p.available ?? p.stock) < 1}
                        onClick={() => {
                          addItem(p.id, 1);
                          setAdded(p.name);
                        }}
                      >
                        Add to cart
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="mt-14 grid gap-8 border-t border-border pt-10 sm:grid-cols-3">
          {[
            [
              "01",
              "Choose your kit",
              "Browse equipment and costumes, then pick the dates for your production.",
            ],
            [
              "02",
              "Make it yours",
              "Review your rental and deposit, sign in and reserve your items.",
            ],
            [
              "03",
              "Create something great",
              "Collect at the studio and track every booking from your account.",
            ],
          ].map(([n, t, d]) => (
            <div key={n}>
              <span className="font-display text-3xl text-foreground/15">{n}</span>
              <h3 className="mt-3 font-semibold">{t}</h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </RentalShell>
  );
}

export function RentalProductPage({ id }: { id: string }) {
  const { cart, setCart, addItem } = useRentalCart();
  const [product, setProduct] = useState<RentalProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const search =
      cart.startDate && cart.endDate ? `?start=${cart.startDate}&end=${cart.endDate}` : "";
    rentalRequest<{ products: RentalProduct[] }>(`catalog${search}`)
      .then((r) => {
        if (active) setProduct(r.products.find((p) => p.id === id) || null);
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, cart.startDate, cart.endDate]);
  return (
    <RentalShell title="Rental details">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        {error ? (
          <Notice error>{error}</Notice>
        ) : loading ? (
          <p className="py-20 text-center text-muted-foreground">Checking availability…</p>
        ) : !product ? (
          <EmptyState title="This item is not available">
            <a href="/rentals" className="underline">
              Back to the collection
            </a>
          </EmptyState>
        ) : (
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <img
                className="aspect-square w-full rounded-3xl border border-border object-cover"
                src={rentalImage(product.image)}
                alt={product.name}
              />
              <div className="mt-6 rounded-2xl border border-border p-6">
                <h2 className="font-display text-xl font-semibold">What’s included</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                  {product.specifications || product.description}
                </p>
              </div>
            </div>
            <div>
              <a
                href={product.kind === "costume" ? "/costume-rentals" : "/rentals"}
                className="text-xs text-primary"
              >
                ← Back to {product.kind === "costume" ? "costumes" : "equipment"}
              </a>
              <p className="mt-7 text-xs uppercase tracking-widest text-muted-foreground">
                {product.category}
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{product.name}</h1>
              <p className="mt-5 text-sm leading-7 text-muted-foreground">{product.description}</p>
              {product.size && (
                <p className="mt-5 inline-block rounded-xl border border-border px-4 py-2 text-sm">
                  Size / fit: <strong>{product.size}</strong>
                </p>
              )}
              <div className="my-7 border-y border-border py-6">
                <p className="text-3xl font-semibold">
                  {money(product.price_paise)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">per day</span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {money(product.deposit_paise)} refundable security deposit per item · Minimum{" "}
                  {product.min_days} day(s)
                </p>
              </div>
              <DateFields
                start={cart.startDate}
                end={cart.endDate}
                onChange={(startDate, endDate) => setCart({ ...cart, startDate, endDate })}
              />
              <p className="mt-3 text-xs text-muted-foreground">
                {product.available === undefined
                  ? "Choose dates to check availability."
                  : `${product.available} available for your dates.`}{" "}
                Pickup and return days are included.
              </p>
              <div className="mt-6 flex gap-3">
                <label className="w-24 text-xs text-muted-foreground">
                  Quantity
                  <input
                    aria-label="Quantity"
                    type="number"
                    min={1}
                    max={Math.min(50, product.available ?? product.stock)}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className={`${inputClass} mt-2`}
                  />
                </label>
                <button
                  className={`${buttonClass} mt-6 flex-1`}
                  disabled={
                    !Number.isInteger(quantity) ||
                    quantity < 1 ||
                    quantity > Math.min(50, product.available ?? product.stock)
                  }
                  onClick={() => {
                    addItem(product.id, quantity);
                    setAdded(true);
                  }}
                >
                  Add to rental cart
                  <ArrowRight size={16} />
                </button>
              </div>
              {product.stock === 0 && (
                <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">
                  Online booking is currently unavailable for this item.{" "}
                  <a href="/#contact" className="underline">
                    Contact the studio
                  </a>{" "}
                  to confirm availability.
                </div>
              )}
              {added && (
                <div className="mt-5">
                  <Notice>
                    Added to cart.{" "}
                    <a href="/cart" className="underline">
                      Continue to checkout →
                    </a>
                  </Notice>
                </div>
              )}
              <div className="mt-8 space-y-3 text-xs text-muted-foreground">
                <p>✓ Studio pickup in Guwahati. Collection details appear at checkout.</p>
                <p>✓ Manage bookings and cancellation requests in your account.</p>
                <p>✓ Security deposits are tracked separately from rental charges.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </RentalShell>
  );
}
