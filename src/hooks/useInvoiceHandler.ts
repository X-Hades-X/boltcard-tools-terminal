import { useCallback } from "react";
import { useNavigate } from "@components/Router";
import { useToast } from "react-native-toast-notifications";
import { getBitcoinInvoiceData, isLnurlOrAddress } from "@utils";
import { useTranslation } from "react-i18next";
import qs from "query-string";

export const useInvoiceHandler = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  const invoiceHandler = useCallback(
    (value: string) => {
      // OpenCryptoPay (and probably others) provide QR codes that contain a URL
      // with a lightning/bitcoin query parameter. Parse the URL properly instead
      // of hand-rolling string replacements.
      // TODO OpenCryptoPay has an API call that provides the fiat value; could
      // be supported in a later release.
      if (value.toLowerCase().startsWith("http")) {
        try {
          const { query } = qs.parseUrl(value, { parseNumbers: false });
          const { lightning, bitcoin } = query as {
            lightning?: string;
            bitcoin?: string;
          };
          if (lightning) {
            value = lightning;
          } else if (bitcoin) {
            value = bitcoin;
          }
        } catch {
          // fall through with the original value
        }
      }

      if (isLnurlOrAddress(value)) {
        navigate(`/decoder`, {
          state: { lightningRequest: value }
        });
      } else {
        const {
          lightningInvoice,
          bitcoinAddress,
          amount,
          label,
          message,
          isValid
        } = getBitcoinInvoiceData(value);

        if (isValid) {
          if (bitcoinAddress && !amount) {
            navigate(`/wallet`, {
              state: { bitcoinAddress }
            });
          } else {
            navigate(`/invoice`, {
              state: {
                ...(lightningInvoice
                  ? { lightningInvoice }
                  : { bitcoinAddress, amount, label, message })
              }
            });
          }
        } else {
          toast.show(t("errors.invalidInvoice"), { type: "error" });
        }
      }
    },
    [navigate, t, toast]
  );

  return { invoiceHandler };
};
