import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./pages/layout/main-layout";
import App from "./App";
import Login from "./pages/auth/login";
import Signup from "./pages/auth/signup";
import ForgotPassword from "./pages/auth/forgot-password";
import Profile from "./pages/profile/home";
import HomeFeed from "./pages/feed/home-feed";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomeFeed />,
      },
      { path: "profile/:id", element: <Profile /> },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  { path: "/signup", element: <Signup /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
]);

export default router;
