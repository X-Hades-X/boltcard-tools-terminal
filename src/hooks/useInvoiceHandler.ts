import { useCallback } from "react";
import { useNavigate } from "@components/Router";
import { useToast } from "react-native-toast-notifications";
import { getBitcoinInvoiceData } from "@utils";
import { useTranslation } from "react-i18next";
import qs from "query-string";

export const useInvoiceHandler = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  const invoiceHandler = useCallback(
    (value: string) => {

      // OpenCryptoPay (and probably others) provide QR codes that contain a URL with lightning param
      // TODO OpenCryptoPay has an api call that provides the fiat value; could be supported in a later release
      if(value.toLowerCase().startsWith("http")) {
        const parsedValue = qs.parse(
          value
            .replace(/lightning:/i, "lightning=")
            .replace(/bitcoin:/i, "bitcoin=")
            .replace("?", "&"),
          { parseNumbers: true }
        ) as {lightning: string; bitcoin: string}
        if(parsedValue.lightning) {
          value = parsedValue.lightning
        } else if(parsedValue.bitcoin) {
          value = parsedValue.bitcoin
        }
      }

      if (value.toLowerCase().indexOf("lnurl") >= 0 || value.indexOf("@") >= 0) {
        navigate(`/decoder`, {
          state: {lightningRequest: value}
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
          if(bitcoinAddress && !amount) {
            navigate(`/wallet`, {
              state: {bitcoinAddress: bitcoinAddress}
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
