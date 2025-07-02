import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "react-native-toast-notifications";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Rate = { label: string; value: number }

const COIN = 100000000;
const satCurrency = { label: "SAT", value: 1 };
const coinCurrency = { label: "BTC", value: COIN };

export const useRates = () => {
  const toast = useToast();
  const { t } = useTranslation(undefined, { keyPrefix: "common" });
  const [rates, setRates] =
    useState<{ [k in string]: { [key in string]: number } }>();
  const [currentRate, setCurrentRate] = useState<Rate>(satCurrency);

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

        // 2️⃣ Load preferred currency
        const storedRate = await AsyncStorage.getItem("@rate");
        if (storedRate) {
          const rate = getRate(storedRate);
          setCurrentRate(rate);
        }
      } catch (e) {
        toast.show(t("unableGetRates"), { type: "error" });
      }
    })();
  }, [getRate]);

  const updateCurrentRate = useCallback(async (rate: Rate) => {
    await AsyncStorage.setItem("@rate", rate.label);
    setCurrentRate(rate);
  }, []);

  const getFiatAmount = useCallback((rate: Rate, satoshis?: number) => {
    return satoshis ? Math.ceil(satoshis / rate.value * 100) / 100 : undefined;
  }, []);

  return { rates, getRate, currentRate, updateCurrentRate, getFiatAmount };
};
