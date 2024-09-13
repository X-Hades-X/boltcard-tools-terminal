import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "@components/Router";
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

type LightningRequest = {
    lightningRequest: string;
};

export const Wallet = () => {
  const { t } = useTranslation(undefined, { keyPrefix: "screens.wallet" });
  const location = useLocation<LightningRequest>();
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

  const {
    lightningRequest
  } = location.state || {};

  useEffect(() => {
    setBackgroundColor(colors.primary, 0);
    if(!lightningRequest) {
      void setupNfc();
    }
  }, [lightningRequest]);

  // Read NFC Message
  useEffect(() => {
    if (isNfcAvailable && !isNfcNeedsTap) {
      setLoadingWallet(true);
      void readingNfcLoop();
    }
  }, [readingNfcLoop, isNfcAvailable, isNfcNeedsTap]);

  // Fetch data from the URL in the NFC Message
  useEffect(() => {
    setLoadingWallet(true);
    const request = nfcMessage ? nfcMessage : lightningRequest;
    if (request) {
      callLnurl(request).then(response => {
        if(response) {
          setLoadingWallet(false);
          if(response.tag === 'withdrawRequest') {
            setLnurlw(response);
            if (!lnurlp && response.payLink) {
              callLnurl(response.payLink).then(payResponse => {
                if(payResponse && payResponse.tag === 'payRequest') {
                  setLnurlp(payResponse);
                }
              });
            }
          } else if (response.tag === 'payRequest') {
            setLnurlp(response);
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
      ) : isNfcScanning || withdraw || lightningRequest ? (
        <S.CenterComponentStack>
          <Loader
            reason={t(!isPaySuccess && (lnurlw || lnurlp || withdraw || lightningRequest) ?
              (isNfcScanning ? "tapYourBoltCardReceive" : (withdraw ? "sendingPayment" : "loadingWallet")) :
              "tapYourBoltCard")}
          />
        </S.CenterComponentStack>
      ) : null}
    </S.WalletPageContainer>
    </>
  );
};