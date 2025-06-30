import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "@components/Router";
import {
  Button, ComponentStack,
  Loader, Pressable, Text
} from "@components";
import {
  faCaretDown, faCaretRight, faCaretUp,
  faLock,
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
import { ListItem } from "@components/ItemsList/components/ListItem";

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
  const [showInfo, setShowInfo] = useState<boolean>(false);

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
                (!response.minWithdrawable || response.minWithdrawable === response.maxWithdrawable);
              if (onlyMaxWithdraw) {
                setSatAmount(response.maxWithdrawable / 1000);
              }
              setLoadingWallet(false);
            }
          } else if (response.tag === "payRequest") {
            setLnurlp(response);
            const onlyMinSend =
              response.minSendable &&
              (!response.maxSendable || response.maxSendable === response.minSendable);
            if(onlyMinSend) {
              setSatAmount(response.minSendable / 1000);
            }
            setLoadingWallet(false);
          }
        }
      });
    }
  }, [nfcMessage]);

  const onLnurlW = useCallback(() => {
    if (!loadingWallet && lnurlw) {
      if(satAmount) {
        navigate(`/invoice`, {
          state: { message: lnurlw.defaultDescription, withdrawInvoice: lnurlw, withdrawAmount: satAmount }
        });
      } else {
        navigate(`/wallet`, {
          state: { description: lnurlw.defaultDescription ?? lightningRequest, lnurlw, isCard: !!lnurlp && !!lnurlw }
        });
      }
    }
  }, [lnurlw, lnurlp, lightningRequest, satAmount, navigate, loadingWallet]);

  const onLnurlP = useCallback(() => {
    if (!loadingWallet && (lnurlp || bitcoinAddress)) {
      if (satAmount) {
        if (lnurlp) {
          setLoadingWallet(true);
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
  }, [requestInvoice, navigate, lnurlp, lnurlw, lightningRequest, satAmount, bitcoinAddress, loadingWallet]);

  useEffect(() => {
    if (!loadingWallet) {
      if(lnurlw && !lnurlp) {
        onLnurlW();
      } else if (lnurlp && !lnurlw) {
        onLnurlP();
      }
    }
  }, [lnurlw, lnurlp, onLnurlW, onLnurlP, loadingWallet]);

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
        {lnurlw && lnurlp ? (
          <S.DecoderComponentStack>
            <ComponentStack gapSize={2} gapColor={colors.primaryLight}>
              <S.ListItemWrapper>
                <Text h2 weight={600} color={colors.white}>
                  {lightningRequest ? lightningRequest : lnurlw?.defaultDescription}
                </Text>
              </S.ListItemWrapper>

              <Pressable onPress={()=>setShowInfo(!showInfo)}>
                <ListItem
                  title={t(showInfo ? "hideInfo" : "showInfo")}
                  icon={showInfo ? faCaretDown : faCaretRight}
                  value={''}
                />
              </Pressable>

              {showInfo && (
                <>
                  {lnurlp && (
                    <S.ListItemWrapper>
                      <Text h3 weight={600} color={colors.lightning}>
                        {t(!lnurlw ? "send" : "receive")}
                      </Text>
                      {lnurlp && (
                        <ComponentStack gapSize={2} gapColor={colors.primaryLight}>
                          <ListItem
                            title={t("min")}
                            icon={faCaretDown}
                            value={getNumberWithSpaces(lnurlp.minSendable / 1000) + ' sats'}
                          />
                          <ListItem
                            title={t("max")}
                            icon={faCaretUp}
                            value={getNumberWithSpaces(lnurlp.maxSendable / 1000) + ' sats'}
                          />
                        </ComponentStack>
                      )}
                    </S.ListItemWrapper>
                  )}
                  {lnurlw && (
                    <S.ListItemWrapper>
                      <Text h3 weight={600} color={colors.lightning}>
                        {t(!lnurlp ? "receive" : "send")}
                      </Text>
                      <ComponentStack gapSize={2} gapColor={colors.primaryLight}>
                        {lnurlw.pinLimit && (
                          <ListItem
                            title={t("pinLimit")}
                            icon={faLock}
                            value={getNumberWithSpaces(lnurlw.pinLimit) + ' sats'}
                          />
                        )}
                        <ListItem
                          title={t("max")}
                          icon={faCaretUp}
                          value={getNumberWithSpaces(lnurlw.maxWithdrawable / 1000) + ' sats'}
                        />
                      </ComponentStack>
                    </S.ListItemWrapper>
                  )}
                </>
              )}
            </ComponentStack>
            <S.DecoderSpacerStack/>
            <S.DecoderBottomView>
              {lnurlp && (
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