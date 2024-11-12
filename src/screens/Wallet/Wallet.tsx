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
import { NumPad } from "@components/NumPad";
import { getNumberWithSpaces, getNumberWithSpacesFromString } from "@utils/numberWithSpaces";

type WalletRequest = {
  lightningRequest?: string;
  bitcoinAddress?: string;
};

const COIN = 100000000;
const satCurrency = { label: "SAT", value: 1 };
const coinCurrency = { label: "BTC", value: COIN };

export const Wallet = () => {
  const { t } = useTranslation(undefined, { keyPrefix: "screens.wallet" });
  const location = useLocation<WalletRequest>();
  const navigate = useNavigate();
  const { setBackgroundColor } = useContext(ThemeContext);
  const { colors } = useTheme();
  const {
    nfcMessage,
    setupNfc,
    readingNfcLoop,
    isNfcAvailable,
    isNfcScanning,
    isNfcNeedsTap
  } = useNfc();
  const {
    callLnurl,
    requestInvoice,
    error
  } = useInvoiceCallback();

  const [amount, setAmount] = useState<string>("");
  const [numAmount, setNumAmount] = useState<number>(0);
  const [satAmount, setSatAmount] = useState<number>(0);

  const [pin, setPin] = useState<string>();
  const [pinRequired, setPinRequired] = useState<boolean>(false);
  const [withdraw, setWithdraw] = useState<LnurlWData>();
  const [lnurlw, setLnurlw] = useState<LnurlWData>();
  const [lnurlp, setLnurlp] = useState<LnurlPData>();

  const [loadingWallet, setLoadingWallet] = useState<boolean>(true);

  const rates = useRates();
  const [rateItems, setRateItems] = useState<ItemProps[]>([]);
  const [currentRate, setCurrentRate] = useState<{ label: string, value: number }>(satCurrency);

  const {
    lightningRequest,
    bitcoinAddress
  } = location.state || {};

  useEffect(() => {
    setBackgroundColor(colors.primary, 0);
    if (bitcoinAddress) {
      setLoadingWallet(false);
    } else if (!lightningRequest) {
      void setupNfc();
    }
  }, [lightningRequest]);

  // Read NFC Message
  useEffect(() => {
    if (isNfcAvailable && !isNfcNeedsTap) {
      void readingNfcLoop();
      setLoadingWallet(false);
    }
  }, [readingNfcLoop, isNfcAvailable, isNfcNeedsTap]);

  // Fetch data from the URL in the NFC Message
  useEffect(() => {
    const request = nfcMessage ? nfcMessage : lightningRequest;
    if (request) {
      setLoadingWallet(true);
      callLnurl(request).then(response => {
        if (response) {
          setLoadingWallet(false);
          if (response.tag === "withdrawRequest") {
            setLnurlw(response);
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
    if (withdraw && satAmount) {
      navigate(`/invoice`, {
        state: currentRate.label !== "SAT" ?
          {
            withdrawInvoice: withdraw,
            fiat: currentRate.label,
            fiatAmount: numAmount,
            withdrawAmount: satAmount,
            withdrawPin: pin
          } :
          { withdrawInvoice: withdraw, withdrawAmount: satAmount, withdrawPin: pin }
      });
    }
  }, [withdraw, satAmount, numAmount, currentRate, pin]);

  useEffect(() => {
    if (rates !== undefined) {
      const ratesAsItems = [{ label: "SAT - Satoshi", value: "SAT" }, { label: "BTC - Bitcoin", value: "BTC" }];
      for (const pair in rates) {
        const currentPair = rates[pair];
        const currencyShort = Object.keys(currentPair).filter(key => key !== "currency" && key !== "BTC").pop();
        if ("currency" in currentPair && currencyShort) {
          ratesAsItems.push({ label: `${currencyShort} - ${currentPair.currency}`, value: currencyShort });
        }
      }
      setRateItems(ratesAsItems);
    }
  }, [rates]);

  const onRateChange = useCallback((currencyShort: string) => {
    let newRate = satCurrency;
    if (currencyShort === "SAT") {
      newRate = satCurrency;
    } else if (currencyShort === "BTC") {
      newRate = coinCurrency;
    } else if (rates && "BTC" + currencyShort in rates && "BTC" in rates["BTC" + currencyShort]) {
      newRate = { label: currencyShort, value: rates["BTC" + currencyShort].BTC * COIN };
    }
    setCurrentRate(newRate);
  }, [rates]);

  const onPay = useCallback(() => {
    if (lnurlw && satAmount) {
      setPin(undefined);

      const isPinRequired = lnurlw.pinLimit ? lnurlw.pinLimit <= satAmount : false;
      setPinRequired(isPinRequired);
      if (!isPinRequired) {
        setWithdraw(lnurlw);
      }
    }
  }, [lnurlw, satAmount]);

  const onPin = useCallback((input: string) => {
    setPin(input);
    setWithdraw(lnurlw);
  }, [lnurlw]);

  const onReceive = useCallback(() => {
    if (satAmount) {
      if (lnurlp) {
        requestInvoice(lnurlp, satAmount).then(pr => {
          navigate(`/invoice`, {
            state: currentRate.label !== "SAT" ?
              { lightningInvoice: pr, fiat: currentRate.label, fiatAmount: numAmount } : { lightningInvoice: pr }
          });
        });
      } else if (bitcoinAddress) {
        navigate(`/invoice`, {
          state: { bitcoinAddress, amount: satAmount }
        });
      }
    }
  }, [requestInvoice, navigate, lnurlp, satAmount, currentRate, numAmount, bitcoinAddress]);

  useEffect(() => {
    if (error) {
      navigate("/");
      setBackgroundColor(colors.primary, 0);
    }
  }, [error, colors.primary, navigate, setBackgroundColor]);

  useEffect(() => {
    if (amount && (amount !== "" || amount.indexOf(".") === amount.length - 1)) {
      const newNumAmount = parseFloat(amount);
      setNumAmount(newNumAmount);
      setSatAmount(Math.ceil(newNumAmount * currentRate.value));
    } else if (!amount || amount === "") {
      setNumAmount(0);
      setSatAmount(0);
    }

  }, [amount, currentRate]);

  return (
    <>
      {(isNfcScanning || loadingWallet) && <AnimatedLinearGradient customColors={gradiantColors} speed={6000} />}
      <S.WalletPageContainer>
        {!(isNfcScanning || loadingWallet) && (lnurlw || lnurlp || bitcoinAddress) ? (
          <S.WalletComponentStack>
            <S.TitleText h2>
              {t("title")}
            </S.TitleText>
            <S.WalletValueWrapper>
              <S.AmountText h1>
                {getNumberWithSpacesFromString(amount, amount.indexOf(".") > 0)}
              </S.AmountText>
              <S.CurrencySelection showValue={true} value={currentRate.label} items={rateItems}
                                   onChange={(val) => onRateChange(`${val.nativeEvent.text}`)} />
            </S.WalletValueWrapper>
            {currentRate.label !== "SAT" ? (
              <S.SatAmountText h4>
                {getNumberWithSpaces(satAmount)} Sat
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
                    ((!lnurlp ||
                        lnurlp.minSendable / 1000 > satAmount ||
                        lnurlp.maxSendable / 1000 < satAmount) &&
                      !bitcoinAddress)
                  }
                />
                {lnurlp && !pinRequired ? (
                  <View>
                    <S.InfoText>
                      Min: {getNumberWithSpaces(lnurlp.minSendable / 1000)}
                    </S.InfoText>
                    <S.InfoText>
                      Max: {getNumberWithSpaces(lnurlp.maxSendable / 1000)}
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
                      PIN Limit: {lnurlw.pinLimit ? getNumberWithSpaces(lnurlw.pinLimit) : "-"}
                    </S.InfoText>
                    <S.InfoText>
                      Max: {getNumberWithSpaces(lnurlw.maxWithdrawable / 1000)}
                    </S.InfoText>
                  </View>
                ) : null}
              </View>
            </S.WalletButtonWrapper>
            {!pinRequired ? (
              <>
                <S.DescriptionText>
                  {lightningRequest ? lightningRequest : bitcoinAddress ? bitcoinAddress : lnurlw?.defaultDescription}
                </S.DescriptionText>
                <NumPad
                  value={amount}
                  onNumberEntered={(value) => {
                    if (value) {
                      setAmount(value);
                    } else {
                      setAmount("");
                    }
                  }} fixed={currentRate.label !== "SAT" ? (currentRate.label !== "BTC" ? 2 : 8) : 0} />
              </>) : null}
          </S.WalletComponentStack>
        ) : (
          <S.CenterComponentStack>
            <Loader
              reason={t(loadingWallet ?
                "loadingWallet" :
                "tapYourBoltCard")
              }
            />
          </S.CenterComponentStack>
        )}
        {pinRequired && !isNfcScanning ? (
          <PinPad onPinEntered={onPin} />
        ) : null}
      </S.WalletPageContainer>
    </>
  );
};