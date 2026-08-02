import { useMemo, useState } from "react";
import { Printer, Download, BarChart3, Search, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";
import { usePolicies, useCustomers, useCompanies, useBrokers, useInsuranceTypes } from "@/hooks/useData";
import { POLICY_STATUS } from "@/lib/constants";
import { formatCurrency, formatDate, customerDisplayName } from "@/lib/utils";
import type { Policy, PolicyStatus } from "@/types";

type ReportKey = "all" | "company" | "broker" | "insuranceType" | "customer" | "status";

const REPORTS: { key: ReportKey; label: string }[] = [
  { key: "all", label: "All Policies" },
  { key: "company", label: "By Company" },
  { key: "broker", label: "By Broker" },
  { key: "insuranceType", label: "By Type" },
  { key: "customer", label: "By Customer" },
  { key: "status", label: "By Status" },
];

const STATUSES = ["all", "active", "expired", "cancelled", "pending"] as const;

export function ReportsPage() {
  const { docs: policies, loading } = usePolicies();
  const { docs: customers } = useCustomers();
  const { docs: companies } = useCompanies();
  const { docs: brokers } = useBrokers();
  const { docs: insuranceTypes } = useInsuranceTypes();
  const [report, setReport] = useState<ReportKey>("all");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [entity, setEntity] = useState<string | null>(null);

  const nameOf = useMemo(() => {
    const company = new Map(companies.map((c) => [c.id, c.name]));
    const broker = new Map(brokers.map((b) => [b.id, b.name]));
    const type = new Map(insuranceTypes.map((t) => [t.id, t.name]));
    const customer = new Map(customers.map((c) => [c.id, customerDisplayName(c)]));
    return {
      company: (id?: string | null) => (id && company.get(id)) || "—",
      broker: (id?: string | null) => (id && broker.get(id)) || "—",
      insuranceType: (id?: string | null) => (id && type.get(id)) || "—",
      customer: (id?: string | null) => (id && customer.get(id)) || "—",
      status: (s: string) => POLICY_STATUS[s as PolicyStatus]?.label ?? s,
    };
  }, [companies, brokers, insuranceTypes, customers]);

  const policyKey = (p: Policy) => {
    switch (report) {
      case "company":
        return p.companyId;
      case "broker":
        return p.brokerId || "";
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

  const entityLabel = (k: string) => {
    switch (report) {
      case "company":
        return nameOf.company(k);
      case "broker":
        return nameOf.broker(k);
      case "insuranceType":
        return nameOf.insuranceType(k);
      case "customer":
        return nameOf.customer(k);
      default:
        return nameOf.status(k);
    }
  };

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
    if (report === "all") return [];
    const grouped = new Map<string, { count: number; active: number; expired: number; premium: number }>();
    for (const p of policies) {
      const k = policyKey(p) || "—";
      const g = grouped.get(k) ?? { count: 0, active: 0, expired: 0, premium: 0 };
      g.count += 1;
      if (p.status === "active") g.active += 1;
      if (p.status === "expired") g.expired += 1;
      g.premium += p.premium || 0;
      grouped.set(k, g);
    }
    const q = query.trim().toLowerCase();
    return [...grouped.entries()]
      .map(([k, g]) => ({ key: k, label: entityLabel(k), ...g }))
      .filter((r) => r.label !== "—" && (!q || r.label.toLowerCase().includes(q)))
      .sort((a, b) => b.count - a.count);
  }, [policies, report, query, policyKey, entityLabel]);

  const visiblePolicies = useMemo(() => {
    let list = policies;
    if (report !== "all" && entity) list = policies.filter((p) => (policyKey(p) || "—") === entity);
    if (status !== "all") list = list.filter((p) => p.status === status);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const hay = [
          p.policyNumber,
          nameOf.customer(p.customerId),
          nameOf.company(p.companyId),
          nameOf.insuranceType(p.insuranceTypeId),
          p.insuredSubject,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [policies, report, entity, status, query, policyKey, nameOf]);

  function downloadCsv() {
    let header: string[];
    let lines: string[];
    if (report === "all" || entity) {
      header = ["Policy #", "Customer", "Company", "Type", "Subject", "Status", "Start", "End", "Premium", "Currency"];
      lines = visiblePolicies.map((p) =>
        [
          p.policyNumber,
          nameOf.customer(p.customerId),
          nameOf.company(p.companyId),
          nameOf.insuranceType(p.insuranceTypeId),
          p.insuredSubject || "",
          p.status,
          p.startDate,
          p.endDate,
          p.premium.toFixed(2),
          p.currency,
        ].join(",")
      );
    } else {
      header = ["Entity", "Policies", "Active", "Expired", "Premium"];
      lines = rows.map((r) => [r.label, r.count, r.active, r.expired, r.premium.toFixed(2)].join(","));
    }
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
          <div className="flex flex-wrap gap-1.5">
            {REPORTS.map((r) => (
              <Button
                key={r.key}
                size="sm"
                variant={report === r.key ? "default" : "outline"}
                onClick={() => {
                  setReport(r.key);
                  setEntity(null);
                }}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={report === "all" ? "Search policy #, customer, company, type…" : "Filter…"}
                    className="pl-9"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={status === s ? "default" : "outline"}
                      onClick={() => setStatus(s)}
                      className="capitalize"
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              {entity && (
                <button
                  onClick={() => setEntity(null)}
                  className="mb-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" /> All entities
                </button>
              )}

              {report === "all" || entity ? (
                visiblePolicies.length === 0 ? (
                  <EmptyState title="No policies" description="No policies match the current filters." />
                ) : (
                  <div className="overflow-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Policy #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Premium</TableHead>
                          <TableHead>End Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visiblePolicies.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              <Link to={`/policies/${p.id}`} className="font-medium text-primary hover:underline">
                                {p.policyNumber}
                              </Link>
                            </TableCell>
                            <TableCell>{nameOf.customer(p.customerId)}</TableCell>
                            <TableCell>{nameOf.company(p.companyId)}</TableCell>
                            <TableCell>{nameOf.insuranceType(p.insuranceTypeId)}</TableCell>
                            <TableCell>
                              <StatusBadge status={p.status} kind="policy" />
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(p.premium, p.currency)}</TableCell>
                            <TableCell>{formatDate(p.endDate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
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
                        <TableRow key={r.key} className="cursor-pointer hover:bg-muted/50" onClick={() => setEntity(r.key)}>
                          <TableCell className="font-medium">{r.label}</TableCell>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
