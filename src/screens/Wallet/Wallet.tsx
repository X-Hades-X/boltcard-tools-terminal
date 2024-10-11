import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "@components/Router";
import {
  PinPad,
  Loader,
  View,
  Button
} from "@components";
import {
  faReply,
  faShare,
  faHome
} from "@fortawesome/free-solid-svg-icons";
import { useNfc, useInvoiceCallback, useRates } from "@hooks";
import { ThemeContext } from "@config";
import { useCallback, useContext, useEffect, useState } from "react";
import { Vibration } from "react-native";
import { useTheme } from "styled-components";
import * as S from "./styled";
import { LnurlPData, LnurlWData } from "@hooks/useInvoiceCallback";
// @ts-ignore
import AnimatedLinearGradient from "react-native-animated-linear-gradient";
import { colors as gradiantColors } from "./gradient-config";
import { ItemProps } from "@components/Picker/Picker";

const numberWithSpaces = (nb: number) =>
  nb.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

type LightningRequest = {
    lightningRequest: string;
};

const COIN = 100000000;
const satCurrency = { label: "SAT", value: 1 };
const coinCurrency = { label: "BTC", value: COIN };

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

  const [amount, setAmount] = useState<number>(0);
  const [satAmount, setSatAmount] = useState<number>(0);

  const [pin, setPin] = useState<string>();
  const [pinRequired, setPinRequired] = useState<boolean>(false);
  const [withdraw, setWithdraw] = useState<LnurlWData>();
  const [lnurlw, setLnurlw] = useState<LnurlWData>();
  const [lnurlp, setLnurlp] = useState<LnurlPData>();

  const [loadingWallet, setLoadingWallet] = useState<boolean>(true);
  const [payingInvoice, setPayingInvoice] = useState<boolean>(false);

  const rates = useRates();
  const [rateItems, setRateItems] = useState<ItemProps[]>([]);
  const [currentRate, setCurrentRate] = useState<{ label: string, value: number }>(satCurrency);

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
    if (withdraw && lnurlp && satAmount && !isNfcScanning) {
      requestInvoice(lnurlp, satAmount).then(pr => {
        setLnurlp(undefined);
        if(pr) {
          void payInvoice(withdraw.callback, withdraw.k1, pr, pin).then(()=>{
            setWithdraw(undefined);
            setPayingInvoice(false);
          });
        }
      });
    }
  }, [lnurlw, lnurlp, withdraw, satAmount, isNfcScanning]);

  useEffect(() => {
    if(rates !== undefined) {
      const ratesAsItems = [{label: 'SAT - Satoshi', value: 'SAT'}, {label: 'BTC - Bitcoin', value: 'BTC'}];
      for (const pair in rates) {
        const currentPair = rates[pair];
        const currencyShort = Object.keys(currentPair).filter(key => key !== 'currency' && key !== 'BTC').pop();
        if('currency' in currentPair && currencyShort) {
          ratesAsItems.push({ label: `${currencyShort} - ${currentPair.currency}`, value: currencyShort });
        }
      }
      setRateItems(ratesAsItems);
    }
  }, [rates]);

  const onRateChange = useCallback((currencyShort: string) => {
    if(currencyShort === 'SAT') {
      setCurrentRate(satCurrency);
    } else if (currencyShort === 'BTC') {
      setCurrentRate(coinCurrency);
    } else if(rates && 'BTC'+currencyShort in rates && 'BTC' in rates['BTC'+currencyShort]) {
      setCurrentRate({label: currencyShort, value: rates["BTC" + currencyShort].BTC * COIN });
    }
  }, [rates]);

  const onPay = useCallback(() => {
    if (lnurlw && satAmount) {
      setPin(undefined);

      const isPinRequired = lnurlw.pinLimit ? lnurlw.pinLimit <= satAmount : false;
      setPinRequired(isPinRequired);
      if(!isPinRequired) {
        setPayingInvoice(true);
        setWithdraw(lnurlw);
        setLnurlw(undefined);
        setLnurlp(undefined);
        void setupNfc();
      }
    }
  }, [setupNfc, lnurlw, satAmount]);

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
    if (lnurlp && satAmount) {
      requestInvoice(lnurlp, satAmount).then(pr => {
        navigate(`/invoice`, {
          state: currentRate.label !== 'SAT' ?
            { lightningInvoice: pr, fiat: currentRate.label, fiatAmount: amount } : { lightningInvoice: pr }
        });
      });
    }
  }, [requestInvoice, navigate, lnurlp, satAmount, currentRate, amount]);

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
      onReturnToHome();
    }
  }, [error]);

  useEffect(() => {
      setSatAmount(Math.ceil((amount || 0) * currentRate.value));
  }, [amount, currentRate]);

  return (
    <>
    {(loadingWallet || payingInvoice) && <AnimatedLinearGradient customColors={gradiantColors} speed={6000} />}
    <S.WalletPageContainer>
      {!isPaySuccess && !isNfcScanning && !loadingWallet && !payingInvoice ? (
        <S.WalletComponentStack>
          <S.TitleText h2>
            {t("title")}
          </S.TitleText>
          <S.WalletValueWrapper>
            <S.AmountText h1>
              {amount}
            </S.AmountText>
            <S.CurrencySelection showValue={true} value={currentRate.label} items={rateItems} onChange={(val)=>onRateChange(`${val.nativeEvent.text}`)} />
          </S.WalletValueWrapper>
          {currentRate.label !== 'SAT' ? (
            <S.SatAmountText h4>
              {numberWithSpaces(satAmount)} Sat
            </S.SatAmountText>) : null}
          <S.WalletButtonWrapper>
            <View>
              <S.WalletButton
                icon={faReply}
                size="large"
                title={t("receive")}
                onPress={onReceive}
                disabled={
                  !satAmount ||
                  !lnurlp ||
                  lnurlp.minSendable / 1000 > satAmount ||
                  lnurlp.maxSendable / 1000 < satAmount
                }
              />
              {lnurlp && !pinRequired ? (
                <View>
                  <S.InfoText>
                    Min: { numberWithSpaces(lnurlp.minSendable / 1000) }
                  </S.InfoText>
                  <S.InfoText>
                    Max: { numberWithSpaces(lnurlp.maxSendable / 1000) }
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
                  !satAmount ||
                  !lnurlw ||
                  lnurlw.maxWithdrawable / 1000 < satAmount
                }
              />
              {lnurlw && !pinRequired ? (
                <View>
                  <S.InfoText>
                    PIN Limit: { lnurlw.pinLimit ? numberWithSpaces(lnurlw.pinLimit) : "-"}
                  </S.InfoText>
                  <S.InfoText>
                    Max: { numberWithSpaces(lnurlw.maxWithdrawable / 1000) }
                  </S.InfoText>
                </View>
              ) : null}
            </View>
          </S.WalletButtonWrapper>
          {!pinRequired ? (
            <>
              <S.DescriptionText>
                {lightningRequest ? lightningRequest : lnurlw?.defaultDescription}
              </S.DescriptionText>
              <PinPad onPinEntered={(value)=> {
                if (value && value !== "") {
                  setAmount(parseInt(value));
                } else if (value !== undefined){
                  setAmount(0);
                }
              }} pinMode={false} floatAllowed={currentRate.label !== 'SAT' && currentRate.label !== 'BTC'}/>
            </>) : null}
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
          <S.SuccessText h3>
            {t("received")} {currentRate.label !== 'SAT' ?
              numberWithSpaces(amount) :
              numberWithSpaces(satAmount)} {currentRate.label}{currentRate.label !== 'SAT' ? `\n(${numberWithSpaces(satAmount)} SAT)` : ''}
          </S.SuccessText>
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
              "tapYourBoltCard").replace("%amount%", `${currentRate.label !== 'SAT' ? 
                numberWithSpaces(amount) : 
                numberWithSpaces(satAmount)} ${currentRate.label}${currentRate.label !== 'SAT' ? `\n(${numberWithSpaces(satAmount)} SAT)` : ''}`)
          }
          />
        </S.CenterComponentStack>
      ) : null}
    </S.WalletPageContainer>
    </>
  );
};