import styled from "styled-components";
import {
  View,
  Text,
  Button,
  PageContainer,
  ComponentStack,
} from "@components";

export const DecoderPageContainer = styled(PageContainer).attrs(() => ({}))``;

export const TitleText = styled(Text)`
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
  text-align: center;
  width: fit-content;
  margin: ${({ theme }) => `${theme.gridSize / 4}px ${theme.gridSize / 2}px`};
  padding-bottom: 12px;
`;

export const DecoderMinMaxWrapper = styled(View)`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
`;

export const DecoderComponentStack = styled(ComponentStack)`
  align-items: center;
`;

export const CenterComponentStack = styled(ComponentStack)`
  align-items: center;
  justify-content: center;
  height: 100%;
`;

export const ScaledDownButton = styled(Button)`
    transform: scale(0.8);
    margin: -42px;
`;
