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
// @ts-ignore
import AnimatedLinearGradient from "react-native-animated-linear-gradient";
import { colors as gradiantColors } from "./gradient-config";

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
    payInvoice,
    isPaySuccess,
    error
  } = useInvoiceCallback();

  const [amount, setAmount] = useState<number>();

  const [pin, setPin] = useState<string>();
  const [pinRequired, setPinRequired] = useState<boolean>(false);
  const [withdraw, setWithdraw] = useState<LnurlWData>();
  const [lnurlw, setLnurlw] = useState<LnurlWData>();
  const [lnurlp, setLnurlp] = useState<LnurlPData>();

  const [loadingWallet, setLoadingWallet] = useState<boolean>(true);
  const [payingInvoice, setPayingInvoice] = useState<boolean>(false);

  useEffect(() => {
    setBackgroundColor(colors.primary, 0);
    void setupNfc();
  }, []);

  // Read NFC Message
  useEffect(() => {
    if (isNfcAvailable && !isNfcNeedsTap) {
      setLoadingWallet(true);
      void readingNfcLoop();
    }
  }, [readingNfcLoop, isNfcAvailable, isNfcNeedsTap]);

  // Fetch data from the URL in the NFC Message
  useEffect(() => {
    if (nfcMessage) {
      callLnurl(nfcMessage).then(wResponse => {
        if(wResponse && wResponse.tag === 'withdrawRequest') {
          setLnurlw(wResponse);
          setLoadingWallet(false);
          if (!lnurlp && wResponse.payLink) {
            callLnurl(wResponse.payLink).then(pResponse => {
              if(pResponse && pResponse.tag === 'payRequest') {
                setLnurlp(pResponse);
              }
            });
          }
        }
      });
    }
  }, [nfcMessage]);

  // Get LNURLw and LNURLp
  useEffect(() => {
    if (withdraw && lnurlp && amount && !isNfcScanning) {
      requestInvoice(lnurlp, amount).then(pr => {
        setLnurlp(undefined);
        if(pr) {
          void payInvoice(withdraw.callback, withdraw.k1, pr, pin).then(()=>{
            setWithdraw(undefined);
            setPayingInvoice(false);
          });
        }
      });
    }
  }, [lnurlw, lnurlp, withdraw, amount, isNfcScanning]);

  const onPay = useCallback(() => {
    if (lnurlw && amount) {
      setPin(undefined);

      const isPinRequired = lnurlw.pinLimit ? lnurlw.pinLimit <= amount : false;
      setPinRequired(isPinRequired);
      if(!isPinRequired) {
        setPayingInvoice(true);
        setWithdraw(lnurlw);
        setLnurlw(undefined);
        setLnurlp(undefined);
        void setupNfc();
      }
    }
  }, [setupNfc, lnurlw, amount]);

  const onPin = useCallback((input: string) => {
    setPin(input);
    setPinRequired(false);

    setPayingInvoice(true);
    setWithdraw(lnurlw);
    setLnurlw(undefined);
    setLnurlp(undefined);

    void setupNfc();
  }, [setupNfc, lnurlw]);

  const onReceive = useCallback(() => {
    if (lnurlp && amount) {
      requestInvoice(lnurlp, amount).then(pr => {
        navigate(`/invoice`, {
          state: { lightningInvoice: pr }
        });
      });
    }
  }, [requestInvoice, navigate, lnurlp, amount]);

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
      setPinRequired(false);
      setWithdraw(undefined);
      void setupNfc();
    }
  }, [error]);

  return (
    <>
    {(loadingWallet || payingInvoice) && <AnimatedLinearGradient customColors={gradiantColors} speed={6000} />}
    <S.WalletPageContainer>
      {!isPaySuccess && !isNfcScanning && !loadingWallet && !payingInvoice ? (
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
              if (value && value !== "") {
                setAmount(parseInt(value));
              } else if (value !== undefined){
                setAmount(0);
              }
            }} pinMode={false}/>) : null}
        </S.WalletComponentStack>
      ) : null}
      {isPaySuccess ? (
        <S.CenterComponentStack gapSize={32}>
          <S.SuccessLottie
            autoPlay
            loop={false}
            source={require("@assets/animations/success.json")}
            size={180}
          />
          <Text h3 color={colors.white} weight={700}>
            {t("received")} {amount} sats
          </Text>
          <Button
            icon={faHome}
            size="large"
            title={t("returnToHome")}
            onPress={onReturnToHome}
          />
        </S.CenterComponentStack>
      ) : pinRequired && !isNfcScanning ? (
        <PinPad onPinEntered={onPin} pinMode={true}/>
      ) : isNfcScanning || withdraw ? (
        <S.CenterComponentStack>
          <Loader
            reason={t(!isPaySuccess && (lnurlw || lnurlp || withdraw) ? (isNfcScanning ? "tapYourBoltCardReceive" : "sendingPayment") : "tapYourBoltCard")}
          />
        </S.CenterComponentStack>
      ) : null}
    </S.WalletPageContainer>
    </>
  );
};