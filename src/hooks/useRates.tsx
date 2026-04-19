import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import axios from "axios";
import { useToast } from "react-native-toast-notifications";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Rate = { label: string; value: number };

type RatesMap = { [k in string]: { [key in string]: number } };

const COIN = 100_000_000;
const RATES_URL = "https://api.opennode.com/v1/rates";
const STORAGE_KEY = "@rate";

const satCurrency: Rate = { label: "SAT", value: 1 };
const coinCurrency: Rate = { label: "BTC", value: COIN };

type RatesContextValue = {
  rates: RatesMap | undefined;
  currentRate: Rate;
  loading: boolean;
  getRate: (currencyShort: string) => Rate;
  updateCurrentRate: (rate: Rate) => Promise<void>;
  getFiatAmount: (satoshis?: number) => number | undefined;
};

const RatesContext = createContext<RatesContextValue | undefined>(undefined);

/**
 * Single source of truth for the exchange-rate state.
 *
 * Wrap the app root in `<RatesProvider>` and consume with `useRates()`.
 * This replaces the previous hook that each component instantiated
 * separately, so rate fetching / currency selection now happens exactly
 * once per app session.
 */
export const RatesProvider = ({ children }: { children: ReactNode }) => {
  const toast = useToast();
  const { t } = useTranslation(undefined, { keyPrefix: "common" });

  const [rates, setRates] = useState<RatesMap>();
  const [currentRate, setCurrentRate] = useState<Rate>(satCurrency);
  const [loading, setLoading] = useState(false);

  const getRate = useCallback(
    (currencyShort: string): Rate => {
      if (currencyShort === "SAT") return satCurrency;
      if (currencyShort === "BTC") return coinCurrency;
      const pair = rates?.[`BTC${currencyShort}`];
      if (pair && "BTC" in pair) {
        return { label: currencyShort, value: pair.BTC * COIN };
      }
      return satCurrency;
    },
    [rates]
  );

  const loadStoredRate = useCallback(async () => {
    const storedRate = await AsyncStorage.getItem(STORAGE_KEY);
    if (storedRate) {
      setCurrentRate(getRate(storedRate));
    }
  }, [getRate]);

  // Restore the user's preferred currency once the rates table has loaded
  // (so non-SAT/BTC codes can be resolved).
  useEffect(() => {
    if (rates) {
      void loadStoredRate();
    }
  }, [rates, loadStoredRate]);

  // Fetch rates once at startup.
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: getRatesData } = await axios.get<{ data: RatesMap }>(
          RATES_URL,
          { timeout: 15_000 }
        );
        setRates(getRatesData.data);
      } catch {
        toast.show(t("errors.unableGetRates"), { type: "error" });
      } finally {
        setLoading(false);
      }
    })();
  }, [t, toast]);

  const updateCurrentRate = useCallback(async (rate: Rate) => {
    await AsyncStorage.setItem(STORAGE_KEY, rate.label);
    setCurrentRate(rate);
  }, []);

  const getFiatAmount = useCallback(
    (satoshis?: number) => {
      if (currentRate.label === "SAT" || currentRate.label === "BTC") {
        return undefined;
      }
      return satoshis
        ? Math.ceil((satoshis / currentRate.value) * 100) / 100
        : undefined;
    },
    [currentRate]
  );

  const value = useMemo<RatesContextValue>(
    () => ({
      rates,
      currentRate,
      loading,
      getRate,
      updateCurrentRate,
      getFiatAmount
    }),
    [rates, currentRate, loading, getRate, updateCurrentRate, getFiatAmount]
  );

  return (
    <RatesContext.Provider value={value}>{children}</RatesContext.Provider>
  );
};

export const useRates = (): RatesContextValue => {
  const ctx = useContext(RatesContext);
  if (!ctx) {
    throw new Error(
      "useRates must be used inside a <RatesProvider>. Did you forget to wrap <App /> ?"
    );
  }
  return ctx;
};
