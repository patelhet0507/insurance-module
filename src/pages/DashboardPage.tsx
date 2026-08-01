import { Link } from "react-router-dom";
import { useMemo } from "react";
import {
  FileText,
  Users,
  Building2,
  Handshake,
  Bell,
  AlertTriangle,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePolicies, useCustomers, useCompanies, useBrokers, useReminders } from "@/hooks/useData";
import { canWrite } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";
import type { Policy } from "@/types";

export function DashboardPage() {
  const { profile } = useAuth();
  const { docs: policies, loading: polLoading } = usePolicies();
  const { docs: customers } = useCustomers();
  const { docs: companies } = useCompanies();
  const { docs: brokers } = useBrokers();
  const { docs: reminders } = useReminders();

  const stats = useMemo(() => {
    const active = policies.filter((p) => p.status === "active");
    const expiringSoon = active.filter((p) => {
      const d = daysUntil(p.endDate);
      return d != null && d >= 0 && d <= 30;
    });
    const expired = policies.filter((p) => p.status === "expired");
    const pendingRenewals = active.filter((p) => {
      const d = daysUntil(p.endDate);
      return d != null && d <= 60;
    });
    const totalPremium = active.reduce((sum, p) => sum + (p.premium || 0), 0);
    return { active: active.length, expiringSoon: expiringSoon.length, expired: expired.length, pendingRenewals: pendingRenewals.length, totalPremium };
  }, [policies]);

  const upcomingReminders = useMemo(
    () =>
      [...reminders]
        .filter((r) => r.status === "pending")
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5),
    [reminders]
  );

  const statsCards = [
    { label: "Active Policies", value: stats.active, icon: FileText },
    { label: "Expiring Soon (30d)", value: stats.expiringSoon, icon: AlertTriangle, danger: stats.expiringSoon > 0 },
    { label: "Expired", value: stats.expired, icon: AlertTriangle, danger: stats.expired > 0 },
    { label: "Customers", value: customers.length, icon: Users },
    { label: "Companies", value: companies.length, icon: Building2 },
    { label: "Brokers", value: brokers.length, icon: Handshake },
  ];

  const customerName = (id: string) => customers.find((c) => c.id === id);
  const companyName = (id: string) => companies.find((c) => c.id === id);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your insurance portfolio">
        {canWrite(profile?.role) && (
          <Button asChild>
            <Link to="/policies/new">
              <Plus className="h-4 w-4" /> New Policy
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statsCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <s.icon className="h-4 w-4" />
                <span className="text-xs font-medium">{s.label}</span>
              </div>
              <p className={`mt-2 text-2xl font-bold ${s.danger ? "text-destructive" : ""}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Renewals Coming Up</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/policies">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {polLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies
                    .filter((p) => {
                      const d = daysUntil(p.endDate);
                      return d != null && d <= 60;
                    })
                    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
                    .slice(0, 8)
                    .map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          <Link to={`/policies/${p.id}`} className="hover:underline">
                            {p.policyNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{customerName(p.customerId)?.firstName ?? "—"}</TableCell>
                        <TableCell>{companyName(p.companyId)?.name ?? "—"}</TableCell>
                        <TableCell>{formatCurrency(p.premium, p.currency)}</TableCell>
                        <TableCell>{formatDate(p.endDate)}</TableCell>
                        <TableCell>
                          <StatusBadge status={p.status} kind="policy" />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Reminders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/reminders">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingReminders.length === 0 ? (
              <EmptyState title="No pending reminders" description="You're all caught up." />
            ) : (
              <ul className="space-y-3">
                {upcomingReminders.map((r) => {
                  const policy = policies.find((p) => p.id === r.policyId) as Policy | undefined;
                  const d = daysUntil(r.dueDate);
                  return (
                    <li key={r.id} className="flex items-start gap-3 rounded-md border p-3">
                      <Bell className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {policy ? policy.policyNumber : "—"} · {formatDate(r.dueDate)}
                        </p>
                      </div>
                      {d != null && (
                        <span className={`text-xs font-semibold ${d <= 7 ? "text-destructive" : d <= 30 ? "text-warning" : "text-muted-foreground"}`}>
                          {d === 0 ? "Today" : `${d}d`}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
