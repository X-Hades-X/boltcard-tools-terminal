import styled from "styled-components";
import { BaseField, Picker as RootPicker } from "@components";
import { ActivityIndicator } from "react-native";


export const Field = styled(BaseField)`
    background-color: ${({ theme }) => theme.colors.white}
`;

export const Spinner = styled(ActivityIndicator)`
    left: -15px;
`;

export const Picker = styled(RootPicker)`
  position: absolute;
  opacity: 0;
  height: 100%;
  width: 100%;
  border: 0;
  background-color: transparent;
  padding: 0 12px;
  padding-top: 8px;
  font-size: 16px;
  font-family: Poppins-Medium;
  color: ${({ theme }) => theme.colors.primary};
`;