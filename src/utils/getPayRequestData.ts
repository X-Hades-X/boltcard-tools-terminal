import qs from "query-string";
import { validateBitcoinAddress } from "./validateBitcoinAddress";
import axios from "axios";

type PayRequest = {
    tag?: string;
    callback?: string;
    description?: string;
    minSendable?: number;
    maxSendable?: number;
    commentAllowed?: number;
};

export const getPayRequestData = async (value: string) => {
  let callback: string | undefined;
  let description: string | undefined;
  let minSendable: number | undefined;
  let maxSendable: number | undefined;

  let isValid = true;
  try{
      const splitLnAddress = value.split("@");
      const { data: payRequestData } = await axios.get<PayRequest>(
        splitLnAddress.length == 1 ?
            splitLnAddress[0] :
            `https://${splitLnAddress[1]}/.well-known/lnurlp/${splitLnAddress[0]}`
      );
      callback = payRequestData.callback;
      description = payRequestData.description;
      minSendable = payRequestData.minSendable;
      maxSendable = payRequestData.maxSendable;
  } catch (e) {
    isValid = false;
  }

  isValid = isValid && !!callback && !!minSendable;

  return {
    callback,
    description,
    minSendable,
    maxSendable,
    isValid
  };
};
