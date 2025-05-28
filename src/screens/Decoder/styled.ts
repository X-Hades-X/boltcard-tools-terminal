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

export const DescriptionText = styled(Text)`
  color: ${({ theme }) => theme.colors.lightning};
  text-align: center;
  width: fit-content;
  margin: ${({ theme }) => `${theme.gridSize / 4}px ${theme.gridSize / 2}px`};
  padding-bottom: 12px;
`;

export const SectionTitle = styled(Text)`
    color: ${({ theme }) => theme.colors.white};
    font-weight: 500;
`;

export const DecoderMinMaxWrapper = styled(View)`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const DecoderLabel = styled(Text)`
    font-weight: 500;
    color: ${({ theme }) => theme.colors.bitcoin};
`;

export const DecoderValue = styled(Text)`
    font-size: 14px;
    color: ${({ theme }) => theme.colors.white};
`;

export const DecoderComponentStack = styled(ComponentStack)`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

export const DecoderGridStack = styled(ComponentStack)`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
`;

export const DecoderCenterStack = styled(ComponentStack)`
    display: flex;
    flex-direction: column;
    flex: 1;
`;

export const DecoderBottomView = styled(View)`
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 48px;
`;

export const CenterComponentStack = styled(ComponentStack)`
  align-items: center;
  justify-content: center;
  height: 100%;
`;
