import styled from "styled-components";
import { BaseField, Picker as RootPicker } from "@components";


export const Field = styled(BaseField)`
    width: 55px;
    background-color: ${({ theme }) => theme.colors.white}
`;

export const Picker = styled(RootPicker)`
  position: absolute;
  opacity: 0;
  height: 100%;
  width: 100%;
  border: 0px;
  background-color: transparent;
  padding: 0px 12px;
  padding-top: 8px;
  font-size: 16px;
  font-family: Poppins-Medium;
  color: ${({ theme }) => theme.colors.primary};
`;