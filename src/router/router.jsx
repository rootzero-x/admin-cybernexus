import React from "react";
import App from "../App.jsx";
import { createBrowserRouter } from "react-router-dom";
import { ErrorPage } from "../pages/Error/ErrorPage.jsx";
import { LoginPage } from "../pages/Auth/LoginPage.jsx";
import { TwoFAPage } from "../pages/Auth/TwoFAPage.jsx";
import { DashboardPage } from "../pages/Dashboard/DashboardPage.jsx";
import { UsersPage } from "../pages/Users/UsersPage.jsx";
import { SessionsPage } from "../pages/Sessions/SessionsPage.jsx";
import { AuditPage } from "../pages/Audit/AuditPage.jsx";
import { RequireAdmin } from "../shared/auth/RequireAdmin.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <LoginPage /> },
      { path: "2fa", element: <TwoFAPage /> },

      {
        path: "admin",
        element: (
          <RequireAdmin>
            <DashboardPage />
          </RequireAdmin>
        ),
      },
      {
        path: "admin/users",
        element: (
          <RequireAdmin>
            <UsersPage />
          </RequireAdmin>
        ),
      },
      {
        path: "admin/sessions",
        element: (
          <RequireAdmin>
            <SessionsPage />
          </RequireAdmin>
        ),
      },
      {
        path: "admin/audit",
        element: (
          <RequireAdmin>
            <AuditPage />
          </RequireAdmin>
        ),
      },
    ],
  },
]);
