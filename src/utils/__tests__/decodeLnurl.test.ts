import {
  decodeLnurl,
  isLnAddress,
  isLnurl,
  isLnurlOrAddress
} from "../decodeLnurl";

describe("isLnAddress", () => {
  it.each([
    ["alice@example.com", true],
    ["a.b+c@sub.example.co.uk", true],
    ["user@host.tld", true]
  ])("accepts %s", (value, expected) => {
    expect(isLnAddress(value)).toBe(expected);
  });

  it.each([
    "just a sentence with @ inside",
    "foo@bar",
    "@host.tld",
    "user@",
    "https://example.com/?q=foo@bar"
  ])("rejects %s", (value) => {
    expect(isLnAddress(value)).toBe(false);
  });
});

describe("isLnurl", () => {
  it.each([
    "LNURL1DP68GURN8GHJ7EM9W3SKCCNE9E3K7MF0W5LHXSGKUMT9X56N",
    "lnurl1dp68gurn8ghj7em9w3skccne9e3k7mf0w5lhxsgkumt9x56n",
    "lnurlw://my.lnbits/withdraw/abc",
    "lnurlp://my.lnbits/pay/xyz",
    "lightning:lnurl1dp68gurn8ghj7em9w3skccne9e3k7mf0w5lhxsgkumt9x56n"
  ])("accepts %s", (value) => {
    expect(isLnurl(value)).toBe(true);
  });

  it.each([
    "alice@example.com",
    "https://example.com",
    "this string mentions lnurl in the middle",
    "lnbc1u1p0jvzynpp5..."
  ])("rejects %s", (value) => {
    expect(isLnurl(value)).toBe(false);
  });
});

describe("isLnurlOrAddress", () => {
  it("is true for an LN address", () => {
    expect(isLnurlOrAddress("alice@example.com")).toBe(true);
  });
  it("is true for an LNURL", () => {
    expect(isLnurlOrAddress("lnurlw://host/withdraw/x")).toBe(true);
  });
  it("is false for plain urls", () => {
    expect(isLnurlOrAddress("https://example.com")).toBe(false);
  });
});

describe("decodeLnurl", () => {
  it("converts a Lightning address into the .well-known URL", () => {
    const decoded = decodeLnurl("alice@example.com");
    expect(decoded).toEqual({
      kind: "url",
      url: "https://example.com/.well-known/lnurlp/alice"
    });
  });

  it("strips a leading 'lightning:' prefix", () => {
    const decoded = decodeLnurl("lightning:lnurlw://host/withdraw/abc");
    expect(decoded).toEqual({
      kind: "url",
      url: "https://host/withdraw/abc"
    });
  });

  it("maps 'lnurlw://...' to 'https://...'", () => {
    expect(decodeLnurl("lnurlw://my.lnbits/withdraw/abc")).toEqual({
      kind: "url",
      url: "https://my.lnbits/withdraw/abc"
    });
  });

  it("maps 'lnurlp://...' to 'https://...'", () => {
    expect(decodeLnurl("lnurlp://my.lnbits/pay/xyz")).toEqual({
      kind: "url",
      url: "https://my.lnbits/pay/xyz"
    });
  });

  it("decodes a bech32-encoded lnurl back to its URL", () => {
    // bech32('lnurl', 'https://service.com/api?q=3fc3645b439ce8e7') from BOLT-spec test vectors.
    const lnurl =
      "LNURL1DP68GURN8GHJ7UM9WFMXJCM99E3K7MF0V9CXJ0M385EKVCENXC6R2C35XVUKXEFCV5MKVV34X5EKZD3EV56NYD3HXQURZEPEXEJXXEPNXSCRVWFNV9NXZCN9XQ6XYEFHVGCXXCMYXYMNSERXFQ5FNS";
    const decoded = decodeLnurl(lnurl);
    expect(decoded.kind).toBe("url");
    if (decoded.kind === "url") {
      expect(decoded.url).toContain("https://");
    }
  });

  it("returns invalid for anything unrecognised", () => {
    expect(decodeLnurl("hello world")).toEqual({ kind: "invalid" });
    expect(decodeLnurl("https://example.com")).toEqual({ kind: "invalid" });
  });
});
