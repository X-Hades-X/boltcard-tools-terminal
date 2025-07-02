import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "react-native-toast-notifications";
import { useTranslation } from "react-i18next";

const COIN = 100000000;
const satCurrency = { label: "SAT", value: 1 };
const coinCurrency = { label: "BTC", value: COIN };

export const useRates = () => {
  const toast = useToast();
  const { t } = useTranslation(undefined, { keyPrefix: "common" });
  const [rates, setRates] =
    useState<{ [k in string]: { [key in string]: number } }>();

  const getRate = useCallback((currencyShort: string) => {
    let newRate = satCurrency;
    if (currencyShort === "SAT") {
      newRate = satCurrency;
    } else if (currencyShort === "BTC") {
      newRate = coinCurrency;
    } else if (rates && "BTC" + currencyShort in rates && "BTC" in rates["BTC" + currencyShort]) {
      newRate = { label: currencyShort, value: rates["BTC" + currencyShort].BTC * COIN };
    }
    return newRate;
  }, [rates]);

  useEffect(() => {
    (async () => {
      try {
        const { data: getRatesData } = await axios.get<{
          data: typeof rates;
        }>("https://api.opennode.com/v1/rates");
        setRates(getRatesData.data);
      } catch (e) {
        toast.show(t("unableGetRates"), { type: "error" });
      }
    })();
  }, []);

  return { rates, getRate, satCurrency };
};
