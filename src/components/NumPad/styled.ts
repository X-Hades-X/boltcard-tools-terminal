import styled from "styled-components";
import { View, ComponentStack, Icon, Button } from "@components";

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