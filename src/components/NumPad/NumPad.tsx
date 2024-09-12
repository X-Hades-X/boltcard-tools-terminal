import React, { useState, useCallback } from "react";
import { faDeleteLeft } from "@fortawesome/free-solid-svg-icons";
import * as S from "./styled";
import { ComponentStack, Pressable } from "@components";

type NumPadProps = {
  value: string;
  onNumberEntered: (number: string) => void;
  title?: string;
  showValue?: boolean;
  fixed?: number;
}

const MAX_LENGTH = 9;

export const NumPad = (props: NumPadProps) => {
  const [value, setValue] = useState<string>(props.value);
  const [maxFloating] = useState(props.fixed || 0);

  const onButtonPress = useCallback((buttonPressed: string) => {
    let newValue = value;
    if (buttonPressed === "bck") {
      newValue = value.slice(0, value.length - 1);
      if(newValue === "0") {
        newValue = "";
      }
    } else if (buttonPressed === ".") {
      if (value.indexOf(".") < 0 && props.fixed) {
        if(value.length === 0) {
          newValue = "0";
        }
        newValue += buttonPressed;
      }
    } else if (buttonPressed !== "0" || value.length > 0) {
      newValue = value + buttonPressed;
    }

    setValue(newValue);
    props.onNumberEntered(newValue);
  }, [value, props]);

  const isNumButtonsDisabled = useCallback(() => {
    if (value.length === MAX_LENGTH) {
      return true;
    } else {
      return value.indexOf(".") >= 0 && maxFloating > 0 && maxFloating <= value.length - (value.indexOf(".") + 1);
    }
  }, [value, maxFloating]);

  return (
    <>
      <ComponentStack>
        {props.title ?
          <S.NumPadTitle>
            Test Title
          </S.NumPadTitle> : null}
        {props.title ?
          <S.AmountText>
            {value}
          </S.AmountText> : null}
      <S.NumPadNumberContainer>
        <S.NumPadNumberRow>
          <S.NumPadButtonStyle
            mode="normal"
            type="primary"
            title={"1"}
            onPress={() => onButtonPress("1")}
            disabled={isNumButtonsDisabled()}
          />
          <S.NumPadButtonStyle
            mode="normal"
            type="primary"
            title={"2"}
            onPress={() => onButtonPress("2")}
            disabled={isNumButtonsDisabled()}
          />
          <S.NumPadButtonStyle
            mode="normal"
            type="primary"
            title={"3"}
            onPress={() => onButtonPress("3")}
            disabled={isNumButtonsDisabled()}
          />
        </S.NumPadNumberRow>
        <S.NumPadNumberRow>
          <S.NumPadButtonStyle
            mode="normal"
            type="primary"
            title={"4"}
            onPress={() => onButtonPress("4")}
            disabled={isNumButtonsDisabled()}
          />
          <S.NumPadButtonStyle
            mode="normal"
            type="primary"
            title={"5"}
            onPress={() => onButtonPress("5")}
            disabled={isNumButtonsDisabled()}
          />
          <S.NumPadButtonStyle
            mode="normal"
            type="primary"
            title={"6"}
            onPress={() => onButtonPress("6")}
            disabled={isNumButtonsDisabled()}
          />
        </S.NumPadNumberRow>
        <S.NumPadNumberRow>
          <S.NumPadButtonStyle
            mode="normal"
            type="primary"
            title={"7"}
            onPress={() => onButtonPress("7")}
            disabled={isNumButtonsDisabled()}
          />
          <S.NumPadButtonStyle
            mode="normal"
            type="primary"
            title={"8"}
            onPress={() => onButtonPress("8")}
            disabled={isNumButtonsDisabled()}
          />
          <S.NumPadButtonStyle
            mode="normal"
            type="primary"
            title={"9"}
            onPress={() => onButtonPress("9")}
            disabled={isNumButtonsDisabled()}
          />
        </S.NumPadNumberRow>
        <S.NumPadNumberRow>
          {value.length > 0 ?
            <Pressable onPress={() => onButtonPress("bck")}>
              <S.NumPadIconStyle icon={faDeleteLeft} size={42} color={"#FFF"} />
            </Pressable> : <S.EmptySpace />}
          <S.NumPadButtonStyle
            mode="normal"
            type="primary"
            title={"0"}
            disabled={value.length === 0 || isNumButtonsDisabled()}
            onPress={() => onButtonPress("0")}
          />
          {props.fixed ?
            <S.NumPadButtonStyle
              mode="normal"
              type="primary"
              title={"."}
              disabled={value.indexOf(".") > 0 || value.length >= (MAX_LENGTH - 1)}
              onPress={() => onButtonPress(".")}
            /> : <S.EmptySpace />}
        </S.NumPadNumberRow>
      </S.NumPadNumberContainer>
      </ComponentStack>
    </>
  );
};