import React from "react";
import ReactDOM from "react-dom/client";
import "./index.scss";
import Layout from "./Pages/Layout/Layout";
import config from "./config.json";

document.title = config.productName;
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<Layout />);
