import { useMemo, useState } from "react";
import { Printer, Download, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePolicies, useCustomers, useCompanies, useBrokers, useInsuranceTypes } from "@/hooks/useData";
import { POLICY_STATUS } from "@/lib/constants";
import { formatCurrency, customerDisplayName } from "@/lib/utils";

type ReportKey = "company" | "broker" | "insuranceType" | "customer" | "status";

const REPORTS: { key: ReportKey; label: string }[] = [
  { key: "company", label: "By Insurance Company" },
  { key: "broker", label: "By Broker" },
  { key: "insuranceType", label: "By Insurance Type" },
  { key: "customer", label: "By Customer" },
  { key: "status", label: "By Policy Status" },
];

export function ReportsPage() {
  const { docs: policies, loading } = usePolicies();
  const { docs: customers } = useCustomers();
  const { docs: companies } = useCompanies();
  const { docs: brokers } = useBrokers();
  const { docs: insuranceTypes } = useInsuranceTypes();
  const [report, setReport] = useState<ReportKey>("company");

  const summary = useMemo(() => {
    const active = policies.filter((p) => p.status === "active");
    return {
      total: policies.length,
      active: active.length,
      expired: policies.filter((p) => p.status === "expired").length,
      premium: active.reduce((s, p) => s + (p.premium || 0), 0),
    };
  }, [policies]);

  const rows = useMemo(() => {
    const entityName = (id?: string | null) => {
      if (!id) return "—";
      switch (report) {
        case "company":
          return companies.find((c) => c.id === id)?.name ?? "—";
        case "broker":
          return brokers.find((b) => b.id === id)?.name ?? "—";
        case "insuranceType":
          return insuranceTypes.find((t) => t.id === id)?.name ?? "—";
        case "customer":
          return customerDisplayName(customers.find((c) => c.id === id));
        default:
          return id;
      }
    };
    const key = (p: (typeof policies)[number]) => {
      switch (report) {
        case "company":
          return p.companyId;
        case "broker":
          return p.brokerId;
        case "insuranceType":
          return p.insuranceTypeId;
        case "customer":
          return p.customerId;
        case "status":
          return p.status;
        default:
          return "";
      }
    };

    const grouped = new Map<string, { count: number; active: number; expired: number; premium: number }>();
    for (const p of policies) {
      const k = key(p) ?? "";
      const g = grouped.get(k) ?? { count: 0, active: 0, expired: 0, premium: 0 };
      g.count += 1;
      if (p.status === "active") g.active += 1;
      if (p.status === "expired") g.expired += 1;
      g.premium += p.premium || 0;
      grouped.set(k, g);
    }
    return [...grouped.entries()]
      .map(([id, g]) => ({ name: report === "status" ? POLICY_STATUS[id as keyof typeof POLICY_STATUS]?.label ?? id : entityName(id), ...g }))
      .filter((r) => r.name !== "—")
      .sort((a, b) => b.count - a.count);
  }, [policies, report, companies, brokers, insuranceTypes, customers]);

  function downloadCsv() {
    const header = ["Entity", "Policies", "Active", "Expired", "Premium"];
    const lines = rows.map((r) => [r.name, r.count, r.active, r.expired, r.premium.toFixed(2)].join(","));
    const blob = new Blob(["\uFEFF" + [header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `report-${report}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6 print:space-y-4">
      <PageHeader title="Reports" description="Generate and export policy reports">
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print
        </Button>
        <Button variant="outline" size="sm" onClick={downloadCsv}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Total Policies</p>
            <p className="mt-1 text-2xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Active</p>
            <p className="mt-1 text-2xl font-bold text-primary">{summary.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Expired</p>
            <p className="mt-1 text-2xl font-bold text-destructive">{summary.expired}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Active Premium</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(summary.premium)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" /> Report
          </CardTitle>
          <Select value={report} onChange={(e) => setReport(e.target.value as ReportKey)} className="w-56">
            {REPORTS.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No data" description="Create policies to see report breakdowns." />
          ) : (
            <div className="overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead className="text-right">Policies</TableHead>
                    <TableHead className="text-right">Active</TableHead>
                    <TableHead className="text-right">Expired</TableHead>
                    <TableHead className="text-right">Premium</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.name}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-right">{r.count}</TableCell>
                      <TableCell className="text-right">{r.active}</TableCell>
                      <TableCell className="text-right">{r.expired}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.premium)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
