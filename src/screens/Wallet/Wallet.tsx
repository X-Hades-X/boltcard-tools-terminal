import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "@components/Router";
import { PinPad } from "@components";
import { useInvoiceCallback, useRates } from "@hooks";
import { ThemeContext } from "@config";
import { useCallback, useContext, useEffect, useState } from "react";
import { useTheme } from "styled-components";
import * as S from "./styled";
import { LnurlPData, LnurlWData } from "@hooks/useInvoiceCallback";
// @ts-ignore
import { ItemProps } from "@components/Picker/Picker";
import { NumPad } from "@components/NumPad";
import { getNumberWithSpaces, getNumberWithSpacesFromString } from "@utils/numberWithSpaces";
import { theme } from "@config/themes";

type WalletRequest = {
  bitcoinAddress?: string;
  description?: string;
  lnurlw?: LnurlWData;
  lnurlp?: LnurlPData;
  isCard?: boolean;
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
    requestInvoice,
    error
  } = useInvoiceCallback();

  const {
    bitcoinAddress,
    description,
    lnurlw,
    lnurlp,
    isCard
  } = location.state || {};

  const [amount, setAmount] = useState<string>("");
  const [numAmount, setNumAmount] = useState<number>(0);
  const [satAmount, setSatAmount] = useState<number>(0);

  const [pin, setPin] = useState<string>();
  const [pinRequired, setPinRequired] = useState<boolean>(false);
  const [withdraw, setWithdraw] = useState<LnurlWData>();

  const rates = useRates();
  const [rateItems, setRateItems] = useState<ItemProps[]>([{ label: "SAT - Satoshi", value: "SAT" }, { label: "BTC - Bitcoin", value: "BTC" }]);
  const [currentRate, setCurrentRate] = useState<{ label: string, value: number }>(satCurrency);

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
      const ratesAsItems = rateItems;
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

  const onLnurlW = useCallback(() => {
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

  const onRequestInvoice = useCallback(() => {
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

  const isAmountValid = useCallback(() => {
    if(!satAmount){
      return true;
    }

    if(lnurlw) {
      return satAmount <= lnurlw.maxWithdrawable / 1000 && satAmount >= lnurlw.minWithdrawable / 1000
    } else if(lnurlp) {
      return satAmount <= lnurlp.maxSendable / 1000 && satAmount >= lnurlp.minSendable / 1000
    }
  }, [satAmount, lnurlp, lnurlw])

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
      <S.WalletPageContainer
        {...(satAmount && !pinRequired
          ? {
                footerButton: {
                  type: "bitcoin",
                  title: t(lnurlw ? (isCard ? "send" : "receive") : (isCard ? "receive" : "send")),
                  disabled: !isAmountValid(),
                  onPress: () => {
                    if(lnurlw) {
                      onLnurlW();
                    } else {
                      onRequestInvoice();
                    }
                  }
                }
              }
          : {})}
      >
        {(lnurlw || lnurlp || bitcoinAddress) ? (
          <S.WalletComponentStack>
            <S.TitleText h2>
              {t(bitcoinAddress ? "btcAddressTitle" :
                (lnurlp ? isCard ? "invoiceTitle" : "lnAddressTitle" : "withdrawTitle"))}
            </S.TitleText>
            <S.DescriptionText>
              {description ? description : bitcoinAddress ? bitcoinAddress : lnurlw?.defaultDescription}
            </S.DescriptionText>
            <S.WalletValueWrapper>
              <S.AmountText h1>
                {getNumberWithSpacesFromString(amount, amount.indexOf(".") > 0)}
              </S.AmountText>
              <S.CurrencySelection showValue={true} value={currentRate.label} items={rateItems}
                                   onChange={(val) => onRateChange(`${val.nativeEvent.text}`)}
                                   style={{backgroundColor: theme.colors.greyLight}}
              />
            </S.WalletValueWrapper>
            {currentRate.label !== "SAT" ? (
              <S.SatAmountText h4>
                {getNumberWithSpaces(satAmount)} Sat
              </S.SatAmountText>) : null}
            {!pinRequired ? (
              <>
                <S.WalletMinMaxWrapper>
                  {lnurlp ? (
                    <>
                      <S.InfoText>
                        Min: {getNumberWithSpaces(lnurlp.minSendable / 1000)}
                      </S.InfoText>
                      <S.InfoText>
                        Max: {getNumberWithSpaces(lnurlp.maxSendable / 1000)}
                      </S.InfoText>
                    </>
                  ) : lnurlw ? (
                    <>
                      {lnurlw.pinLimit &&
                        <S.InfoText>
                          PIN Limit: {getNumberWithSpaces(lnurlw.pinLimit)}
                        </S.InfoText>
                      }
                      <S.InfoText>
                        Max: {getNumberWithSpaces(lnurlw.maxWithdrawable / 1000)}
                      </S.InfoText>
                    </>
                  ) : null}
                </S.WalletMinMaxWrapper>
                {!isAmountValid() ? (
                  <S.WalletErrorText>{t("notValid")}</S.WalletErrorText>
                ) : (<S.WalletErrorSpace/>)}
                <NumPad
                  value={amount}
                  onNumberEntered={(value) => {
                    if (value) {
                      setAmount(value);
                    } else {
                      setAmount("");
                    }
                  }} fixed={currentRate.label !== "SAT" ? (currentRate.label !== "BTC" ? 2 : 8) : 0} />
              </>
            ) : null}
          </S.WalletComponentStack>
        ) : null}
        {pinRequired ? (
          <PinPad onPinEntered={onPin} />
        ) : null}
      </S.WalletPageContainer>
    </>
  );
};