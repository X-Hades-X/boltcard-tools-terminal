import { useTranslation } from "react-i18next";
import { useNavigate } from "@components/Router";
import {
  PinPad,
  Loader,
  View,
  Text,
  Button
} from "@components";
import {
  faReply,
  faShare,
  faHome
} from "@fortawesome/free-solid-svg-icons";
import { useNfc, useInvoiceCallback } from "@hooks";
import { ThemeContext } from "@config";
import { useCallback, useContext, useEffect, useState } from "react";
import { Vibration } from "react-native";
import { useTheme } from "styled-components";
import * as S from "./styled";
import { LnurlPData, LnurlWData } from "@hooks/useInvoiceCallback";

export const Wallet = () => {
  const { t } = useTranslation(undefined, { keyPrefix: "screens.wallet" });
  const navigate = useNavigate();
  const { setBackgroundColor } = useContext(ThemeContext);
  const { colors } = useTheme();
  const {
    nfcMessage,
    setupNfc,
    readingNfcLoop,
    isNfcAvailable,
    isNfcScanning,
    isNfcNeedsTap,
  } = useNfc();
  const {
    callLnurl,
    requestInvoice,
    isPaySuccess,
    lnurlResponse,
    pr,
    error
  } = useInvoiceCallback();

  const [amount, setAmount] = useState<number>();
  const [lnurlw, setLnurlw] = useState<LnurlWData>();
  const [lnurlp, setLnurlp] = useState<LnurlPData>();

  const [pinRequired, setPinRequired] = useState<boolean>(false);

  useEffect(() => {
    void setupNfc();
  }, []);

  // Read NFC Message
  useEffect(() => {
    if (isNfcAvailable && !isNfcNeedsTap) {
      void readingNfcLoop();
    }
  }, [readingNfcLoop, isNfcAvailable, isNfcNeedsTap]);

  // Fetch data from the URL in the NFC Message
  useEffect(() => {
    if (nfcMessage) {
      void callLnurl(nfcMessage);
    }
  }, [nfcMessage]);

  // Get LNURLw and LNURLp
  useEffect(() => {
    if (lnurlResponse) {
      if (lnurlResponse.tag === 'withdrawRequest') {
        setLnurlw(lnurlResponse);
        if (!lnurlp && lnurlResponse.payLink) {
          void callLnurl(lnurlResponse.payLink);
        }
      } else if (lnurlResponse.tag === 'payRequest') {
        setLnurlp(lnurlResponse);
      }
    }
  }, [lnurlResponse]);

  const onPay = useCallback(() => {
    if (lnurlw && amount) {
      setPinRequired(lnurlw.pinLimit ? lnurlw.pinLimit <= amount : false);
    }
  }, [lnurlw, amount]);

  const onPin = useCallback((pin: string) => {
    console.log("set pin: " + pin);
    setPinRequired(false);
    // TODO handle LNURLw in Invoice screen?
  }, []);

  const onReceive = useCallback(() => {
    if (lnurlp && amount) {
      void requestInvoice(lnurlp, amount);
      setLnurlp(undefined);
    }
  }, [lnurlp, amount]);

  useEffect(() => {
    if (pr) {
      navigate(`/invoice`, {
        state: { lightningInvoice: pr }
      });
    }
  }, [pr]);

  const onReturnToHome = useCallback(() => {
    navigate("/");
    setBackgroundColor(colors.primary, 0);
  }, [colors.primary, navigate, setBackgroundColor]);

  useEffect(() => {
    if (isPaySuccess) {
      Vibration.vibrate(50);
      setBackgroundColor(colors.success, 500);
    }
  }, [isPaySuccess]);

  useEffect(() => {
    if (error) {
      setLnurlp(undefined);
      setLnurlw(undefined);
    }
  }, [error]);

  return (
    <S.WalletPageContainer>
      {!isNfcScanning && (lnurlp || lnurlw) ? (
        <S.WalletComponentStack>
          <S.TitleText h2>
            {t("title")}
          </S.TitleText>
          <S.AmountText h1>
            {amount}
          </S.AmountText>
          <S.WalletButtonWrapper>
            <View>
              <S.WalletButton
                icon={faReply}
                size="large"
                title={t("receive")}
                onPress={onReceive}
                disabled={
                  !amount ||
                  !lnurlp ||
                  lnurlp.minSendable / 1000 > amount ||
                  lnurlp.maxSendable / 1000 < amount
                }
              />
              {lnurlp && !pinRequired ? (
                <View>
                  <S.InfoText>
                    Min: { lnurlp.minSendable / 1000 }
                  </S.InfoText>
                  <S.InfoText>
                    Max: { lnurlp.maxSendable / 1000 }
                  </S.InfoText>
                </View>
              ) : null}
            </View>

            <View>
              <S.WalletButton
                icon={faShare}
                isIconRight={true}
                size="large"
                title={t("send")}
                onPress={onPay}
                disabled={
                  !amount ||
                  !lnurlw ||
                  lnurlw.maxWithdrawable / 1000 < amount
                }
              />
              {lnurlw && !pinRequired ? (
                <View>
                  <S.InfoText>
                    PIN Limit: { lnurlw.pinLimit ? lnurlw.pinLimit : "-"}
                  </S.InfoText>
                  <S.InfoText>
                    Max: { lnurlw.maxWithdrawable / 1000 }
                  </S.InfoText>
                </View>
              ) : null}
            </View>
          </S.WalletButtonWrapper>
          {!pinRequired ? (
            <PinPad onPinEntered={(value)=> {
              if (value && value != "") {
                setAmount(parseInt(value));
              } else {
                setAmount(0);
              }
            }} pinMode={false}/>) : null}
        </S.WalletComponentStack>
      ) : null}
      {isPaySuccess ? (
        <S.SuccessComponentStack gapSize={32}>
          <S.SuccessLottie
            autoPlay
            loop={false}
            source={require("@assets/animations/success.json")}
            size={180}
          />
          <Text h3 color={colors.white} weight={700}>
            {t("paid")}
          </Text>
          <Button
            icon={faHome}
            size="large"
            title={t("returnToHome")}
            onPress={onReturnToHome}
          />
        </S.SuccessComponentStack>
      ) : pinRequired && !isNfcScanning ? (
        <PinPad onPinEntered={onPin} pinMode={true}/>
      ) : isNfcScanning ? (
        <Loader
          reason={t(!isPaySuccess && (lnurlw || lnurlp) ? "payingInvoice" : "tapYourBoltCard")}
        />
      ) : null}
    </S.WalletPageContainer>
  );
};