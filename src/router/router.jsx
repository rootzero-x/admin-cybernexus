import React from "react";
import App from "../App.jsx";
import { createBrowserRouter } from "react-router-dom";
import { ErrorPage } from "../pages/Error/ErrorPage.jsx";
import { LoginPage } from "../pages/Auth/LoginPage.jsx";
import { TwoFAPage } from "../pages/Auth/TwoFAPage.jsx";
import { DashboardPage } from "../pages/Dashboard/DashboardPage.jsx";
import { UsersPage } from "../pages/Users/UsersPage.jsx";
import { SessionsPage } from "../pages/Sessions/SessionsPage.jsx";
import { MessagesPage } from "../pages/Messages/MessagesPage.jsx";
import { CertificatesPage } from "../pages/Certificates/CertificatesPage.jsx";
import { NewsPage } from "../pages/News/NewsPage.jsx";
import { VisitsPage } from "../pages/Visits/VisitsPage.jsx";
import { BotPage } from "../pages/Bot/BotPage.jsx";
import { AuditPage } from "../pages/Audit/AuditPage.jsx";
import { RequireAdmin } from "../shared/auth/RequireAdmin.jsx";

/** Every admin screen is gated the same way; this keeps the table below readable. */
const guarded = (Page) => (
  <RequireAdmin>
    <Page />
  </RequireAdmin>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <LoginPage /> },
      { path: "2fa", element: <TwoFAPage /> },

      { path: "admin", element: guarded(DashboardPage) },
      { path: "admin/users", element: guarded(UsersPage) },
      { path: "admin/sessions", element: guarded(SessionsPage) },
      { path: "admin/messages", element: guarded(MessagesPage) },
      { path: "admin/certificates", element: guarded(CertificatesPage) },
      { path: "admin/news", element: guarded(NewsPage) },
      { path: "admin/visits", element: guarded(VisitsPage) },
      { path: "admin/bot", element: guarded(BotPage) },
      { path: "admin/audit", element: guarded(AuditPage) },
    ],
  },
]);
