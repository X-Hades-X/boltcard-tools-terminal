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

export const DecoderButtonWrapper = styled(View)`
    display: flex;
    flex-direction: column;
    min-width: 80%;
`;

export const DecoderMinMaxWrapper = styled(View)`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    width: 100%;
`;

export const DecoderButton = styled(Button)`
    margin: ${({ theme }) => `${theme.gridSize / 4}px ${theme.gridSize / 2}px`};
`;

export const DecoderComponentStack = styled(ComponentStack)`
  align-items: center;
`;

export const CenterComponentStack = styled(ComponentStack)`
  align-items: center;
  justify-content: center;
  height: 100%;
`;
