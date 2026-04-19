import qs from "query-string";
import { validateBitcoinAddress } from "./validateBitcoinAddress";

type InvoiceType = {
  bitcoin?: string;
  lightning?: string;
  amount?: string;
  label?: string;
  message?: string;
};

export const getBitcoinInvoiceData = (value: string) => {
  let lightningInvoice: string | undefined;
  let bitcoinAddress: string | undefined;
  let amount: number | undefined;
  let label: string | undefined;
  let message: string | undefined;

  if (value.toLowerCase().startsWith("lnbc")) {
    lightningInvoice = value.toLowerCase();
  } else if (validateBitcoinAddress(value)) {
    // Bech32 (bc1.../tb1...) is defined lowercase; normalise case so
    // downstream equality checks and QR encodings stay canonical.
    // Base58 (P2PKH/P2SH) is case-sensitive and must stay as-is.
    const lower = value.toLowerCase();
    const isBech32 = /^(bc1|tb1|bcrt1)/i.test(value);
    bitcoinAddress = isBech32 ? lower : value;
  } else if (validateBitcoinAddress(value.toLowerCase())) {
    // Fallback for bech32 addresses whose validator happened to be strict
    // about case.
    bitcoinAddress = value.toLowerCase();
  } else {
    const parsedValue = qs.parse(
      value
        .replace(/lightning:/i, "lightning=")
        .replace(/bitcoin:/i, "bitcoin=")
        .replace("?", "&"),
      { parseNumbers: true }
    ) as InvoiceType;
    lightningInvoice = parsedValue.lightning;
    bitcoinAddress = parsedValue.bitcoin;
    amount = parsedValue.amount
      ? Math.round(parseFloat(parsedValue.amount) * 100000000)
      : undefined;
    label = parsedValue.label;
    message = parsedValue.message;
  }

  const isValid =
    !!lightningInvoice ||
    (validateBitcoinAddress(bitcoinAddress || ""));

  return {
    lightningInvoice,
    bitcoinAddress,
    amount,
    label,
    message,
    isValid
  };
};
