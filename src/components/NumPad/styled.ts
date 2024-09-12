import styled from "styled-components";
import { View, Text, ComponentStack, Icon, Button } from "@components";

export const NumPadNumberContainer = styled(ComponentStack)`
    display: flex;
    flex-direction: column;
`
export const NumPadNumberRow = styled(View)`
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    width: 100%;
`

export const NumPadButtonStyle = styled(Button)`
    font-size: 22px;
    font-weight: bold;
    border: 1px solid ${({ theme }) => theme.colors.white};
    border-radius: 30px;
    height: 60px;
    width: 60px;
`

export const EmptySpace = styled(View)`
    width: 60px;
    height: 60px;
`

export const NumPadIconStyle = styled(Icon)`
    margin: 6px;
`

export const NumPadTitle = styled(Text)`
  color: rgba(255,255,255,1);
  font-size: 48px;
    height: 80px;
`;

export const AmountText = styled(Text)`
  color: ${({ theme }) => theme.colors.white};
  text-align: center;
  margin: ${({ theme }) => `0px ${theme.gridSize / 2}px`};
    flex: 1;
    font-size: 48px;
    height: 80px;
`;