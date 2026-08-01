import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePolicies, useCustomers, useCompanies } from "@/hooks/useData";
import { useRemove } from "@/hooks/useFirestore";
import { useAuth } from "@/context/AuthContext";
import { canWrite } from "@/context/AuthContext";
import { POLICY_STATUS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { notifySuccess } from "@/components/ui/toast";

export function PoliciesPage() {
  const { profile } = useAuth();
  const { docs: policies, loading } = usePolicies();
  const { docs: customers } = useCustomers();
  const { docs: companies } = useCompanies();
  const { remove } = useRemove();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const writable = canWrite(profile?.role);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return policies
      .filter((p) => {
        if (statusFilter !== "all" && p.status !== statusFilter) return false;
        if (!q) return true;
        const customer = customers.find((c) => c.id === p.customerId);
        const company = companies.find((c) => c.id === p.companyId);
        return (
          p.policyNumber.toLowerCase().includes(q) ||
          customer?.firstName.toLowerCase().includes(q) ||
          customer?.lastName.toLowerCase().includes(q) ||
          company?.name.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [policies, customers, companies, search, statusFilter]);

  const customerName = (id: string) => {
    const c = customers.find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : "—";
  };
  const companyName = (id: string) => companies.find((x) => x.id === id)?.name ?? "—";

  async function handleDelete() {
    if (!deleting) return;
    await remove(`policies/${deleting}`);
    setConfirmOpen(false);
    setDeleting(null);
    notifySuccess("Policy deleted");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Policies" description="Manage insurance policies and renewals">
        {writable && (
          <Button asChild>
            <Link to="/policies/new">
              <Plus className="h-4 w-4" /> New Policy
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search policy #, customer, company…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
          <option value="all">All statuses</option>
          {Object.entries(POLICY_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No policies found"
          description={search || statusFilter !== "all" ? "Try adjusting your filters." : "Create your first policy to get started."}
          action={
            writable ? (
              <Button asChild>
                <Link to="/policies/new">
                  <Plus className="h-4 w-4" /> New Policy
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                {writable && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/policies/${p.id}`)}>
                  <TableCell className="font-medium">{p.policyNumber}</TableCell>
                  <TableCell>{customerName(p.customerId)}</TableCell>
                  <TableCell>{companyName(p.companyId)}</TableCell>
                  <TableCell>{formatCurrency(p.premium, p.currency)}</TableCell>
                  <TableCell>{formatDate(p.startDate)}</TableCell>
                  <TableCell>{formatDate(p.endDate)}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} kind="policy" />
                  </TableCell>
                  {writable && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu
                        trigger={
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      >
                        {(close) => (
                          <>
                            <DropdownMenuItem onClick={() => { close(); navigate(`/policies/${p.id}`); }}>
                              <Eye className="h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { close(); navigate(`/policies/${p.id}/edit`); }}>
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => { close(); setDeleting(p.id); setConfirmOpen(true); }}
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete policy?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
