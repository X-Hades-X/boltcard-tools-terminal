import { useRef, useState, useEffect } from 'react';
import ReactNativePinView from "react-native-pin-view";
import BottomDrawer, {
  BottomDrawerMethods,
} from 'react-native-animated-bottom-drawer';
import { Icon } from "@components";
import { faDeleteLeft } from "@fortawesome/free-solid-svg-icons";
import * as S from "./styled";

type PinViewFunctions = {
  clearAll: () => void;
};

type PinPadProps = {
  onPinEntered: (pin: string) => void;
  pinMode: boolean;
  floatAllowed?: boolean;
}

const LeftButton = () => <Icon icon={faDeleteLeft} size={36} color={"#FFF"} />;
const RightButton = () => <S.CustomButtonStyle>.</S.CustomButtonStyle>;

export const PinPad = (props: PinPadProps) => {
  const pinView = useRef<PinViewFunctions>(null);
  const bottomDrawerRef = useRef<BottomDrawerMethods>(null);
  const [showRemoveButton, setShowRemoveButton] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [buttonPressed, setButtonPressed] = useState("");

  useEffect(() => {
    if (enteredPin.length > 0) {
      setShowRemoveButton(true)
    } else {
      setShowRemoveButton(false)
    }
    if (enteredPin.length === 4 && props.pinMode) {
        props.onPinEntered(enteredPin)
    } else if (!props.pinMode) {
        props.onPinEntered(enteredPin)
    }
  }, [enteredPin]);

  useEffect(() => {
      if (buttonPressed === "custom_left" && pinView.current) {
        pinView.current.clearAll()
      } else if(buttonPressed === "custom_right" && props.floatAllowed) {
        //TODO figure out how to enter decimal
      }
  }, [buttonPressed, props, pinView]);

  const numPad = (
    <S.PinPadContainer>
      {props.pinMode ? (
          <S.PinPadTitle>
            Boltcard PIN
          </S.PinPadTitle>
      ): null }
      <ReactNativePinView
        inputSize={32}
        // @ts-ignore
        ref={pinView}
        pinLength={props.pinMode ? 4 : 9}
        buttonSize={60}
        onValueChange={value => setEnteredPin(value)}
        buttonAreaStyle={{ marginTop: 24 }}
        inputAreaStyle={props.pinMode ? { marginBottom: 24 } : { height: 0 }}
        inputViewEmptyStyle={props.pinMode ? S.PinViewStyles.whiteBorderTransparent : S.PinViewStyles.transparent}
        inputViewFilledStyle={props.pinMode ? { backgroundColor: "#FFF" } : S.PinViewStyles.transparent }
        buttonViewStyle={S.PinViewStyles.whiteBorder}
        buttonTextStyle={{ color: "#FFF" }}
        onButtonPress={key => setButtonPressed(key)}
        // @ts-ignore
        customLeftButton={showRemoveButton ? <LeftButton /> : undefined}
        // @ts-ignore
        // customRightButton={props.floatAllowed ? <RightButton /> : undefined}
      />
    </S.PinPadContainer>
  );

  return (
    <>
    {props.pinMode ? (
        <BottomDrawer
            ref={bottomDrawerRef}
            openOnMount gestureMode={"none"}
            closeOnBackdropPress={false}
            initialHeight={535}
            backdropOpacity={0}
            customStyles={S.BottomDrawerStyles}
        >
            {numPad}
        </BottomDrawer >
        ) : (
        <>
            {numPad}
        </>
    )}
    </>
  );
}