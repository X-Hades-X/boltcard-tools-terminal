import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "@components/Router";
import { ComponentStack, PinPad, Text, View } from "@components";
import { useInvoiceCallback, useRates } from "@hooks";
import { ThemeContext } from "@config";
import { useCallback, useContext, useEffect, useState } from "react";
import { useTheme } from "styled-components";
import * as S from "./styled";
import { LnurlPData, LnurlWData } from "@hooks/useInvoiceCallback";
// @ts-ignore
import { NumPad } from "@components/NumPad";
import { getNumberWithSpaces, getNumberWithSpacesFromString } from "@utils/numberWithSpaces";
import { ListItem } from "@components/ItemsList/components/ListItem";
import { faInfo } from "@fortawesome/free-solid-svg-icons";
import { CurrencySelect } from "@components/CurrencySelect";

type WalletRequest = {
  bitcoinAddress?: string;
  description?: string;
  lnurlw?: LnurlWData;
  lnurlp?: LnurlPData;
  isCard?: boolean;
};

const minLoopOut = 1000;

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
    currentRate,
    updateCurrentRate,
  } = useRates();

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

  const [isInit, setIsInit] = useState(true);

  useEffect(() => {
    if (withdraw && satAmount) {
      navigate(`/invoice`, {
        state: currentRate.label !== "SAT" ?
          {
            withdrawInvoice: withdraw,
            withdrawAmount: satAmount,
            withdrawPin: pin
          } :
          { withdrawInvoice: withdraw, withdrawAmount: satAmount, withdrawPin: pin }
      });
    }
  }, [withdraw, satAmount, numAmount, currentRate, pin]);

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

    if(bitcoinAddress){
      // TODO 1000 sats min amount to avoid users swapping out dust? (would still be kinda stupid)
      return satAmount > minLoopOut;
    } else if(lnurlw) {
      return satAmount <= lnurlw.maxWithdrawable / 1000 && satAmount >= lnurlw.minWithdrawable / 1000
    } else if(lnurlp) {
      return satAmount <= lnurlp.maxSendable / 1000 && satAmount >= lnurlp.minSendable / 1000
    }
  }, [satAmount, bitcoinAddress, lnurlp, lnurlw]);

  const canSend = useCallback(() => {
    if(!satAmount){
      return false;
    }
    return isAmountValid();
  }, [satAmount, isAmountValid]);

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
        {...(!pinRequired
          ? {
                footerButton: {
                  type: "bitcoin",
                  title: t(lnurlw ? (isCard ? "send" : "receive") : (isCard ? "receive" : "send")),
                  disabled: !canSend(),
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
        <ComponentStack>
        {(lnurlw || lnurlp || bitcoinAddress) ? (
          <>
          <ComponentStack gapSize={2} gapColor={colors.primaryLight}>
            <S.ListItemWrapper>
              <Text h3 weight={600} color={colors.white}>
                {description ? description : bitcoinAddress ? bitcoinAddress : lnurlw?.defaultDescription || ''}
              </Text>
            </S.ListItemWrapper>
            <ListItem
              title={''}
              icon={faInfo}
              value={t(bitcoinAddress ? "btcAddressTitle" :
                (lnurlp ? isCard ? "invoiceTitle" : "lnAddressTitle" : "withdrawTitle"))}
              valueColor={
                lnurlp || isCard ? colors.lightning : colors.bitcoin
              }
            />
            <S.WalletComponentStack>
              <S.WalletValueWrapper>
                <S.AmountText h1>
                  {getNumberWithSpacesFromString(amount, amount.indexOf(".") > 0)}
                </S.AmountText>
                <CurrencySelect onChange={event => {
                  if(!isInit) {
                    void updateCurrentRate(event);
                  } else {
                    setIsInit(false);
                  }
                }}/>
              </S.WalletValueWrapper>
              {currentRate.label !== "SAT" ? (
                <S.SatAmountText h4>
                  {getNumberWithSpaces(satAmount)} Sat
                </S.SatAmountText>) : <S.SatAmountSpace/>}
            </S.WalletComponentStack>
          </ComponentStack>
          </>
        ) : null}
        </ComponentStack>
        {pinRequired ? (
          <PinPad onPinEntered={onPin} onClose={()=>setPinRequired(false)}/>
        ) : (
          <S.WalletNumPadWrapper>
            <View>
              {bitcoinAddress ? (
                <S.WalletMinMaxWrapper>
                  <S.InfoText>
                    {t("min")}: {getNumberWithSpaces(minLoopOut)}
                  </S.InfoText>
                </S.WalletMinMaxWrapper>
              ) : lnurlp ? (
                <S.WalletMinMaxWrapper>
                  <S.InfoText>
                    {t("min")}: {getNumberWithSpaces(lnurlp.minSendable / 1000)}
                  </S.InfoText>
                  <S.InfoText>
                    {t("max")}: {getNumberWithSpaces(lnurlp.maxSendable / 1000)}
                  </S.InfoText>
                </S.WalletMinMaxWrapper>
              ) : lnurlw ? (
                <S.WalletMinMaxWrapper>
                  {lnurlw.pinLimit &&
                    <S.InfoText>
                      {t("pinLimit")}: {getNumberWithSpaces(lnurlw.pinLimit)}
                    </S.InfoText>
                  }
                  <S.InfoText>
                    {t("max")}: {getNumberWithSpaces(lnurlw.maxWithdrawable / 1000)}
                  </S.InfoText>
                </S.WalletMinMaxWrapper>
              ) : null}
              {!isAmountValid() ? (
                <S.WalletErrorText>{t("notValid")}</S.WalletErrorText>
              ) : (<S.WalletErrorSpace/>)}
            </View>
            <NumPad
              value={amount}
              onNumberEntered={(value) => {
                if (value) {
                  setAmount(value);
                } else {
                  setAmount("");
                }
              }} fixed={currentRate.label !== "SAT" ? (currentRate.label !== "BTC" ? 2 : 8) : 0} />
          </S.WalletNumPadWrapper>
        )}
      </S.WalletPageContainer>
    </>
  );
};