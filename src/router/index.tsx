import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/context/AuthContext";
import { RequireAuth, RedirectIfAuthed } from "@/components/auth/RequireAuth";
import { RouteError } from "@/components/shared/RouteError";

function lazyNamed<T extends string>(loader: () => Promise<Record<T, ComponentType>>, name: T) {
  return lazy(async () => {
    const mod = await loader();
    return { default: mod[name] };
  });
}

const LoginPage = lazyNamed(() => import("@/pages/LoginPage"), "LoginPage");
const DashboardPage = lazyNamed(() => import("@/pages/DashboardPage"), "DashboardPage");
const PoliciesPage = lazyNamed(() => import("@/pages/PoliciesPage"), "PoliciesPage");
const PolicyDetailPage = lazyNamed(() => import("@/pages/PolicyDetailPage"), "PolicyDetailPage");
const PolicyFormPage = lazyNamed(() => import("@/pages/PolicyFormPage"), "PolicyFormPage");
const CustomersPage = lazyNamed(() => import("@/pages/CustomersPage"), "CustomersPage");
const CompaniesPage = lazyNamed(() => import("@/pages/CompaniesPage"), "CompaniesPage");
const BrokersPage = lazyNamed(() => import("@/pages/BrokersPage"), "BrokersPage");
const RemindersPage = lazyNamed(() => import("@/pages/RemindersPage"), "RemindersPage");
const NotificationsPage = lazyNamed(() => import("@/pages/NotificationsPage"), "NotificationsPage");
const SettingsPage = lazyNamed(() => import("@/pages/SettingsPage"), "SettingsPage");
const InsuranceTypesPage = lazyNamed(() => import("@/pages/InsuranceTypesPage"), "InsuranceTypesPage");

function Page({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    errorElement: <RouteError />,
    element: (
      <RedirectIfAuthed>
        <LoginPage />
      </RedirectIfAuthed>
    ),
  },
  {
    errorElement: <RouteError />,
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Page><DashboardPage /></Page> },
      { path: "policies", element: <Page><PoliciesPage /></Page> },
      { path: "policies/new", element: <Page><PolicyFormPage /></Page> },
      { path: "policies/:id", element: <Page><PolicyDetailPage /></Page> },
      { path: "policies/:id/edit", element: <Page><PolicyFormPage /></Page> },
      { path: "customers", element: <Page><CustomersPage /></Page> },
      { path: "companies", element: <Page><CompaniesPage /></Page> },
      { path: "brokers", element: <Page><BrokersPage /></Page> },
      { path: "reminders", element: <Page><RemindersPage /></Page> },
      { path: "notifications", element: <Page><NotificationsPage /></Page> },
      { path: "insurance-types", element: <Page><InsuranceTypesPage /></Page> },
      { path: "settings", element: <Page><SettingsPage /></Page> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
