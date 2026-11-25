import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { rentalRequest } from "@/lib/rental-client";
import type { Customer } from "@/lib/rental-types";
import { buttonClass, inputClass, Notice, secondaryClass } from "./shared";

type OtpRequest = { challenge: string; phone: string; expiresIn: number; resendAfter: number };
export function CustomerAuth({
  onAuthenticated,
}: {
  onAuthenticated: (customer: Customer) => void;
}) {
  const [register, setRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState<OtpRequest | null>(null);
  const [resendAt, setResendAt] = useState(0);
  const [expiresAt, setExpiresAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!pending) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [pending]);
  const wait = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const expired = !!pending && now >= expiresAt;
  async function send() {
    setBusy(true);
    setError("");
    try {
      const result = await rentalRequest<OtpRequest>("account", {
        action: "request_otp",
        purpose: register ? "register" : "login",
        phone,
        name,
        email,
      });
      const time = Date.now();
      setPending(result);
      setOtp("");
      setNow(time);
      setResendAt(time + result.resendAfter * 1000);
      setExpiresAt(time + result.expiresIn * 1000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending) return send();
    setBusy(true);
    setError("");
    try {
      const result = await rentalRequest<{ customer: Customer }>("account", {
        action: "verify_otp",
        challenge: pending.challenge,
        otp,
      });
      onAuthenticated(result.customer);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function reset(mode: boolean) {
    setRegister(mode);
    setPending(null);
    setOtp("");
    setError("");
  }
  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <ShieldCheck size={22} />
      </div>
      <h2 className="font-display text-2xl font-semibold">
        {pending ? "Verify your mobile" : register ? "Create your Buddies account" : "Welcome back"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {pending
          ? `Enter the 6-digit OTP sent to +91 ${pending.phone}.`
          : "Sign in with a mobile OTP. No password needed."}
      </p>
      <div className="my-6 flex rounded-xl bg-muted p-1">
        {[
          [false, "Sign in"],
          [true, "Create account"],
        ].map(([mode, label]) => (
          <button
            key={String(label)}
            type="button"
            disabled={busy}
            className={`flex-1 rounded-lg py-2.5 text-sm ${register === mode ? "bg-muted" : "text-muted-foreground"}`}
            onClick={() => reset(Boolean(mode))}
          >
            {String(label)}
          </button>
        ))}
      </div>
      {error && <Notice error>{error}</Notice>}
      <form onSubmit={submit} className="mt-5 space-y-4">
        <fieldset disabled={busy} className="space-y-4">
          {!pending ? (
            <>
              {register && (
                <>
                  <label className="block space-y-2 text-xs text-muted-foreground">
                    Full name
                    <input
                      name="name"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={100}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                      placeholder="Your name"
                    />
                  </label>
                  <label className="block space-y-2 text-xs text-muted-foreground">
                    Email address
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={190}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      placeholder="you@example.com"
                    />
                  </label>
                </>
              )}
              <label className="block space-y-2 text-xs text-muted-foreground">
                Mobile number
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  minLength={10}
                  maxLength={25}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder="+91 98765 43210"
                />
              </label>
            </>
          ) : (
            <>
              <label className="block space-y-2 text-xs text-muted-foreground">
                One-time password (OTP)
                <input
                  key={pending.challenge}
                  name="otp"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  required
                  minLength={6}
                  maxLength={6}
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className={`${inputClass} text-center text-xl tracking-[0.4em]`}
                  placeholder="000000"
                />
              </label>
              <p role="status" className="text-xs text-muted-foreground">
                {expired
                  ? "This OTP has expired. Request a new code."
                  : "OTP is valid for 10 minutes. Use the latest code received."}
              </p>
            </>
          )}
          <button disabled={busy || expired} className={`${buttonClass} w-full`}>
            {busy
              ? "Please wait..."
              : pending
                ? register
                  ? "Verify & create account"
                  : "Verify & sign in"
                : "Send OTP"}
            <ArrowRight size={16} />
          </button>
        </fieldset>
      </form>
      {pending && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy || wait > 0}
            onClick={send}
            className={secondaryClass}
          >
            {wait ? `Resend in ${wait}s` : "Resend OTP"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => reset(register)}
            className="text-xs text-muted-foreground underline"
          >
            Change number / details
          </button>
        </div>
      )}
      <p className="mt-5 text-center text-[11px] text-muted-foreground">
        Your mobile number is verified before you can access your bookings.
      </p>
    </div>
  );
}
