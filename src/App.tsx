import { Routes, Route } from "@components/Router";
import { StatusBar } from "@components";
import { Home, QRScanner, Invoice, Bridge } from "@screens";
import { useBackHandler, useDeepLink, useSplashScreen } from "@hooks";

const App = () => {
  useDeepLink();
  useBackHandler();
  useSplashScreen();

  return (
    <>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="qr-scanner" element={<QRScanner />} />
        <Route path="invoice" element={<Invoice />} />
        <Route path="bridge" element={<Bridge />} />
      </Routes>
    </>
  );
};

export default App;
