export type RentalKind = "equipment" | "costume";
export interface RentalProduct {
  id: string;
  kind: RentalKind;
  name: string;
  category: string;
  description: string;
  image: string;
  size: string;
  specifications: string;
  price_paise: number;
  deposit_paise: number;
  stock: number;
  min_days: number;
  active: boolean;
  available?: number;
}
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}
export interface BookingItem {
  product_id: string;
  name: string;
  image: string;
  size: string;
  quantity: number;
  price_paise: number;
  deposit_paise: number;
}
export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "collected"
  | "completed"
  | "cancel_requested"
  | "cancelled"
  | "expired";
export interface RentalBooking {
  id: string;
  booking_number: string;
  customer_id: string;
  start_date: string;
  end_date: string;
  days: number;
  status: BookingStatus;
  payment_method: "pickup" | "cashfree";
  payment_status: "unpaid" | "paid" | "refund_pending" | "refunded";
  rental_paise: number;
  deposit_paise: number;
  total_paise: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string;
  payment_reference: string | null;
  refund_reference: string | null;
  deposit_returned: boolean;
  deposit_reference: string | null;
  gateway_order_id: string | null;
  gateway_payment_id: string | null;
  hold_expires_at: string | null;
  created_at: string;
  items: BookingItem[];
  events: { id: number; event: string; details: string; created_at: string }[];
}
export interface CartItem {
  productId: string;
  quantity: number;
}
export interface CartState {
  items: CartItem[];
  startDate: string;
  endDate: string;
}
export const money = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
export const statusLabel = (value: string) => value.replaceAll("_", " ");
export function indiaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function rentalDays(start: string, end: string) {
  return Math.floor((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
}
