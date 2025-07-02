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
import { useNfc, useInvoiceCallback, useRates } from "@hooks";
import { XOR } from "ts-essentials";
import { ThemeContext } from "@config";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Dimensions, Vibration } from "react-native";
import { useTheme } from "styled-components";
import { ListItem } from "@components/ItemsList/components/ListItem";
import { faBitcoin } from "@fortawesome/free-brands-svg-icons";
import axios from "axios";
import * as S from "./styled";
import { LnurlPData, LnurlWData } from "@hooks/useInvoiceCallback";
import { getNumberWithSpaces } from "@utils/numberWithSpaces";
import QRCode from "react-native-qrcode-svg";
import { Clipboard } from "@utils";
import { useToast } from "react-native-toast-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

type InvoiceState = XOR<
  {
    lightningInvoice?: string;
    fiat?: string;
    fiatAmount?: number;
    withdrawInvoice?: LnurlWData;
    withdrawAmount?: number;
    withdrawPin?: string;
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

const windowWidth = Dimensions.get("window").width;

export const Invoice = () => {
  const toast = useToast();
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
    isNfcNeedsTap
  } = useNfc();
  const {
    callLnurl,
    requestInvoice,
    payInvoice,
    isPaySuccess,
    error
  } = useInvoiceCallback();
  const {
    rates,
    getRate
  } = useRates();

  const {
    lightningInvoice: stateLightningInvoice,
    withdrawInvoice: stateWithdrawInvoice,
    withdrawAmount,
    withdrawPin,
    bitcoinAddress,
    amount,
    label,
    message
  } = location.state || {};

  const [swapLightningInvoice, setSwapLightningInvoice] = useState<string>();

  const lightningInvoice = useMemo(
    () => stateLightningInvoice || swapLightningInvoice,
    [stateLightningInvoice, swapLightningInvoice]
  );

  const withdrawInvoice = useMemo(
    () => stateWithdrawInvoice,
    [stateWithdrawInvoice]
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
  const [lnurlp, setLnurlp] = useState<LnurlPData>();

  const [fiat, setFiat] = useState<string>();
  const [fiatAmount, setFiatAmount] = useState<number>();

  // TODO handle ln invoice without satoshis (Phoenix Wallet); backend needs to be able to handle it too
  const { satoshis } = decodedInvoice || {};

  useEffect(() => {
    if (decodedInvoice && !satoshis) {
      toast.show(t("errors.noAmountInvoice"), { type: "error" });
    }
  }, [decodedInvoice, satoshis]);

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
    if (isNfcAvailable && !isNfcNeedsTap && (lightningInvoice || withdrawInvoice)) {
      void readingNfcLoop();
    }
  }, [readingNfcLoop, isNfcAvailable, isNfcNeedsTap, lightningInvoice]);

  // Fetch data from the URL in the NFC Message
  useEffect(() => {
    if (nfcMessage) {
      setPinRequiredChecked(false);
      callLnurl(nfcMessage).then(response => {
        if (response) {
          if (response.tag === "withdrawRequest") {
            if (!withdrawInvoice) {
              setLnurlw(response);
            }

            if (!lnurlp && response.payLink) {
              callLnurl(response.payLink).then(payResponse => {
                if (payResponse && payResponse.tag === "payRequest") {
                  setLnurlp(payResponse);
                }
              });
            }
          } else if (response.tag === "payRequest") {
            setLnurlp(response);
          }
        }
      });
    }
  }, [nfcMessage]);

  useEffect(() => {
    if (withdrawInvoice && lnurlp && withdrawAmount && !isNfcScanning) {
      requestInvoice(lnurlp, withdrawAmount).then(pr => {
        setLnurlp(undefined);
        if (pr) {
          void payInvoice(withdrawInvoice.callback, withdrawInvoice.k1, pr, withdrawPin);
        }
      });
    }
  }, [lnurlp, withdrawInvoice, withdrawAmount, isNfcScanning, withdrawPin]);

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
      }
    }
  }, [lightningInvoice, lnurlw, satoshis, isPaySuccess]);

  // Pay invoice after pin requirement is checked and if needed entered by the user
  useEffect(() => {
    if (!error && lightningInvoice && lnurlw && lnurlw.k1 && pinRequiredChecked && (pin || !pinRequired)) {
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

  useEffect(() => {
    if (rates) {
      void loadRate();
    }
  }, [amount, satoshis, withdrawAmount, rates]);

  const getFiatAmount = useCallback((currentRate: { label: string, value: number }, sats?: number)=>{
    return sats ? Math.ceil(sats / currentRate.value * 100) / 100 : undefined
  }, []);

  const loadRate = useCallback(async () => {
    const storedRate = await AsyncStorage.getItem("@rate");
    if (storedRate) {
      const currentRate = getRate(storedRate);
      if (currentRate.label !== "SAT" && currentRate.label !== "BTC") {
        setFiat(currentRate.label);
        setFiatAmount(getFiatAmount(currentRate, satoshis ? satoshis : amount ? amount : withdrawAmount));
      }
    }
  }, [satoshis, amount, withdrawAmount, getRate, getFiatAmount]);

  const onCopyToClipboard = useCallback(() => {
    if (lightningInvoice || swapLightningInvoice) {
      Clipboard.setString((lightningInvoice ? lightningInvoice : swapLightningInvoice) as string);
      toast.show(t("copiedToClipboard"), { type: "success" });
    }
  }, [lightningInvoice, swapLightningInvoice, t, toast]);

  const onGetSwapQuote = useCallback(async () => {
    // TODO this either broke somehow or doesn't work
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
      } catch (e) {
        // TODO handle error
      }
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
        ? !(decodedInvoice || withdrawInvoice)
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
            : !(pinRequired && !pinConfirmed)
              ? {
                footerButton: {
                  type: "bitcoin",
                  title: t("returnToHome"),
                  onPress: () => {
                    void onReturnToHome();
                  }
                }
              } : {}
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
                stateLightningInvoice || withdrawInvoice
                  ? { icon: faBolt, color: colors.lightning }
                  : { icon: faBitcoin, color: colors.bitcoin }
              }
              value={t(stateLightningInvoice ? "lightning" : withdrawInvoice ? "lightningTopup" : "onchain")}
              valueColor={
                stateLightningInvoice || withdrawInvoice ? colors.lightning : colors.bitcoin
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

            {!(stateLightningInvoice || withdrawInvoice) && (
              <S.ListItemWrapper>
                <Text h4 weight={600} color={colors.greyLight}>
                  {t("scheduledSwapIntro")}
                </Text>
              </S.ListItemWrapper>
            )}
            {!(stateLightningInvoice || withdrawInvoice) && (
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
            {!(stateLightningInvoice || withdrawInvoice) && (
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
            {withdrawAmount && (
              <ListItem
                title={t("withdrawAmount")}
                titleColor={colors.lightning}
                icon={faBolt}
                value={`${getNumberWithSpaces(withdrawAmount)} sats`}
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
      {isPaySuccess && (satoshis || withdrawAmount) ? (
        <S.SuccessComponentStack gapSize={32}>
          <S.SuccessLottie
            autoPlay
            loop={false}
            source={require("@assets/animations/success.json")}
            size={180}
          />
          <Text h3 color={colors.white} weight={700}>
            {withdrawInvoice ? t("received") : t("paid")} {fiat && fiatAmount ?
            `${getNumberWithSpaces(fiatAmount, true)} ${fiat}\n(${satoshis ? getNumberWithSpaces(satoshis) : withdrawAmount ? getNumberWithSpaces(withdrawAmount) : 0} SAT)` :
            `${satoshis ? getNumberWithSpaces(satoshis) : withdrawAmount ? getNumberWithSpaces(withdrawAmount) : 0} SAT`}
          </Text>
          <Button
            icon={faHome}
            size="large"
            title={t("returnToHome")}
            onPress={onReturnToHome}
          />
        </S.SuccessComponentStack>
      ) : pinRequired && !pinConfirmed ? (
        <PinPad onPinEntered={(value) => {
          setPin(value);
          setPinConfirmed(true);
        }}
                onClose={() => {
                  setPinRequired(false);
                  void setupNfc();
                }} />
      ) : (lightningInvoice || swapLightningInvoice || withdrawInvoice) ? (
        <S.QrCodeComponentStack>
          <Loader
            reason={t(!isNfcScanning ? "payingInvoice" : (withdrawInvoice ? "topupCard" : "tapYourBoltCard"))}
          />
          {(lightningInvoice || swapLightningInvoice) && (
            <S.QrCodeComponentStack onTouchEnd={() => onCopyToClipboard()}>
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
            </S.QrCodeComponentStack>)}
        </S.QrCodeComponentStack>
      ) : ""}
    </S.InvoicePageContainer>
  );
};
