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
import { useNfc, useInvoiceHandler } from "@hooks";
import { ThemeContext } from "@config";
import { useCallback, useContext, useEffect, useState } from "react";
import { Vibration } from "react-native";
import { useTheme } from "styled-components";
import axios from "axios";
import * as S from "./styled";

export const Bridge = () => {
  const { t } = useTranslation(undefined, { keyPrefix: "screens.bridge" });
  const navigate = useNavigate();
  const { setBackgroundColor } = useContext(ThemeContext);
  const location = useLocation<InvoiceState>();
  const { colors } = useTheme();
  const {
    readingNfcLoopWithdraw,
    isNfcScanning,
    isNfcLoading,
    isNfcActionSuccess,
    isPinRequired,
    isPinConfirmed,
    setPin,
  } = useNfc();
  const { invoiceHandler } = useInvoiceHandler();

  const {
    lnurlWData,
    lnurlPData
  } = location.state || {};
  const [amount, setAmount] = useState<number>();

  const onReceive = useCallback(async () => {
    const callbackUrl = `${lnurlPData.callback}?amount=${(amount || 0) * 1000}`
    const { data: callbackRequest } = await axios.get<{ pr?: string }>(
      callbackUrl
    );
    if (!callbackRequest.pr) {
        throw getError("Invalid tag. No pr defined");
    }

    setTimeout(() => {
      invoiceHandler(callbackRequest.pr);
    }, 0);
  }, [lnurlPData, amount]);

  const onPay = useCallback(async () => {
    let pinRequired = lnurlWData.pinLimit ? lnurlWData.pinLimit <= amount : false
    readingNfcLoopWithdraw(lnurlWData.callback, lnurlWData.k1, amount, pinRequired);
  }, [lnurlWData, amount]);

  const onReturnToHome = useCallback(() => {
    navigate("/");
    setBackgroundColor(colors.primary, 0);
  }, [colors.primary, navigate, setBackgroundColor]);

  useEffect(() => {
    if (isNfcActionSuccess) {
      Vibration.vibrate(50);
      setBackgroundColor(colors.success, 500);
    }
  }, [isNfcActionSuccess]);

  return (
    <S.BridgePageContainer>
        {!isNfcActionSuccess ? (
          <S.BridgeComponentStack>
              <S.TitleText h2>
                {t("title")}
              </S.TitleText>
              <S.AmountText h1>
                {amount}
              </S.AmountText>
              {!(isNfcLoading || isNfcScanning) ? (
              <S.BridgeButtonWrapper>
                  <View>
                      <S.BridgeButton
                        icon={faReply}
                        size="large"
                        title={t("receive")}
                        onPress={onReceive}
                        disabled={
                            isPinRequired ||
                            isNfcLoading || isNfcScanning ||
                            !amount ||
                            !lnurlPData ||
                            lnurlPData.minSendable / 1000 > amount ||
                            lnurlPData.maxSendable / 1000 < amount
                        }
                      />
                      {lnurlPData && !isPinRequired ? (
                      <View>
                          <S.InfoText>
                            Min: { lnurlPData.minSendable / 1000 }
                          </S.InfoText>
                          <S.InfoText>
                            Max: { lnurlPData.maxSendable / 1000 }
                          </S.InfoText>
                      </View>
                      ) : null}
                  </View>

                  <View>
                      <S.BridgeButton
                        icon={faShare}
                        isIconRight={true}
                        size="large"
                        title={t("send")}
                        onPress={onPay}
                        contentStyle={{flexDirection: 'row-reverse'}}
                        disabled={
                            isPinRequired ||
                            isNfcLoading || isNfcScanning ||
                            !amount ||
                            !lnurlWData || lnurlWData.maxWithdrawable / 1000 < amount
                        }
                      />
                      {lnurlWData && !isPinRequired ? (
                      <View>
                          <S.InfoText>
                            PIN Limit: { lnurlWData.pinLimit ? lnurlWData.pinLimit : "-"}
                          </S.InfoText>
                          <S.InfoText>
                            Max: { lnurlWData.maxWithdrawable / 1000 }
                          </S.InfoText>
                      </View>
                      ) : null}
                  </View>
              </S.BridgeButtonWrapper>
              ) : null}
              {!(isPinRequired || isNfcLoading || isNfcScanning) ? (
                <PinPad onPinEntered={setAmount} pinMode={false}/>
              ) : null}
          </S.BridgeComponentStack>
        ) : null}
        {isNfcActionSuccess ? (
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
        ) : isPinRequired && !isPinConfirmed ? (
          <PinPad onPinEntered={setPin} pinMode={true}/>
        ) : isNfcLoading || isNfcScanning ? (
          <Loader
            reason={t(isNfcLoading ? "payingInvoice" : "tapYourBoltCard")}
          />
        ) : null}
    </S.BridgePageContainer>
  );
};
