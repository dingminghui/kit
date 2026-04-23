import { AuthLayout } from "@/layouts/AuthLayout";
import { RootLayout } from "@/layouts/RootLayout";
import { About } from "@/pages/About";
import { Home } from "@/pages/Home";
import { Login } from "@/pages/Login";
import { createBrowserRouter } from "react-router";

export const router = createBrowserRouter([
  {
    path: "login",
    Component: RootLayout,
    children: [{ index: true, Component: Login }],
  },
  {
    path: "/",
    Component: AuthLayout,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: About },
    ],
  },
]);
