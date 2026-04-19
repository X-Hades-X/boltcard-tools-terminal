import styled from "styled-components";
import { BaseField, Picker as RootPicker } from "@components";
import { ActivityIndicator } from "react-native";


export const Field = styled(BaseField)`
  background-color: ${({ theme }) => theme.colors.white};
`;

export const Spinner = styled(ActivityIndicator)`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
`;

export const Picker = styled(RootPicker)`
  position: absolute;
  opacity: 0;
  height: 100%;
  width: 100%;
  border: 0;
  background-color: transparent;
  color: ${({ theme }) => theme.colors.primary};
`;