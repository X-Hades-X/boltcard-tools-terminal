import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "@components/Router";
import {
  Loader,
  View,
} from "@components";
import {
  faReply,
  faShare,
} from "@fortawesome/free-solid-svg-icons";
import { useNfc, useInvoiceCallback } from "@hooks";
import { ThemeContext } from "@config";
import { useCallback, useContext, useEffect, useState } from "react";
import { useTheme } from "styled-components";
import * as S from "./styled";
import { LnurlPData, LnurlWData } from "@hooks/useInvoiceCallback";
// @ts-ignore
import AnimatedLinearGradient from "react-native-animated-linear-gradient";
import { colors as gradiantColors } from "./gradient-config";
import { getNumberWithSpaces } from "@utils/numberWithSpaces";

type DecoderRequest = {
  lightningRequest?: string;
  bitcoinAddress?: string;
};

export const Decoder = () => {
  const { t } = useTranslation(undefined, { keyPrefix: "screens.decoder" });
  const location = useLocation<DecoderRequest>();
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

  const [satAmount, setSatAmount] = useState<number>(0);

  const [lnurlw, setLnurlw] = useState<LnurlWData>();
  const [lnurlp, setLnurlp] = useState<LnurlPData>();

  const [loadingWallet, setLoadingWallet] = useState<boolean>(false);

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
    }
  }, [readingNfcLoop, isNfcAvailable, isNfcNeedsTap]);

  // Fetch data from the URL in the NFC Message
  useEffect(() => {
    const request = nfcMessage ? nfcMessage : lightningRequest;
    if (request) {
      setLoadingWallet(true);
      callLnurl(request).then(response => {
        if (response) {
          if (response.tag === "withdrawRequest") {
            setLnurlw(response);

            const onlyMaxWithdraw =
              response.maxWithdrawable &&
              (response.minWithdrawable === undefined || response.minWithdrawable === response.maxWithdrawable);

            if (response.payLink) {
              callLnurl(response.payLink).then(payResponse => {
                if (payResponse && payResponse.tag === "payRequest") {
                  setLnurlp(payResponse);
                  setLoadingWallet(false);
                }
              });
            } else {
              setLoadingWallet(false);
              if (onlyMaxWithdraw) {
                // this can be swiped
                setSatAmount(response.maxWithdrawable / 1000);
              }
            }
          } else if (response.tag === "payRequest") {
            setLnurlp(response);
            setLoadingWallet(false);
          }
        }
      });
    }
  }, [nfcMessage]);

  const onLnurlW = useCallback(() => {
    if (lnurlw) {
      if(satAmount) {
        navigate(`/invoice`, {
          state: { withdrawInvoice: lnurlw, withdrawAmount: satAmount }
        });
      }else {
        navigate(`/wallet`, {
          state: { description: lnurlw.defaultDescription ?? lightningRequest, lnurlw, isCard: !!lnurlp && !!lnurlw }
        });
      }
    }
  }, [lnurlw, lnurlp, lightningRequest, satAmount, navigate]);

  const onLnurlP = useCallback(() => {
    if (lnurlp || bitcoinAddress) {
      if (satAmount) {
        if (lnurlp) {
          requestInvoice(lnurlp, satAmount).then(pr => {
            navigate(`/invoice`, { state: { lightningInvoice: pr } });
          });
        } else if (bitcoinAddress) {
          navigate(`/invoice`, {
            state: { bitcoinAddress, amount: satAmount }
          });
        }
      } else {
        navigate(`/wallet`, {
          state: { description: lnurlw?.defaultDescription ?? lightningRequest, lnurlp, bitcoinAddress, isCard: !!lnurlp && !!lnurlw}
        });
      }
    }
  }, [requestInvoice, navigate, lnurlp, lnurlw, lightningRequest, satAmount, bitcoinAddress]);

  useEffect(() => {
    if (error) {
      navigate("/");
      setBackgroundColor(colors.primary, 0);
    }
  }, [error, colors.primary, navigate, setBackgroundColor]);

  return (
    <>
      {(isNfcScanning || loadingWallet) && <AnimatedLinearGradient customColors={gradiantColors} speed={6000} />}
      <S.DecoderPageContainer>
        {!(isNfcScanning || loadingWallet) && (lnurlw || lnurlp || bitcoinAddress) ? (
          <S.DecoderComponentStack>
            <S.TitleText h2>
              {t(bitcoinAddress ? "btcAddressTitle" :
                (lnurlw && lnurlp ? "cardTitle" :
                  !lnurlw ? "lnAddressTitle" :
                    "withdrawTitle"))}
            </S.TitleText>
            <S.DescriptionText>
              {lightningRequest ? lightningRequest : bitcoinAddress ? bitcoinAddress : lnurlw?.defaultDescription}
            </S.DescriptionText>
            <S.DecoderButtonWrapper>
              {(lnurlp || bitcoinAddress) && (
                <View>
                  <S.DecoderButton
                    icon={!lnurlw ? faShare : faReply}
                    isIconTop={true}
                    size="huge"
                    title={t(!lnurlw ? "send" : "receive")}
                    onPress={onLnurlP}
                  />
                  {lnurlp && (
                    <S.DecoderMinMaxWrapper>
                      <S.InfoText>
                        Min: {getNumberWithSpaces(lnurlp.minSendable / 1000)}
                      </S.InfoText>
                      <S.InfoText>
                        Max: {getNumberWithSpaces(lnurlp.maxSendable / 1000)}
                      </S.InfoText>
                    </S.DecoderMinMaxWrapper>
                  )}
                </View>
              )}

              {lnurlw && (
                <View>
                  <S.DecoderButton
                    icon={!lnurlp ? faReply : faShare}
                    isIconTop={true}
                    size="huge"
                    title={t(!lnurlp ? "receive" : "send")}
                    onPress={onLnurlW}
                  />
                    <S.DecoderMinMaxWrapper>
                      {lnurlw.pinLimit &&
                        <S.InfoText>
                          PIN Limit: {getNumberWithSpaces(lnurlw.pinLimit)}
                        </S.InfoText>
                      }
                      <S.InfoText>
                        Max: {getNumberWithSpaces(lnurlw.maxWithdrawable / 1000)}
                      </S.InfoText>
                    </S.DecoderMinMaxWrapper>
                </View>
              )}
            </S.DecoderButtonWrapper>
          </S.DecoderComponentStack>
        ) : (
          <S.CenterComponentStack>
            <Loader
              reason={t(loadingWallet ? "loadingWallet" : "tapYourBoltCard")
              }
            />
          </S.CenterComponentStack>
        )}
      </S.DecoderPageContainer>
    </>
  );
};