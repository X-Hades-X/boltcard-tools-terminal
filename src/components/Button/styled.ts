import { Icon, Loader, Pressable, Text, View } from "@components";
import { getShadow } from "@utils";
import { platform } from "@config";
import styled from "styled-components";

type Mode = "normal" | "outline";
type Size = "small" | "medium" | "large" | "huge" | "circle";

const getPadding = (size: Size) => {
  switch (size) {
    case "small":
      return 12;
    case "medium":
      return 18;
    case "large":
      return 18;
    case "huge":
      return 24;
    case "circle":
      return 0;
  }
};

export const Button = styled(Pressable)<{
  mode: Mode;
  size: Size;
  primaryColor: string;
  isRound: boolean;
  isWhiteBackground?: boolean;
  isIconRight?: boolean;
  isIconTop?: boolean;
}>`

  ${({
    theme,
    mode,
    size,
    primaryColor,
    isRound,
    disabled,
    isWhiteBackground,
    isIconRight,
    isIconTop
  }) => {
    const height = (() => {
      switch (size) {
        case "small":
          return 32;
        case "medium":
          return 48;
        case "large":
          return 74;
        case "huge":
          return 200;
        case "circle":
          return 280;
        default:
          return 0;
      }
    })();

    const borderSize = size === "small" ? 3 : 4;
    const borderRadius = size === "small" ? height / 2 : theme.borderRadius;

    const disabledColor = isWhiteBackground
      ? theme.colors.secondaryLight
      : theme.colors.primaryLight;

    const flexDirection = isIconTop ? "column" : 
            isIconRight ? "row-reverse" : "row";

    return `
      flex-direction: ${flexDirection};
      ${
        mode === "normal"
          ? `background-color: ${!disabled ? primaryColor : disabledColor};`
          : `
            background-color: ${theme.colors.primary};
            border: ${borderSize}px solid ${
              !disabled ? primaryColor : disabledColor
            };`
      }
      border-radius: ${borderRadius}px;
      padding: ${size === "huge" ? getPadding(size) : 0}px ${getPadding(size)}px;
      height: ${height}px;
      ${size !== "small" ? "width: 100%; flex-shrink: 1;" : ""}
      ${
        isRound
          ? `width: ${height}px; border-radius: ${
              height / 2
            }px; flex-direction: column;`
          : ""
      }
      ${disabled ? "opacity: 1;" : "cursor: pointer;"}
      ${getShadow(
        size === "circle" ? { level: 8, shadowColor: primaryColor } : undefined
      )}
    `;
  }}

  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-sizing: border-box;
`;

export const ButtonContent = styled(View)`
  height: 100%;
  width: 100%;
`;

const getIconSize = (size: Size) => {
  switch (size) {
    case "small":
      return 12;
    case "medium":
      return 22;
    case "large":
      return 22;
    case "huge":
      return 36;
    case "circle":
      return 68;
  }
};

type ButtonIconProps = {
  buttonSize: Size;
};

export const ButtonIcon = styled(Icon)
  .attrs(({ buttonSize }: ButtonIconProps) => ({
    size: getIconSize(buttonSize)
  }))
  .withConfig({
    shouldForwardProp: (prop) => !["buttonSize"].includes(prop)
  })<ButtonIconProps>``;

type ButtonTextProps = {
  buttonSize: Size;
  hasIcon: boolean;
  isIconRight: boolean;
  isIconTop: boolean;
};

const TEXT_MARGIN = 6;

export const ButtonText = styled(Text).attrs(
  ({ buttonSize }: ButtonTextProps) => {
    return {
      h3: buttonSize === "circle" || buttonSize === "huge",
      h4: buttonSize === "medium" || buttonSize === "large",
      h5: buttonSize === "small"
    };
  }
)<ButtonTextProps>`
  ${({ hasIcon, buttonSize, isIconRight, isIconTop }) => {
    const iconPlusMarginSize = hasIcon && !isIconTop
      ? getIconSize(buttonSize) + TEXT_MARGIN
      : 0;

    return `
      margin-left: ${hasIcon && !isIconRight ? TEXT_MARGIN : 0}px;
      margin-${buttonSize !== "circle" && !isIconTop ? "right" : "top"}: ${
        buttonSize === "circle" || isIconRight
          ? TEXT_MARGIN * 1.5
          : isIconTop ? TEXT_MARGIN * 2
          : buttonSize !== "small"
          ? iconPlusMarginSize
          : 0
      }px;    
      ${
        buttonSize !== "small" && buttonSize !== "circle" && buttonSize !== "huge"
          ? "flex: 1;"
          : !platform.isWeb
          ? "top: 1px;"
          : ""
      }
    `;
  }}

  position: relative;
  text-align: center;
`;

export const ButtonLoader = styled(Loader)`
  position: absolute;
  opacity: 0.85;
`;
