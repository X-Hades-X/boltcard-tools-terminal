import { useCallback } from "react";
import { useNavigate } from "@components/Router";
import { useToast } from "react-native-toast-notifications";
import { getBitcoinInvoiceData } from "@utils";
import { useTranslation } from "react-i18next";

export const useInvoiceHandler = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  const invoiceHandler = useCallback(
    (value: string) => {
      if(value.indexOf("@") >= 0){
        const splitLnAddress = value.split("@");
        const lightningRequest = `lnurlp://${splitLnAddress[1]}/.well-known/lnurlp/${splitLnAddress[0]}`;
        navigate(`/wallet`, {
          state: {lightningRequest}
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
          navigate(`/invoice`, {
            state: {
              ...(lightningInvoice
                ? { lightningInvoice }
                : { bitcoinAddress, amount, label, message })
            }
          });
        } else {
          toast.show(t("errors.invalidInvoice"), { type: "error" });
        }
      }
    },
    [navigate, t, toast]
  );

  return { invoiceHandler };
};
