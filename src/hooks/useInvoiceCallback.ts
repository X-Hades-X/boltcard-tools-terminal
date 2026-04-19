import { useCallback, useEffect, useState } from "react";
import { useToast } from "react-native-toast-notifications";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { decodeLnurl, isApiError } from "@utils";
import { XOR } from "ts-essentials";

// Network-side timeout (ms) for any LNURL / callback HTTP request. Without
// this, a slow or unreachable LN server leaves the UI stuck on "Loading
// wallet" indefinitely.
const HTTP_TIMEOUT_MS = 15_000;

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

      const decoded = decodeLnurl(lnurl);
      if (decoded.kind === "invalid") {
        setError({ status: "ERROR", reason: t("errors.invalidLightningTag") });
        return;
      }

      try {
        const { data: cardDataResponse } = await axios.get<InvoiceResponse>(
          decoded.url,
          { timeout: HTTP_TIMEOUT_MS }
        );
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
        } else {
          setError({
            reason: t("errors.unknown"),
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
        },
        timeout: HTTP_TIMEOUT_MS
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
      } else {
        setError({
          reason: t("errors.unknown"),
          status: "ERROR"
        });
      }
    }
  }, [t]);

  const requestInvoice = useCallback(async (lnurlp: LnurlPData, amount: number) => {
    if (lnurlp.minSendable / 1000 > amount) {
      setError({
        reason: "Amount is lower than min sendable. Can't make payRequest.",
        status: "ERROR"
      });
      return;
    } else if (lnurlp.maxSendable / 1000 < amount) {
      setError({
        reason: "Amount is higher than max sendable. Can't make payRequest.",
        status: "ERROR"
      });
      return;
    }

    try {
      const { data: payLinkResponseData } = await axios.get<{ pr: string }>(
        lnurlp.callback,
        {
          params: { amount: amount * 1000 },
          timeout: HTTP_TIMEOUT_MS
        }
      );
      return payLinkResponseData.pr;
    } catch (e) {
      if (isApiError(e)) {
        const reason = e.response.data.reason;
        setError({
          reason: typeof reason === "string" ? reason : reason.detail,
          status: "ERROR"
        });
      } else {
        setError({
          reason: t("errors.unknown"),
          status: "ERROR"
        });
      }
    }
  }, [t]);

  return { callLnurl, payInvoice, requestInvoice, isPaySuccess, error };
};