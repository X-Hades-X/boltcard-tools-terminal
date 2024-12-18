import styled from "styled-components";
import { View, Text } from "@components";
import { StyleSheet } from "react-native";

export const PinPadContainer = styled(View)`
  background-color: transparent;
  align-items: center;
  flex: 1;
`;

export const PinPadTitle = styled(Text)`
  padding-top: 48px;
  padding-bottom: 24px;
  color: rgba(255,255,255,1);
  font-size: 48px;
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
});