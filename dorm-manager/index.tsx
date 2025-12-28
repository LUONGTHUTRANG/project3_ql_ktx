import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConfigProvider } from "antd";

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ConfigProvider
        theme={{
          token: {
            fontFamily: "Lexend, ui-sans-serif, system-ui",
          },
        }}
      >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);