import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "@components/Router";
import {
  Button,
  Loader
} from "@components";
import {
  faReply,
  faShare
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

            const sats = response.maxWithdrawable / 1000;
            if (response.payLink) {
              callLnurl(response.payLink).then(payResponse => {
                if (payResponse && payResponse.tag === "payRequest") {
                  setLnurlp(payResponse);
                  setLoadingWallet(false);
                }
              });
            } else {
              const onlyMaxWithdraw =
                response.maxWithdrawable &&
                (response.minWithdrawable === undefined || response.minWithdrawable === response.maxWithdrawable);
              if (onlyMaxWithdraw) {
                // this can be swiped
                navigate(`/invoice`, {
                  state: { message: response.defaultDescription, withdrawInvoice: response, withdrawAmount: sats }
                });
              }

              setSatAmount(sats);
              setLoadingWallet(false);
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
          state: { message: lnurlw.defaultDescription, withdrawInvoice: lnurlw, withdrawAmount: satAmount }
        });
      }else {
        navigate(`/wallet`, {
          state: { description: lnurlw.defaultDescription ?? lightningRequest, lnurlw, isCard: !!lnurlp && !!lnurlw }
        });
      }
    }
  }, [lnurlw, lnurlp, lightningRequest, satAmount, navigate]);

  useEffect(() => {
    if (lnurlw && !lnurlp && !loadingWallet) {
      onLnurlW();
    }
  }, [lnurlw, lnurlp, onLnurlW, loadingWallet]);

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
    if (lnurlp && !lnurlw && !loadingWallet) {
      onLnurlP();
    }
  }, [lnurlp, lnurlw, onLnurlP, loadingWallet]);

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
            <S.DescriptionText h3>
              {lightningRequest ? lightningRequest : bitcoinAddress ? bitcoinAddress : lnurlw?.defaultDescription}
            </S.DescriptionText>
            <S.DecoderCenterStack>
              {(lnurlp || bitcoinAddress) && (
                <>
                  <S.SectionTitle h2>{t(!lnurlw ? "send" : "receive")}</S.SectionTitle>
                  <S.DecoderGridStack>
                    {lnurlp && (
                        <S.DecoderMinMaxWrapper>
                          <S.DecoderLabel>Min:</S.DecoderLabel>
                          <S.DecoderValue>{getNumberWithSpaces(lnurlp.minSendable / 1000)}</S.DecoderValue>
                          <S.DecoderLabel>Max:</S.DecoderLabel>
                          <S.DecoderValue>{getNumberWithSpaces(lnurlp.maxSendable / 1000)}</S.DecoderValue>
                        </S.DecoderMinMaxWrapper>
                    )}
                  </S.DecoderGridStack>
                </>
              )}
              {lnurlw && (
                <>
                  <S.SectionTitle h2>{t(!lnurlp ? "receive" : "send")}</S.SectionTitle>
                  <S.DecoderGridStack>
                    <S.DecoderMinMaxWrapper>
                      {lnurlw.pinLimit &&
                        <>
                          <S.DecoderLabel>PIN Limit:</S.DecoderLabel>
                          <S.DecoderValue>{getNumberWithSpaces(lnurlw.pinLimit)}</S.DecoderValue>
                        </>
                      }
                      <S.DecoderLabel>Max:</S.DecoderLabel>
                      <S.DecoderValue>{getNumberWithSpaces(lnurlw.maxWithdrawable / 1000)}</S.DecoderValue>
                    </S.DecoderMinMaxWrapper>
                  </S.DecoderGridStack>
                </>
              )}
            </S.DecoderCenterStack>

            <S.DecoderBottomView>
              {(lnurlp || bitcoinAddress) && (
                  <Button
                    isRound
                    size="smallCircle"
                    type="bitcoin"
                    icon={!lnurlw ? faShare : faReply}
                    title={t(!lnurlw ? "send" : "receive")}
                    onPress={onLnurlP}
                  />
              )}
              {lnurlw && (
                  <Button
                    isRound
                    size="smallCircle"
                    type="bitcoin"
                    icon={!lnurlp ? faReply : faShare}
                    title={t(!lnurlp ? "receive" : "send")}
                    onPress={onLnurlW}
                  />
              )}
            </S.DecoderBottomView>
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