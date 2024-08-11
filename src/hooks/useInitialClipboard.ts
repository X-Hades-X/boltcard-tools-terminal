import { useCallback, useEffect, useRef } from "react";
import { Clipboard, getBitcoinInvoiceData, getPayRequestData } from "@utils";
import { useToast } from "react-native-toast-notifications";
import { useTranslation } from "react-i18next";
import { faFileInvoice } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "@components/Router";
import { AppState } from "react-native";
import { useNfc } from "@hooks";

export const useInitialClipboard = () => {
  const {
    stopNfc,
    isNfcScanning
  } = useNfc();
  const toast = useToast();
  const navigate = useNavigate();

  const { t } = useTranslation(undefined, { keyPrefix: "screens.home" });

  const appState = useRef(AppState.currentState);

  const checkClipboard = useCallback(async () => {
    const clipboardData = await Clipboard.getString();
    if(clipboardData.indexOf("@") >= 0){
      const {
        callback,
        description,
        minSendable,
        maxSendable,
        isValid
      } = await getPayRequestData(clipboardData);


      if(isValid) {
        const toastId = toast.show(t("foundInvoiceClipboard"), {
          type: "info",
          // @ts-ignore
          icon: faFileInvoice,
          duration: 10000,
          onPress: () => {
            if(isNfcScanning) {
              stopNfc();
            }
            toast.hide(toastId);
            navigate(`/bridge`, {
               state: {
                 lnurlPData: {callback, description, minSendable, maxSendable}
               }
            });
          }
        });
      }
    } else {
      const {
        isValid,
        lightningInvoice,
        bitcoinAddress,
        amount,
        label,
        message
      } = getBitcoinInvoiceData(clipboardData);

      if (isValid) {
        const toastId = toast.show(t("foundInvoiceClipboard"), {
          type: "info",
          // @ts-ignore
          icon: faFileInvoice,
          duration: 10000,
          onPress: () => {
            if(isNfcScanning) {
              stopNfc();
            }
            toast.hide(toastId);
            navigate(`/invoice`, {
              state: {
                ...(lightningInvoice
                  ? { lightningInvoice }
                  : { bitcoinAddress, amount, label, message })
              }
            });
          }
        });
      }
    }
  }, [navigate, t, toast]);

  useEffect(() => {
    // @ts-ignore
    if (toast.show) {
      void checkClipboard();
      if (AppState.isAvailable) {
        const subscription = AppState.addEventListener(
          "change",
          (nextAppState) => {
            if (
              appState.current.match(/inactive|background/) &&
              nextAppState === "active"
            ) {
              void checkClipboard();
            }

            appState.current = nextAppState;
          }
        );

        return () => subscription.remove();
      }
    }
  }, [!!toast.show]);
};
