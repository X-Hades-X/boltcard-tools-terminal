import styled from "styled-components";
import {
  View,
  Text,
  PageContainer,
  ComponentStack,
  SelectField
} from "@components";

export const WalletPageContainer = styled(PageContainer).attrs(() => ({}))``;

export const ListItemWrapper = styled(View)`
  padding: ${({ theme }) => `${theme.gridSize / 2}px ${theme.gridSize}px`};
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

export const SatAmountSpace = styled(Text)`
    height: 22px;
`;

export const InfoText = styled(Text)`
  color: ${({ theme }) => theme.colors.white};
  text-align: left;
  width: fit-content;
  margin: ${({ theme }) => `${theme.gridSize / 4}px ${theme.gridSize / 2}px`};
`;

export const WalletMinMaxWrapper = styled(View)`
    display: flex;
    flex-direction: row;
`;

export const WalletErrorSpace = styled(View)`
    height: 50px;
`;

export const WalletErrorText = styled(Text)`
    color: ${({ theme }) => theme.colors.error};
    text-align: center;
    width: fit-content;
    margin: ${({ theme }) => `${theme.gridSize / 4}px ${theme.gridSize / 2}px`};
    height: 40px;
`;

export const WalletValueWrapper = styled(View)`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: end;
    margin: 0 12px;
`;

export const WalletComponentStack = styled(ComponentStack)`
    margin-top: 42px;
    align-items: center;
`;

export const CurrencySelection = styled(SelectField)`
  width: 65px;
`;
