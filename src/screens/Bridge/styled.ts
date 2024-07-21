import styled from "styled-components";
import {
  View,
  Text,
  Button,
  PageContainer,
  ComponentStack,
  Lottie
} from "@components";

export const BridgePageContainer = styled(PageContainer).attrs(() => ({}))``;

export const TitleText = styled(Text)`
  color: ${({ theme }) => theme.colors.white};
  text-align: center;
`;

export const AmountText = styled(Text)`
  color: ${({ theme }) => theme.colors.white};
  min-height: 72px;
  text-align: center;
  margin: ${({ theme }) => `${theme.gridSize / 2}px ${theme.gridSize}px`};
`;

export const InfoText = styled(Text)`
  color: ${({ theme }) => theme.colors.white};
  text-align: left;
  width: fit-content;
  margin: ${({ theme }) => `${theme.gridSize / 4}px ${theme.gridSize / 2}px`};
`;

export const BridgeButtonWrapper = styled(View)`
    display: flex;
    flex-direction: row;
`;

export const BridgeButton = styled(Button)`
    margin: ${({ theme }) => `${theme.gridSize / 4}px ${theme.gridSize / 2}px`};
    width: 175px;
`;

export const BridgeComponentStack = styled(ComponentStack)`
  align-items: center;
`;

export const SuccessComponentStack = styled(ComponentStack)`
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
