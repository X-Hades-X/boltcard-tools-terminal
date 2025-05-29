import { useCallback, useEffect, useRef } from "react";
import { Clipboard, getBitcoinInvoiceData } from "@utils";
import { useToast } from "react-native-toast-notifications";
import { useTranslation } from "react-i18next";
import { faFileInvoice } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "@components/Router";
import { AppState } from "react-native";

export const useInitialClipboard = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const { t } = useTranslation(undefined, { keyPrefix: "screens.home" });

  const appState = useRef(AppState.currentState);

  const checkClipboard = useCallback(async () => {
    const clipboardData = await Clipboard.getString();
    if (clipboardData.toLowerCase().indexOf("lnurl") >= 0 || clipboardData.indexOf("@") >= 0) {
      const toastId = toast.show(t("foundLnurlClipboard"), {
        type: "info",
        // @ts-ignore
        icon: faFileInvoice,
        duration: 10000,
        onPress: () => {
          toast.hide(toastId);
          Clipboard.setString("");
          navigate(`/decoder`, {
            state: {lightningRequest: clipboardData}
          });
        }
      });
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
            toast.hide(toastId);
            Clipboard.setString("");
            if(bitcoinAddress && !amount) {
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
