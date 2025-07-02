import { forwardRef, useEffect, useState } from "react";
import * as S from "./styled";
import { useRates } from "@hooks";
import { ItemProps } from "@components/Picker/Picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ItemValue, Picker } from "@react-native-picker/picker/typings/Picker";


type CurrencySelectProps = {
  onChange?: (event: { label: string, value: number }) => void;
};

export const CurrencySelect = forwardRef<Picker<ItemValue>, CurrencySelectProps>(
  ({onChange}, ref) => {

    const { rates, getRate, satCurrency } = useRates();
    const [rateItems, setRateItems] = useState<ItemProps[]>([]);
    const [currentRate, setCurrentRate] = useState<{ label: string, value: number }>(satCurrency);

    const loadData = async () => {
      const storedRate = await AsyncStorage.getItem("@rate");
      if (storedRate) {
        setCurrentRate(getRate(storedRate));
      }
    };

    const onRateChanged = async (currencyShort: string) => {
      await AsyncStorage.setItem("@rate", currencyShort);
      setCurrentRate(getRate(currencyShort));
    };

    useEffect(() => {
      if (rates !== undefined) {
        const ratesAsItems = [{ label: "SAT - Satoshi", value: "SAT" }, { label: "BTC - Bitcoin", value: "BTC" }];
        for (const pair in rates) {
          const currentPair = rates[pair];
          const currencyShort = Object.keys(currentPair).filter(key => key !== "currency" && key !== "BTC").pop();
          if ("currency" in currentPair && currencyShort) {
            ratesAsItems.push({ label: `${currencyShort} - ${currentPair.currency}`, value: currencyShort });
          }
        }
        setRateItems(ratesAsItems);
        void loadData();
      }
    }, [rates]);

    useEffect(() => {
      onChange?.(currentRate);
    }, [currentRate]);

    return (
      <S.Field
        value={rateItems.find((i) => i.value === currentRate.label)?.value || ""}
        paddingTop={0}
        defaultLeft={4}
        component={
          <S.Picker
            ref={ref}
            selectedValue={`${currentRate.label}`}
            onValueChange={(val)=>onRateChanged(`${val}`)}
            items={rateItems}
          />
        }
      />
    );
  }
);
