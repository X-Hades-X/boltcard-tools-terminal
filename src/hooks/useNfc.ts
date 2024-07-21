import { platform } from "@config";
import { bech32 } from "bech32";
import { useCallback, useEffect, useState } from "react";
import { NFC, isApiError } from "@utils";
import { useToast } from "react-native-toast-notifications";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { useInvoiceHandler } from "@hooks";

const { isWeb, isNative, isIos, getIsNfcSupported } = platform;

export const useNfc = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const [isNfcAvailable, setIsNfcAvailable] = useState(false);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [isNfcLoading, setIsNfcLoading] = useState(false);
  const [isNfcNeedsTap, setIsNfcNeedsTap] = useState(false);
  const [isNfcNeedsPermission, setIsNfcNeedsPermission] = useState(false);
  const [isNfcActionSuccess, setIsNfcActionSuccess] = useState(false);
  const [isPinRequired, setIsPinRequired] = useState(false);
  const [isPinConfirmed, setIsPinConfirmed] = useState(false);
  const { invoiceHandler } = useInvoiceHandler();

  const lightingPrefix = "lightning:";
  const lnurlwPrefix = "lnurlw://";
  const lnurlEncodingPrefix = "lnurl";

  const [lnurlWData, setLnurlWData] = useState<{
     tag: "withdrawRequest";
     callback: string;
     k1: string;
     pinLimit?: number;
     payLink?: string;
   }>();

  const [lnurlPData, setLnurlPData] = useState<{
     tag?: string;
     callback?: string;
     minSendable?: number;
     maxSendable?: number;
     commentAllowed?: number;
   }>();

  const [ pinResolver, setPinResolver ] = useState<{
    resolve: (v: string) => void;
  }>();

  const setPin = (pin: string) => {
    if(pinResolver?.resolve) {
      pinResolver.resolve(pin);
    }
  }

  const getPin = useCallback(async () => {
    const pinInputPromise = () => {
      let _pinResolver;
      return [ new Promise<string>(( resolve ) => {
          _pinResolver = resolve
      }), _pinResolver]
    }

    const [ promise, resolve ] = pinInputPromise()
    setPinResolver({ resolve } as unknown as { resolve: (v: string) => void })
    return promise as Promise<string>;
  }, []);

  const setupNfc = useCallback(async () => {
    if (await getIsNfcSupported()) {
      try {
        await NFC.init();
      } catch (e) {}

      if (isWeb) {
        let nfcStatus = {} as PermissionStatus;

        try {
          nfcStatus = await navigator.permissions.query({
            name: "nfc" as PermissionName
          });
        } catch (e) {}

        if (nfcStatus?.state === "granted") {
          setIsNfcAvailable(true);
          setIsNfcNeedsTap(false);
          setIsNfcNeedsPermission(false);
        } else {
          setIsNfcNeedsPermission(true);
          setIsNfcNeedsTap(true);
        }
      } else if (isNative) {
        setIsNfcAvailable(true);
        setIsNfcNeedsTap(isIos);
      }
    }
  }, []);

  const readingNfcLoopWithdraw = useCallback(
    async (cb?: string | null, k1?: string | null, amount?: number | null, pinRequired?: boolean | null) => {
        let pin = "";
        if (pinRequired) {
          setIsPinRequired(true);
          pin = await getPin();
          setIsPinConfirmed(true);
        } else {
          setIsPinRequired(false);
        }

        setIsNfcActionSuccess(false);
        await NFC.stopRead();

        setIsNfcScanning(true);
        NFC.startRead(async (nfcMessage) => {
            setIsNfcScanning(false);
            setIsNfcLoading(true);

            if (
              !nfcMessage.toLowerCase().startsWith(lnurlwPrefix) &&
              (nfcMessage.toLowerCase().startsWith(lightingPrefix) ||
                nfcMessage.toLowerCase().startsWith(lnurlEncodingPrefix))
            ) {
              nfcMessage = nfcMessage.toLowerCase();
            } else if (!nfcMessage.startsWith(lnurlwPrefix)) {
              toast.show(t("errors.invalidLightningTag"), {
                type: "error"
              });

              if (!isIos) {
                readingNfcLoopWithdraw(cb, k1, amount, pin);
              } else {
                setIsNfcAvailable(false);
              }

              setIsNfcLoading(false);
              return;
            }

            let debitCardData;
            let error;
            let cardData = getCardData(nfcMessage);
            try {
                let payLink = await requestLnurlData(cardData);
                if(cb && amount) {
                    if(payLink.minSendable / 1000 > amount) {
                        error = { reason: "Amount is lower than min sendable. Can't make payRequest."}
                    } else if(payLink.maxSendable / 1000 < amount) {
                        error = { reason: "Amount is higher than max sendable. Can't make payRequest."}
                    }

                    if (!error) {
                      const { data: payLinkResponseData } = await axios.get<{ pr: string }>(
                          payLink.callback, {
                            params: {
                              amount: amount * 1000
                            }
                      });

                      debitCardData = await settleInvoice(cb, k1, payLinkResponseData.pr, pin)
                    }
                } else {
                    await NFC.stopRead();
                    setIsNfcLoading(false);
                    setIsPinConfirmed(false);
                    setIsPinRequired(false);
                    setIsNfcActionSuccess(true);
                    if (isIos) {
                      setIsNfcAvailable(false);
                    }
                    return;
                }
            } catch (e) {
              if (isApiError(e)) {
                error = e.response.data;
              }
            }

            await NFC.stopRead();
            setIsNfcLoading(false);
            setIsPinConfirmed(false);
            setIsPinRequired(false);

            if (debitCardData?.status === "OK" && !error) {
              setIsNfcActionSuccess(true);
            } else {
              if (debitCardData?.status === "ERROR" && !error) {
                error = debitCardData;
              }
              toast.show(
                typeof error?.reason === "string"
                  ? error.reason
                  : error?.reason.detail || t("errors.unknown"),
                {
                  type: "error"
                }
              );

              if (!isIos) {
                readingNfcLoopWithdraw(cb, amount, pin);
              }
            }

            if (isIos) {
              setIsNfcAvailable(false);
              return;
            }
        });
    }, [invoiceHandler, requestLnurlData, lnurlPData, settleInvoice]);

  const readingNfcLoop = useCallback(
    async (pr: string, amount?: number | null) => {

      setIsNfcActionSuccess(false);
      await NFC.stopRead();

      setIsNfcScanning(true);
      NFC.startRead(async (nfcMessage) => {
        setIsNfcScanning(false);
        setIsNfcLoading(true);

        if (
          !nfcMessage.toLowerCase().startsWith(lnurlwPrefix) &&
          (nfcMessage.toLowerCase().startsWith(lightingPrefix) ||
            nfcMessage.toLowerCase().startsWith(lnurlEncodingPrefix))
        ) {
          nfcMessage = nfcMessage.toLowerCase();
        } else if (!nfcMessage.startsWith(lnurlwPrefix)) {
          toast.show(t("errors.invalidLightningTag"), {
            type: "error"
          });

          if (!isIos) {
            readingNfcLoop(pr, amount);
          } else {
            setIsNfcAvailable(false);
          }

          setIsNfcLoading(false);
          return;
        }

        let debitCardData;
        let error;
        let cardData = getCardData(nfcMessage);
        try {
            const { data: cardDataResponse } = await axios.get<{
              tag: "withdrawRequest";
              callback: string;
              k1: string;
              pinLimit?: number;
            }>(cardData);

            let pin = "";
            if (cardDataResponse.pinLimit !== undefined) {
              if (!amount) {
                error = { reason: "No amount set. Can't make withdrawRequest"}
              } else {
                //if the card has pin enabled
                //check the amount didn't exceed the limit
                const limitSat = cardDataResponse.pinLimit;
                if (limitSat <= amount) {
                  setIsPinRequired(true);
                  pin = await getPin();
                  setIsPinConfirmed(true);
                }
              }
            } else {
              setIsPinRequired(false);
            }

            if (!error) {
              debitCardData = await settleInvoice(cardDataResponse.callback, cardDataResponse.k1, pr, pin)
            }
        } catch (e) {
          if (isApiError(e)) {
            error = e.response.data;
          }
        }

        await NFC.stopRead();
        setIsNfcLoading(false);
        setIsPinConfirmed(false);
        setIsPinRequired(false);

        if (debitCardData?.status === "OK" && !error) {
          setIsNfcActionSuccess(true);
        } else {
          if (debitCardData?.status === "ERROR" && !error) {
            error = debitCardData;
          }
          toast.show(
            typeof error?.reason === "string"
              ? error.reason
              : error?.reason.detail || t("errors.unknown"),
            {
              type: "error"
            }
          );

          if (!isIos) {
            readingNfcLoop(pr, amount);
          }
        }

        if (isIos) {
          setIsNfcAvailable(false);
          return;
        }

      });
    },
    [toast, t, getPin, settleInvoice]
  );

  const getCardData = useCallback(
      (nfcMessage: string) => {
          let cardData = "";

          if (nfcMessage.startsWith(lightingPrefix)) {
            nfcMessage = nfcMessage.slice(lightingPrefix.length);
          }

          if (nfcMessage.startsWith(lnurlwPrefix)) {
            nfcMessage = nfcMessage.replace("lnurlw", "https");
          }

          if (nfcMessage.startsWith(lnurlEncodingPrefix)) {
            const lnurl = nfcMessage;

            const { words: dataPart } = bech32.decode(lnurl, 2000);
            const requestByteArray = bech32.fromWords(dataPart);
            cardData = Buffer.from(requestByteArray).toString();
          } else {
            cardData = nfcMessage;
          }

          if (cardData.startsWith(lnurlwPrefix)) {
            cardData = cardData.replace("lnurlw", "https");
          }
          return cardData;
  }, []);

  const settleInvoice = useCallback(
    async (cb: string, k1: string, pr: string, pin?: string | null) => {
      const { data: callbackResponseData } = await axios.get<{
        reason: { detail: string };
        status: "OK" | "ERROR";
      }>(cb, {
        params: {
          k1,
          pr,
          pin
        }
      });
      return callbackResponseData;
  }, []);

  const requestLnurlData = useCallback(
    async (cardData: string) => {
        const { data: cardRequest } = await axios.get<{ payLink?: string }>(
            cardData
        );
        setLnurlWData(cardRequest);

        if (!cardRequest.payLink) throw getError("Invalid tag. No payLink");
        let finalUrl = cardRequest.payLink;
        if (finalUrl.startsWith("lnurlp://")) {
            finalUrl = finalUrl.replace("lnurlp", "https");
        }
        const { data: finalUrlRequest } = await axios.get<{
            tag?: string;
            callback?: string;
            minSendable?: number;
            maxSendable?: number;
            commentAllowed?: number;
        }>(finalUrl);
        setLnurlPData(finalUrlRequest);

        return finalUrlRequest;
  }, []);

  const stopNfc = useCallback(() => {
    setIsNfcScanning(false);
    setIsNfcLoading(false);
    void NFC.stopRead();
  }, []);

  useEffect(() => {
    return stopNfc;
  }, []);

  return {
    isNfcAvailable,
    isNfcScanning,
    isNfcLoading,
    isNfcNeedsTap,
    isNfcNeedsPermission,
    isNfcActionSuccess,
    isPinRequired,
    isPinConfirmed,
    setPin,
    setupNfc,
    stopNfc,
    readingNfcLoop,
    readingNfcLoopWithdraw,
    lnurlWData,
    lnurlPData
  };
};
