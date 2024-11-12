import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "@components/Router";
import { UTCDate } from "@date-fns/utc";
import {
  Button,
  CheckboxField,
  ComponentStack,
  Loader,
  Text,
  PinPad
} from "@components";
import {
  faBolt,
  faClock,
  faCommentDots,
  faHome,
  faMoneyBill,
  faNetworkWired,
  faPen,
  faPercentage
} from "@fortawesome/free-solid-svg-icons";
import addDays from "date-fns/addDays";
import intlFormat from "date-fns/intlFormat";
import bolt11, { PaymentRequestObject } from "bolt11";
import { useNfc, useInvoiceCallback } from "@hooks";
import { XOR } from "ts-essentials";
import { ThemeContext } from "@config";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Dimensions, Vibration } from "react-native";
import { useTheme } from "styled-components";
import { ListItem } from "@components/ItemsList/components/ListItem";
import { faBitcoin } from "@fortawesome/free-brands-svg-icons";
import axios from "axios";
import * as S from "./styled";
import { LnurlWData } from "@hooks/useInvoiceCallback";
import { getNumberWithSpaces } from "@utils/numberWithSpaces";
import QRCode from "react-native-qrcode-svg";

type InvoiceState = XOR<
  {
    lightningInvoice: string;
    fiat?: string;
    fiatAmount?: number;
  },
  {
    bitcoinAddress: string;
    amount: number;
    label?: string;
    message?: string;
    fiat?: string;
    fiatAmount?: number;
  }
>;

const windowWidth = Dimensions.get('window').width;

