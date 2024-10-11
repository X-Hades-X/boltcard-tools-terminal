import styled from "styled-components";
import { View, Text } from "@components";
import { StyleSheet } from "react-native";

export const PinPadContainer = styled(View)`
  backgroundColor: transparent;
  alignItems: center;
  flex: 1;
`;

export const PinPadTitle = styled(Text)`
  paddingTop: 48px;
  paddingBottom: 24px;
  color: rgba(255,255,255,1);
  fontSize: 48px;
`;

export const BottomDrawerStyles = StyleSheet.create({
    container: {
        backgroundColor:  "rgba(0,0,0,0.5)",
    },
    handleContainer: {
      backgroundColor:  "transparent",
    }
});

export const PinViewStyles = StyleSheet.create({
    whiteBorder: {
      borderWidth: 1,
      borderColor: "#FFF",
    },
    whiteBorderTransparent: {
      borderWidth: 1,
      borderColor: "#FFF",
      backgroundColor: "transparent"
    },
    transparent: {
      borderWidth: 0,
      backgroundColor: "transparent"
    },
});

export const CustomButtonStyle = styled(Text)`
    text-align: center;
    align-items: center;
    background: transparent;
    font-size: 22px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.white};
    border: 1px solid ${({ theme }) => theme.colors.white};
    border-radius: 30px;
    height: 60px;
    width: 60px;
`