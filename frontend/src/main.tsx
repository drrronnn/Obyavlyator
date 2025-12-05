import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";
import { GoogleAuthProviderWrapper } from "./config/googleProvider.tsx";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleAuthProviderWrapper>
        <Provider>
          <App />
        </Provider>
      </GoogleAuthProviderWrapper>
    </BrowserRouter>
  </React.StrictMode>,
);