export const Invoice = () => {
  const { t } = useTranslation(undefined, { keyPrefix: "screens.invoice" });
  const navigate = useNavigate();
  const { setBackgroundColor } = useContext(ThemeContext);
  const location = useLocation<InvoiceState>();
  const { colors } = useTheme();
  const {
    nfcMessage,
    setupNfc,
    readingNfcLoop,
    stopNfc,
    isNfcAvailable,
    isNfcScanning,
    isNfcNeedsTap,
  } = useNfc();
  const {
    callLnurl,
    payInvoice,
    isPaySuccess,
    error
  } = useInvoiceCallback();

  const {
    lightningInvoice: stateLightningInvoice,
    bitcoinAddress,
    amount,
    label,
    message,
    fiat,
    fiatAmount
  } = location.state || {};

  const [swapLightningInvoice, setSwapLightningInvoice] = useState<string>();

  const lightningInvoice = useMemo(
    () => stateLightningInvoice || swapLightningInvoice,
    [stateLightningInvoice, swapLightningInvoice]
  );

  const [isScheduledSwap, setIsScheduledSwap] = useState(false);
  const [isSwapLoading, setIsSwapLoading] = useState<boolean>();
  const [swapFees, setSwapFees] = useState<number>();
  const [decodedInvoice, setDecodedInvoice] = useState<PaymentRequestObject>();

  const [pin, setPin] = useState<string>();
  const [pinConfirmed, setPinConfirmed] = useState<boolean>(false);
  const [pinRequiredChecked, setPinRequiredChecked] = useState<boolean>(false);
  const [pinRequired, setPinRequired] = useState<boolean>(false);
  const [lnurlw, setLnurlw] = useState<LnurlWData>();

  const { satoshis } = decodedInvoice || {};

  useEffect(() => {
    void setupNfc();
  }, []);

  useEffect(() => {
    if (lightningInvoice) {
      setDecodedInvoice(bolt11.decode(lightningInvoice));
    }
  }, [lightningInvoice]);

  // Read NFC Message
  useEffect(() => {
    if (isNfcAvailable && !isNfcNeedsTap && lightningInvoice) {
      void readingNfcLoop();
    }
  }, [readingNfcLoop, isNfcAvailable, isNfcNeedsTap, lightningInvoice]);

  // Fetch data from the URL in the NFC Message
  useEffect(() => {
    if (nfcMessage) {
      setPinRequiredChecked(false);
      callLnurl(nfcMessage).then(response => {
        if(response && response.tag === 'withdrawRequest') {
          setLnurlw(response);
        }
      });
    }
  }, [nfcMessage]);

  // Check if PIN is needed
  useEffect(() => {
    if (!error && !isPaySuccess && !pinRequiredChecked && satoshis) {
      if (lnurlw) {
        if (lnurlw.pinLimit !== undefined) {
            //if the card has pin enabled
            //check the amount didn't exceed the limit
            const limitSat = lnurlw.pinLimit;
            if (limitSat <= satoshis) {
              setPinRequired(true);
            }
        } else {
          setPinRequired(false);
        }
        setPinRequiredChecked(true);
      } else {
        // TODO copied from useNfc during refactor; probably going somewhere else
        // const { data: cardRequest } = await axios.get<{ payLink?: string }>(
        //   lnHttpsRequest
        // );
        // if (!cardRequest.payLink) throw getError("Invalid tag. No payLink");
        // let finalUrl = cardRequest.payLink;
        // if (finalUrl.startsWith("lnurlp://")) {
        //   finalUrl = finalUrl.replace("lnurlp", "https");
        // }
        // const { data: finalUrlRequest } = await axios.get<{
        //   tag?: string;
        //   callback?: string;
        //   minSendable?: number;
        //   maxSendable?: number;
        //   commentAllowed?: number;
        // }>(finalUrl);
        // if (finalUrlRequest.tag !== "payRequest")
        //   throw getError("Invalid tag. tag is not payRequest");
        // if (!finalUrlRequest.callback)
        //   throw getError("Invalid tag. No callback");
        // if (
        //   !finalUrlRequest.minSendable ||
        //   finalUrlRequest.minSendable / 1000 > amount
        // )
        //   throw getError("Invalid tag. minSendable undefined or too high");
        // if (
        //   !finalUrlRequest.maxSendable ||
        //   finalUrlRequest.maxSendable / 1000 < amount
        // )
        //   throw getError("Invalid tag. maxSendable undefined or too low");
        // const fullTitle = `${title || ""}${
        //   description ? `- ${description}` : ""
        // }`;
        // const { data: callbackRequest } = await axios.get<{ pr?: string }>(
        //   `${finalUrlRequest.callback}?amount=${(amount || 0) * 1000}${
        //     (finalUrlRequest.commentAllowed || 0) >= fullTitle.length
        //       ? `&comment=${fullTitle}`
        //       : ""
        //   }`
        // );
        // if (!callbackRequest.pr) throw getError("Invalid tag. No pr defined");
        // const { data: withdrawCallbackRequest } = await axios.get<{
        //   status?: string;
        // }>(withdrawCallbackData.callback, {
        //   params: {
        //     pr: callbackRequest.pr,
        //     k1: withdrawCallbackData.k1
        //   }
        // });
        // if (withdrawCallbackRequest.status !== "OK")
        //   throw getError("Impossible to top-up card.");
        // setIsPaid(true);
        // debitCardData = withdrawCallbackRequest;
      }
    }
  }, [lightningInvoice, lnurlw, satoshis, isPaySuccess]);

  // Pay invoice after pin requirement is checked and if needed entered by the user
  useEffect(() => {
    if(!error && lightningInvoice && lnurlw && lnurlw.k1 && pinRequiredChecked && (pin || !pinRequired)){
      void payInvoice(lnurlw.callback, lnurlw.k1, lightningInvoice, pin);
    }
  }, [lightningInvoice, lnurlw, pin, pinRequiredChecked, pinRequired]);

  // Party!!!
  useEffect(() => {
    if (isPaySuccess) {
      Vibration.vibrate(50);
      setBackgroundColor(colors.success, 500);
    }
  }, [isPaySuccess]);

  // :( reset and try again
  useEffect(() => {
    if (error) {
      setPin(undefined);
      setPinConfirmed(false);
      setPinRequired(false);
      void setupNfc();
    }
  }, [error]);

  const onGetSwapQuote = useCallback(async () => {
    if (amount) {
      setIsSwapLoading(true);
      try {
        const { data } = await axios.get<{
          callback: string;
          minSendable: number;
        }>(
          `https://swiss-bitcoin-pay.ch/.well-known/lnurlp/${bitcoinAddress},amount=${amount},scheduled=${
            isScheduledSwap ? "true" : "false"
          }`
        );
        const { data: callbackData } = await axios.get<{
          pr: string;
        }>(data.callback, { params: { amount: data.minSendable } });
        setSwapLightningInvoice(callbackData.pr);
        setSwapFees(data.minSendable / 1000 - amount);
      } catch (e) {}
      setIsSwapLoading(false);
    }
  }, [amount, bitcoinAddress, isScheduledSwap]);

  const onReturnToHome = useCallback(() => {
    navigate("/");
    setBackgroundColor(colors.primary, 0);
  }, [colors.primary, navigate, setBackgroundColor]);

  const finalLabel = useMemo(
    () =>
      (stateLightningInvoice &&
        decodedInvoice?.tags
          .find((tag) => tag.tagName === "description")
          ?.data.toString()) ||
      label,
    [decodedInvoice?.tags, label, stateLightningInvoice]
  );

  return (
    <S.InvoicePageContainer
      {...(!isPaySuccess
        ? !decodedInvoice
          ? {
              footerButton: {
                type: "bitcoin",
                title: t("requestSwap"),
                onPress: onGetSwapQuote,
                isLoading: isSwapLoading
              }
            }
          : isNfcNeedsTap && lightningInvoice
          ? {
              footerButton: {
                type: "bitcoin",
                title: t("startScanning"),
                onPress: () => {
                  void readingNfcLoop();
                }
              }
            }
          : {}
        : {})}
      isContentVerticallyCentered={isPaySuccess}
    >
      <ComponentStack>
        {!isPaySuccess && (
          <ComponentStack gapSize={2} gapColor={colors.primaryLight}>
            <ListItem
              title={t("network")}
              icon={faNetworkWired}
              valuePrefixIcon={
                stateLightningInvoice
                  ? { icon: faBolt, color: colors.lightning }
                  : { icon: faBitcoin, color: colors.bitcoin }
              }
              value={stateLightningInvoice ? "Lightning" : "Onchain"}
              valueColor={
                stateLightningInvoice ? colors.lightning : colors.bitcoin
              }
            />
            {finalLabel && (
              <ListItem title={t("label")} icon={faPen} value={finalLabel} />
            )}
            {message && (
              <ListItem
                title={t("message")}
                icon={faCommentDots}
                value={message}
              />
            )}

            {!stateLightningInvoice && (
              <S.ListItemWrapper>
                <Text h4 weight={600} color={colors.greyLight}>
                  {t("scheduledSwapIntro")}
                </Text>
              </S.ListItemWrapper>
            )}
            {!stateLightningInvoice && (
              <ListItem
                title={t("nextBatch")}
                icon={faClock}
                value={intlFormat(
                  addDays(new UTCDate().setUTCHours(0, 0, 0, 0), 1),
                  {
                    year: "2-digit",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit"
                  }
                )}
              />
            )}
            {!stateLightningInvoice && (
              <S.ListItemWrapper>
                <CheckboxField
                  label={t("scheduleForNextBatch")}
                  value={isScheduledSwap}
                  onChange={() => {
                    stopNfc();
                    setSwapFees(undefined);
                    setDecodedInvoice(undefined);
                    setIsScheduledSwap(!isScheduledSwap);
                  }}
                />
              </S.ListItemWrapper>
            )}
            {amount && (
              <ListItem
                title={t("amountReceived")}
                icon={faMoneyBill}
                value={`${getNumberWithSpaces(amount)} sats`}
              />
            )}
            {swapFees && (
              <ListItem
                title={t("fees")}
                icon={faPercentage}
                value={`${getNumberWithSpaces(swapFees)} sats`}
              />
            )}
            {satoshis && (
              <ListItem
                title={t("invoiceAmount")}
                titleColor={colors.lightning}
                icon={faBolt}
                value={`${getNumberWithSpaces(satoshis)} sats`}
                valueColor={colors.lightning}
              />
            )}
            {fiat && fiatAmount && (
              <ListItem
                title={t("fiatAmount")}
                titleColor={colors.white}
                icon={faBolt}
                value={`${getNumberWithSpaces(fiatAmount, true)} ${fiat}`}
                valueColor={colors.white}
              />
            )}
          </ComponentStack>
        )}
      </ComponentStack>
      {isPaySuccess && satoshis ? (
        <S.SuccessComponentStack gapSize={32}>
          <S.SuccessLottie
            autoPlay
            loop={false}
            source={require("@assets/animations/success.json")}
            size={180}
          />
          <Text h3 color={colors.white} weight={700}>
            {t("paid")} {fiat && fiatAmount ? `${getNumberWithSpaces(fiatAmount, true)} ${fiat}\n(${getNumberWithSpaces(satoshis)} SAT)` : `${getNumberWithSpaces(satoshis)} SAT`}
          </Text>
          <Button
            icon={faHome}
            size="large"
            title={t("returnToHome")}
            onPress={onReturnToHome}
          />
        </S.SuccessComponentStack>
      ) : pinRequired && !pinConfirmed ? (
            <PinPad onPinEntered={(value) => {setPin(value); setPinConfirmed(true)}}/>
      ) : (lightningInvoice || swapLightningInvoice) ? (
        <S.QrCodeComponentStack>
          <Loader
            reason={t(!isNfcScanning ? "payingInvoice" : "tapYourBoltCard")}
          />
          <S.QrCodeText h4 weight={700}>
            {t("scanInvoice")}
          </S.QrCodeText>
          <QRCode
            size={windowWidth}
            quietZone={25}
            value={lightningInvoice ? lightningInvoice : swapLightningInvoice}
          />
          <S.QrCodeText h4 weight={700}>
            {t("scanInvoiceHint")}
          </S.QrCodeText>
        </S.QrCodeComponentStack>
      ):""}
    </S.InvoicePageContainer>
  );
};
