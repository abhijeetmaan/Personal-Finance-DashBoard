import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource/inter";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import App from "./App";
import "./styles/global.css";
import { registerServiceWorker } from "./pwa/registerServiceWorker";
import { ToastProvider } from "./components/ui/ToastProvider";
import { DateRangeProvider } from "./context/DateRangeContext";
import { AddTransactionModalProvider } from "./context/AddTransactionModalContext";

registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <DateRangeProvider>
        <ToastProvider>
          <AddTransactionModalProvider>
            <App />
          </AddTransactionModalProvider>
        </ToastProvider>
      </DateRangeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
