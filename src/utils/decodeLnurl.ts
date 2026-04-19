import { bech32 } from "bech32";
import { Buffer } from "buffer";

/**
 * Shared helpers for recognising and normalising LNURL / Lightning-address
 * strings. Used by `useInvoiceHandler`, `useInitialClipboard` and
 * `useInvoiceCallback` so the detection rules stay consistent.
 */

// Conservative LN address regex (RFC5321-ish local@host).
const LN_ADDRESS_RE =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// A string is treated as LNURL only when it starts with one of these
// prefixes, never when the substring "lnurl" merely appears somewhere
// in the body.
const LNURL_PREFIXES = [
  "lnurl",
  "lnurlw://",
  "lnurlp://",
  "lightning:lnurl"
] as const;

/** Returns true when `value` is a Lightning address of the form user@host.tld. */
export const isLnAddress = (value: string): boolean =>
  LN_ADDRESS_RE.test(value.trim());

/** Returns true when `value` looks like an LNURL string. */
export const isLnurl = (value: string): boolean => {
  const v = value.toLowerCase();
  return LNURL_PREFIXES.some((p) => v.startsWith(p));
};

/** Returns true when `value` is either an LNURL or a Lightning address. */
export const isLnurlOrAddress = (value: string): boolean =>
  isLnurl(value) || isLnAddress(value);

export type DecodedLnurl =
  | { kind: "url"; url: string }
  | { kind: "invalid" };

/**
 * Normalise an LNURL or Lightning address into a plain https URL that the
 * caller can fetch.
 *
 * - Lightning addresses `user@host` -> `https://host/.well-known/lnurlp/user`.
 * - `lightning:...` wrappers are stripped.
 * - `lnurlw://` and `lnurlp://` schemes map to `https://`.
 * - Bech32-encoded `lnurl...` strings are decoded back to the embedded URL.
 *
 * Returns `{ kind: "invalid" }` for anything that does not fit the shapes
 * above, so the caller can surface a single "Invalid Lightning tag" error.
 */
export const decodeLnurl = (input: string): DecodedLnurl => {
  let value = input.trim();

  if (isLnAddress(value)) {
    const [user, host] = value.split("@");
    return {
      kind: "url",
      url: `https://${host}/.well-known/lnurlp/${user}`
    };
  }

  // `lightning:` prefix is optional; strip it before further checks.
  if (value.toLowerCase().startsWith("lightning:")) {
    value = value.slice("lightning:".length);
  }

  const lower = value.toLowerCase();
  if (lower.startsWith("lnurlw://")) {
    return { kind: "url", url: "https://" + value.slice("lnurlw://".length) };
  }
  if (lower.startsWith("lnurlp://")) {
    return { kind: "url", url: "https://" + value.slice("lnurlp://".length) };
  }

  if (lower.startsWith("lnurl")) {
    // Bech32 encoding is case-insensitive but the decoder expects a single
    // case; lower-casing is safe because the URL is ASCII.
    try {
      const { words } = bech32.decode(lower, 2000);
      const bytes = bech32.fromWords(words);
      return { kind: "url", url: Buffer.from(bytes).toString() };
    } catch {
      return { kind: "invalid" };
    }
  }

  return { kind: "invalid" };
};
