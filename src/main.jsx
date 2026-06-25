import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import Success from "./Success";

const isSuccess = window.location.pathname === "/success";

createRoot(document.getElementById("root")).render(
  isSuccess ? <Success /> : <App />
);
