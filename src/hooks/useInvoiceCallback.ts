import { useCallback, useEffect, useState } from "react";
import { useToast } from "react-native-toast-notifications";
import { useTranslation } from "react-i18next";
import { bech32 } from "bech32";
import axios from "axios";
import { isApiError } from "@utils";
import { XOR } from "ts-essentials";

export type LnurlWData =
  {
    tag: "withdrawRequest";
    callback: string;
    k1: string;
    defaultDescription: string;
    minWithdrawable: number;
    maxWithdrawable: number;
    pinLimit?: number;
    balanceCheck?: string;
    payLink?: string;
  };

export type LnurlPData =
  {
    tag: "payRequest";
    callback: string;
    minSendable: number;
    maxSendable: number;
    metadata: string;
  };

export type InvoiceRequest = XOR<LnurlWData, LnurlPData>;

type CallbackResponse = {
  reason: string;
  status: "OK" | "ERROR";
};

type InvoiceResponse = XOR<InvoiceRequest, CallbackResponse>;

export const useInvoiceCallback = () => {
  const toast = useToast();
  const { t } = useTranslation(undefined, { keyPrefix: "common" });
  const [error, setError] = useState<CallbackResponse>();
  const [isPaySuccess, setIsPaySuccess] = useState(false);

  useEffect(() => {
    if (error) {
      toast.show(error.reason,
        {
          type: "error"
        }
      );
    }
  }, [error, toast]);

  const callLnurl = useCallback(
    async (lnurl: string) => {
      setIsPaySuccess(false);
      setError(undefined);

      if (lnurl.indexOf("@") >= 0) {
        const splitLnAddress = lnurl.split("@");
        lnurl = `lnurlp://${splitLnAddress[1]}/.well-known/lnurlp/${splitLnAddress[0]}`;
      }

      const lightingPrefix = "lightning:";
      const lnurlwPrefix = "lnurlw://";
      const lnurlpPrefix = "lnurlp://";
      const lnurlEncodingPrefix = "lnurl";

      if (
        !lnurl.toLowerCase().startsWith(lnurlwPrefix) &&
        !lnurl.toLowerCase().startsWith(lnurlpPrefix) &&
        (lnurl.toLowerCase().startsWith(lightingPrefix) ||
          lnurl.toLowerCase().startsWith(lnurlEncodingPrefix))
      ) {
        lnurl = lnurl.toLowerCase();
      } else if (
        !lnurl.startsWith(lnurlwPrefix) &&
        !lnurl.startsWith(lnurlpPrefix)
      ) {
        setError({ status: "ERROR", reason: t("errors.invalidLightningTag") });
        return;
      }

      if (lnurl.startsWith(lightingPrefix)) {
        lnurl = lnurl.slice(lightingPrefix.length);
      }

      if (lnurl.startsWith(lnurlwPrefix)) {
        lnurl = lnurl.replace("lnurlw", "https");
      } else if (lnurl.startsWith(lnurlpPrefix)) {
        lnurl = lnurl.replace("lnurlp", "https");
      }

      let cardData;
      if (lnurl.startsWith(lnurlEncodingPrefix)) {
        const { words: dataPart } = bech32.decode(lnurl, 2000);
        const requestByteArray = bech32.fromWords(dataPart);
        cardData = Buffer.from(requestByteArray).toString();
      } else {
        cardData = lnurl;
      }

      try {
        const { data: cardDataResponse } = await axios.get<InvoiceResponse>(cardData);
        if (cardDataResponse.tag === 'withdrawRequest') {
          return cardDataResponse;
        } else if (cardDataResponse.tag === 'payRequest') {
          return cardDataResponse;
        } else if (cardDataResponse.status === "ERROR") {
          setError(cardDataResponse);
        }
      } catch (e) {
        if (isApiError(e)) {
          const reason = e.response.data.reason;
          setError({
            reason: typeof reason === "string" ? reason : reason.detail,
            status: "ERROR"
          });
        }
      }
    }, [t]
  );

  const payInvoice = useCallback(async (cb: string, k1: string, lightningInvoice: string, pin?: string) => {
    try {
      const { data: callbackResponseData } = await axios.get<{
        reason: string;
        status: "OK" | "ERROR";
      }>(cb, {
        params: {
          k1,
          pr: lightningInvoice,
          pin
        }
      });

      if (callbackResponseData.status === "ERROR") {
        setError({
          reason: callbackResponseData.reason,
          status: "ERROR"
        });
      } else {
        setIsPaySuccess(true);
      }
    } catch (e) {
      if (isApiError(e)) {
        const reason = e.response.data.reason;
        setError({
          reason: typeof reason === "string" ? reason : reason.detail,
          status: "ERROR"
        });
      }
    }
  }, []);

  const requestInvoice = useCallback(async (lnurlp: LnurlPData, amount: number) => {
    if(lnurlp.minSendable / 1000 > amount) {
      setError({
        reason: "Amount is lower than min sendable. Can't make payRequest.",
        status: "ERROR"
      });
      return;
    } else if(lnurlp.maxSendable / 1000 < amount) {
      setError({
        reason: "Amount is higher than max sendable. Can't make payRequest.",
        status: "ERROR"
      });
      return;
    }

    if (!error) {
      const { data: payLinkResponseData } = await axios.get<{ pr: string }>(
        lnurlp.callback, {
          params: {
            amount: amount * 1000
          }
        });
      return payLinkResponseData.pr;
    }
  }, [error]);

  return { callLnurl, payInvoice, requestInvoice, isPaySuccess, error };
};