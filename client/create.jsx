import React from "react";
import { createRoot } from "react-dom/client";
import AppRoutes from "./routes.jsx";

export default function createApp() {
  const rootElement = document.getElementById("root");
  const root = createRoot(rootElement);
  root.render(<AppRoutes />);
} 