import styled from "styled-components";
import {
  View,
  PageContainer,
  ComponentStack,
} from "@components";

export const DecoderPageContainer = styled(PageContainer).attrs(() => ({}))``;

export const ListItemWrapper = styled(View)`
    padding: ${({ theme }) => `${theme.gridSize / 2}px ${theme.gridSize}px`};
`;

export const DecoderComponentStack = styled(ComponentStack)`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

export const DecoderSpacerStack = styled(ComponentStack)`
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
