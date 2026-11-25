import { z } from "zod";
import { indiaToday, rentalDays } from "./rental-types";

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{7,18}$/, "Enter a valid phone number");
export const passwordSchema = z.string().min(10, "Use at least 10 characters").max(72);
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) => Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
    "Invalid date",
  );
export const dateRangeSchema = z
  .object({ startDate: dateSchema, endDate: dateSchema })
  .refine((v) => v.startDate >= indiaToday(), "Choose today or a future pickup date")
  .refine(
    (v) => rentalDays(v.startDate, v.endDate) >= 1 && rentalDays(v.startDate, v.endDate) <= 90,
    "Rental duration must be 1–90 days",
  );
export const checkoutSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  items: z
    .array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(50) }))
    .min(1)
    .max(30),
  paymentMethod: z.enum(["pickup", "cashfree"]),
  notes: z.string().trim().max(1000).default(""),
  idempotencyKey: z.string().uuid(),
  expectedTotal: z.number().int().positive().max(100000000),
});
export const productSchema = z
  .object({
    id: z.string().uuid().optional(),
    kind: z.enum(["equipment", "costume"]),
    name: z.string().trim().min(2).max(160),
    category: z.string().trim().min(2).max(80),
    description: z.string().trim().min(10).max(6000),
    image: z
      .string()
      .max(1000)
      .refine(
        (s) => s === "" || (s.startsWith("/") && !s.startsWith("//")) || /^https:\/\//.test(s),
        "Use a local path or HTTPS image URL",
      ),
    size: z.string().trim().max(60),
    specifications: z.string().trim().max(6000),
    price_paise: z.number().int().min(0).max(100000000),
    deposit_paise: z.number().int().min(0).max(100000000),
    stock: z.number().int().min(0).max(10000),
    min_days: z.number().int().min(1).max(90),
    active: z.boolean(),
  })
  .refine(
    (v) =>
      !v.active ||
      (v.price_paise > 0 && !!v.image && (v.kind !== "costume" || v.stock === 0 || !!v.size)),
    "Published items need a price and image. Bookable costumes also need a size.",
  );
