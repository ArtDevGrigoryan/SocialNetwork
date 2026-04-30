import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./pages/layout/main-layout";
import Login from "./pages/auth/login";
import Signup from "./pages/auth/signup";
import ForgotPassword from "./pages/auth/forgot-password";
import Profile from "./pages/profile/home";
import HomeFeed from "./pages/feed/home-feed";
import Settings from "./pages/settings";
import Messages from "./pages/message";
import NotificationsPage from "./pages/notifications";
import ExplorePage from "./pages/explore";

// Settings Pages
import ArchiveSettings from "./pages/settings/archive";
import ChangePasswordSettings from "./pages/settings/change-password";
import EditProfileSettings from "./pages/settings/edit-profile";
import NotificationsSettings from "./pages/settings/notifications";
import PrivacySettings from "./pages/settings/privacy";
import RequestSettings from "./pages/settings/request";
import TwoFactorSettings from "./pages/settings/two-factor";
import VerifyEmailSettings from "./pages/settings/verify-email";
import BlockedUsersSettings from "./pages/settings/blocked-users";

// Նոր Settings էջերը
import SavesSettings from "./pages/settings/saves";
import RepostsSettings from "./pages/settings/reposts";
import FollowersSettings from "./pages/settings/followers";
import FollowingsSettings from "./pages/settings/followings";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomeFeed />,
      },
      { path: "explore", element: <ExplorePage /> },
      { path: "profile/:id", element: <Profile /> },
      {
        path: "settings",
        element: <Settings />,
        children: [
          { index: true, element: <EditProfileSettings /> },
          { path: "edit-profile", element: <EditProfileSettings /> },
          { path: "change-password", element: <ChangePasswordSettings /> },
          { path: "notifications", element: <NotificationsSettings /> },
          { path: "privacy", element: <PrivacySettings /> },
          { path: "request", element: <RequestSettings /> },
          { path: "two-factor", element: <TwoFactorSettings /> },
          { path: "verify-email", element: <VerifyEmailSettings /> },
          { path: "archive", element: <ArchiveSettings /> },
          { path: "blocked", element: <BlockedUsersSettings /> },
          { path: "saves", element: <SavesSettings /> },
          { path: "reposts", element: <RepostsSettings /> },
          { path: "followers", element: <FollowersSettings /> },
          { path: "followings", element: <FollowingsSettings /> },
        ],
      },
      { path: "messages", element: <Messages /> },
      { path: "messages/:chatId", element: <Messages /> },
      { path: "notifications", element: <NotificationsPage /> },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
]);

export default router;
