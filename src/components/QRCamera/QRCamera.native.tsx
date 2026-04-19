import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Camera,
  CodeScanner,
  useCameraDevices,
  useCameraFormat,
  useCodeScanner
} from "react-native-vision-camera";
import { QRScannerProps } from "./QRCamera";
import { StyleSheet } from "react-native";
import { Loader } from "@components/Loader";
import * as S from "./styled";

export const QRCamera = ({
  onScan,
  setConfig,
  isTorchOn,
  deviceIndex,
  videoHeight,
  isActive = true,
  resizeMode = "cover",
  style
}: QRScannerProps) => {
  const devices = useCameraDevices();

  const [isLoading, setIsLoading] = useState(true);

  const device = useMemo(() => {
    if (deviceIndex === undefined) {
      return null;
    }
    return devices[deviceIndex];
  }, [devices, deviceIndex]);

  // Force a 720p30 SDR format. Without an explicit format, vision-camera
  // sometimes lands on a native camera session where the auto-exposure /
  // auto-focus / auto-white-balance (3A) control loop never engages on
  // AOSP-adjacent Android devices (e.g. Fairphone): the preview stays at
  // minimum exposure and never adapts to scene brightness. A common,
  // widely-supported baseline format is the most reliable way to hit the
  // HAL path that actually runs 3A.
  const format = useCameraFormat(device ?? undefined, [
    { videoResolution: { width: 1280, height: 720 } },
    { fps: 30 },
    { videoHdr: false },
    { photoHdr: false }
  ]);

  useEffect(() => {
    setConfig({
      isActive: true,
      hasTorch: device?.hasTorch || false,
      defaultIndex: devices.findIndex((d) => d.position === "back"),
      devicesNumber: devices.length
    });
  }, [device]);

  useEffect(() => {
    (async () => {
      await Camera.requestCameraPermission();
      setIsLoading(false);
    })();
  }, []);

  const onCodeScanned = useCallback<CodeScanner["onCodeScanned"]>(
    (codes) => {
      if (codes[0].value) {
        onScan(codes[0].value);
      }
    },
    [onScan]
  );

  const codeScanner = useCodeScanner({
    codeTypes: ["qr"],
    onCodeScanned
  });

  return !!device && !isLoading ? (
    <S.Camera
      isActive={isActive}
      key={device.id}
      device={device}
      format={format}
      // Request neutral (0) exposure bias so auto-exposure runs unbiased.
      // Without this, a missing prop on some vision-camera / CameraX HAL
      // paths leaves exposure uninitialised and the preview dark.
      exposure={0}
      // Opt into the HAL's low-light path when the sensor advertises it.
      // Modest effect by itself, but helps on devices whose default AE
      // range is too conservative for indoor lighting.
      lowLightBoost={device.supportsLowLightBoost || undefined}
      torch={isTorchOn ? "on" : "off"}
      codeScanner={codeScanner}
      style={StyleSheet.flatten([
        style,
        {
          height: videoHeight as number
        }
      ])}
      resizeMode={resizeMode}
    />
  ) : (
    <Loader />
  );
};
