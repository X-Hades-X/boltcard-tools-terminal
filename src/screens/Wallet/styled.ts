import styled from "styled-components";
import {
  View,
  Text,
  Button,
  PageContainer,
  ComponentStack,
  Lottie, SelectField
} from "@components";

export const WalletPageContainer = styled(PageContainer).attrs(() => ({}))``;

export const TitleText = styled(Text)`
  color: ${({ theme }) => theme.colors.white};
  text-align: center;
`;

export const AmountText = styled(Text)`
  color: ${({ theme }) => theme.colors.white};
  min-height: 72px;
  font-size: 42px;
  text-align: center;
  margin: ${({ theme }) => `0px ${theme.gridSize / 2}px`};
  flex: 1;
`;

export const SatAmountText = styled(Text)`
  color: ${({ theme }) => theme.colors.white};
  text-align: center;
`;

export const InfoText = styled(Text)`
  color: ${({ theme }) => theme.colors.white};
  text-align: left;
  width: fit-content;
  margin: ${({ theme }) => `${theme.gridSize / 4}px ${theme.gridSize / 2}px`};
`;

export const DescriptionText = styled(Text)`
  color: ${({ theme }) => theme.colors.lightning};
  text-align: left;
  width: fit-content;
  margin: ${({ theme }) => `${theme.gridSize / 4}px ${theme.gridSize / 2}px`};
  height: 64px;
  padding-bottom: 12px;
`;

export const WalletButtonWrapper = styled(View)`
    display: flex;
    flex-direction: row;
`;

export const WalletValueWrapper = styled(View)`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: end;
    width: 100%;
`;

export const WalletButton = styled(Button)`
    margin: ${({ theme }) => `${theme.gridSize / 4}px ${theme.gridSize / 2}px`};
    width: 175px;
`;

export const WalletComponentStack = styled(ComponentStack)`
  align-items: center;
`;

export const CenterComponentStack = styled(ComponentStack)`
  align-items: center;
  justify-content: center;
  height: 100%;
`;

export const SuccessLottie = styled(Lottie)<{ size: number }>`
  ${({ size }) => `
    height: ${size}px;
    width: ${size}px;
  `}
  transform: scale(1.35);
`;

export const SuccessText = styled(Text)`
    color: ${({ theme }) => theme.colors.white};
    font-weight: bold;
    text-align: center;
`;

export const CurrencySelection = styled(SelectField)`
  width: 65px;
`;
