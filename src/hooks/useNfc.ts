import { platform } from "@config";
import { useCallback, useEffect, useState } from "react";
import { NFC } from "@utils";

const { isWeb, isNative, isIos, getIsNfcSupported } = platform;

export const useNfc = () => {
  const [nfcMessage, setNfcMessage] = useState<string>();
  const [isNfcAvailable, setIsNfcAvailable] = useState(false);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [isNfcNeedsTap, setIsNfcNeedsTap] = useState(false);
  const [isNfcNeedsPermission, setIsNfcNeedsPermission] = useState(false);

  const setupNfc = useCallback(async () => {
    if (await getIsNfcSupported()) {
      try {
        await NFC.init();
      } catch (e) {}

      if (isWeb) {
        let nfcStatus = {} as PermissionStatus;

        try {
          nfcStatus = await navigator.permissions.query({
            name: "nfc" as PermissionName
          });
        } catch (e) {}

        if (nfcStatus?.state === "granted") {
          setIsNfcAvailable(true);
          setIsNfcNeedsTap(false);
          setIsNfcNeedsPermission(false);
        } else {
          setIsNfcNeedsPermission(true);
          setIsNfcNeedsTap(true);
        }
      } else if (isNative) {
        setIsNfcAvailable(true);
        setIsNfcNeedsTap(isIos);
      }
    }
  }, []);

  const readingNfcLoop = useCallback(
    async () => {
      setNfcMessage(undefined);
      await NFC.stopRead();

      setIsNfcScanning(true);
      await NFC.startRead(async (message) => {
        setIsNfcScanning(false);
        setNfcMessage(message);
        await NFC.stopRead();
        setIsNfcAvailable(false);
      });
    }, []
  );

  const stopNfc = useCallback(() => {
    setIsNfcScanning(false);
    setIsNfcAvailable(false);
    void NFC.stopRead();
  }, []);

  useEffect(() => {
    return stopNfc;
  }, []);

  return {
    nfcMessage,
    isNfcAvailable,
    isNfcScanning,
    isNfcNeedsTap,
    isNfcNeedsPermission,
    setupNfc,
    stopNfc,
    readingNfcLoop
  };
};
