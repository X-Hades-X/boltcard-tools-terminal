import { getBitcoinInvoiceData } from "../getBitcoinInvoiceData";

describe("getBitcoinInvoiceData", () => {
  describe("bitcoin addresses", () => {
    it("accepts a mainnet P2PKH (base58) address as-is, preserving case", () => {
      // Real genesis coinbase address; mixed case matters for base58.
      const addr = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
      const result = getBitcoinInvoiceData(addr);
      expect(result.isValid).toBe(true);
      expect(result.bitcoinAddress).toBe(addr);
      expect(result.lightningInvoice).toBeUndefined();
    });

    it("accepts a mainnet P2SH (base58) address with its original case", () => {
      const addr = "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy";
      const result = getBitcoinInvoiceData(addr);
      expect(result.isValid).toBe(true);
      expect(result.bitcoinAddress).toBe(addr);
    });

    it("accepts a bech32 address in lowercase", () => {
      const addr = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";
      const result = getBitcoinInvoiceData(addr);
      expect(result.isValid).toBe(true);
      expect(result.bitcoinAddress).toBe(addr);
    });

    it("accepts a bech32 address in upper-case by normalising to lowercase", () => {
      const addr = "BC1QAR0SRRR7XFKVY5L643LYDNW9RE59GTZZWF5MDQ";
      const result = getBitcoinInvoiceData(addr);
      expect(result.isValid).toBe(true);
      expect(result.bitcoinAddress).toBe(addr.toLowerCase());
    });
  });

  describe("lightning invoices", () => {
    it("accepts a bolt11 invoice", () => {
      const inv =
        "lnbc1u1p0jvzynpp5v6c6m8y5l4z7sgk4x6uz8g8efdrk3a4mp5l5g5l3hy5v3z2r9azsdqqcqzzsxqyz5vqsp5fakefake0000000";
      const result = getBitcoinInvoiceData(inv);
      expect(result.isValid).toBe(true);
      expect(result.lightningInvoice).toBe(inv);
    });

    it("lowercases uppercase bolt11 invoices", () => {
      const inv = "LNBC1ABC";
      const result = getBitcoinInvoiceData(inv);
      expect(result.lightningInvoice).toBe("lnbc1abc");
    });
  });

  describe("BIP21 payment URIs", () => {
    it("parses amount, label and message", () => {
      const uri =
        "bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=0.001&label=Donation&message=Thanks";
      const result = getBitcoinInvoiceData(uri);
      expect(result.isValid).toBe(true);
      expect(result.bitcoinAddress?.toLowerCase()).toBe(
        "1a1zp1ep5qgefi2dmptftl5slmv7divfna"
      );
      expect(result.amount).toBe(100_000); // 0.001 BTC in sats
      expect(result.label).toBe("Donation");
      expect(result.message).toBe("Thanks");
    });
  });

  describe("invalid inputs", () => {
    it("rejects an obviously non-bitcoin string", () => {
      const result = getBitcoinInvoiceData("hello world");
      expect(result.isValid).toBe(false);
    });

    it("rejects an empty string", () => {
      const result = getBitcoinInvoiceData("");
      expect(result.isValid).toBe(false);
    });
  });
});
