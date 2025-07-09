import styled from "styled-components";
import { Text, View } from "@components";
import { platform } from "@config";

const HORIZONTAL_PADDING = 4;
const DEFAULT_LEFT = 11;

const FIELD_HEIGHT = 54;

const { isNative } = platform;

export const BaseFieldContainer = styled(View)<{
  disabled?: boolean;
  error?: boolean;
  isFlexHeight?: boolean;
}>`
  ${({ theme, disabled, error, isFlexHeight }) => `
    border: 3px solid ${error ? theme.colors.error : theme.colors.primaryLight};
    background-color: ${disabled ? theme.colors.greyLight : theme.colors.white};
    ${
      !isFlexHeight
        ? `height: ${FIELD_HEIGHT}px;`
        : `${isNative ? "flex: 1;" : ""}`
      }
      border-radius: ${theme.borderRadius}px;
  `}
  position: relative;
  width: fit-content;
  flex-direction: row;
`;

export const ValueText = styled(Text)<{
  paddingTop?: number
}>`
  width: fit-content;
  padding-left: ${DEFAULT_LEFT + HORIZONTAL_PADDING}px;
  padding-right: ${DEFAULT_LEFT + HORIZONTAL_PADDING}px;
  font-family: Poppins-Medium;
  background-color: transparent;
  font-size: 16px;
`;

export const BadgeContainer = styled(View)`
  flex-direction: row;
`;
