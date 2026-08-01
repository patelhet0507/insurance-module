import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/context/AuthContext";
import { RequireAuth, RedirectIfAuthed } from "@/components/auth/RequireAuth";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { PoliciesPage } from "@/pages/PoliciesPage";
import { PolicyDetailPage } from "@/pages/PolicyDetailPage";
import { PolicyFormPage } from "@/pages/PolicyFormPage";
import { CustomersPage } from "@/pages/CustomersPage";
import { CompaniesPage } from "@/pages/CompaniesPage";
import { BrokersPage } from "@/pages/BrokersPage";
import { RemindersPage } from "@/pages/RemindersPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { SettingsPage } from "@/pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <RedirectIfAuthed>
        <LoginPage />
      </RedirectIfAuthed>
    ),
  },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "policies", element: <PoliciesPage /> },
      { path: "policies/new", element: <PolicyFormPage /> },
      { path: "policies/:id", element: <PolicyDetailPage /> },
      { path: "policies/:id/edit", element: <PolicyFormPage /> },
      { path: "customers", element: <CustomersPage /> },
      { path: "companies", element: <CompaniesPage /> },
      { path: "brokers", element: <BrokersPage /> },
      { path: "reminders", element: <RemindersPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
