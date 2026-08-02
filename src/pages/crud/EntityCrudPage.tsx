import { useMemo, useState } from "react";
import { Search, Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCollection, useCreate, useRemove, useUpdate, type FirestoreDoc } from "@/hooks/useFirestore";
import { useAuth } from "@/context/AuthContext";
import { canWrite } from "@/context/AuthContext";
import { notifySuccess } from "@/components/ui/toast";

export interface EntityField {
  key: string;
  label: string;
  required?: boolean;
  type?: "text" | "textarea";
  placeholder?: string;
  fullWidth?: boolean;
}

export interface EntityConfig {
  title: string;
  singular: string;
  description: string;
  path: string;
  fields: EntityField[];
  columns: { key: string; label: string; render?: (row: Record<string, unknown>) => React.ReactNode }[];
  emptyTitle: string;
  emptyDescription: string;
}

export function EntityCrudPage({ config }: { config: EntityConfig }) {
  const { profile } = useAuth();
  const { docs, loading } = useCollection<Record<string, unknown>>(config.path);
  const { create } = useCreate(config.path);
  const { update } = useUpdate();
  const { remove } = useRemove();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const writable = canWrite(profile?.role);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((d) =>
      config.fields.some((f) => String(d[f.key] ?? "").toLowerCase().includes(q))
    );
  }, [docs, search, config]);

  function openCreate() {
    setEditing(null);
    setForm({});
    setDialogOpen(true);
  }

  function openEdit(row: Record<string, unknown>) {
    setEditing(row);
    setForm(Object.fromEntries(config.fields.map((f) => [f.key, String(row[f.key] ?? "")])));
    setDialogOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (editing) {
        await update(`${config.path}/${editing.id}`, payload);
        notifySuccess(`${config.singular} updated`);
      } else {
        await create(payload);
        notifySuccess(`${config.singular} created`);
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function removeRow() {
    if (!deleting) return;
    await remove(`${config.path}/${deleting}`);
    setConfirmOpen(false);
    setDeleting(null);
    notifySuccess("Deleted");
  }

  return (
    <div className="space-y-6">
      <PageHeader title={config.title} description={config.description}>
        {writable && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New {config.singular}
          </Button>
        )}
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title={config.emptyTitle} description={config.emptyDescription} />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                {config.columns.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
                {writable && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id}>
                  {config.columns.map((c) => (
                    <TableCell key={c.key}>{c.render ? c.render(row) : String(row[c.key] ?? "—")}</TableCell>
                  ))}
                  {writable && (
                    <TableCell>
                      <DropdownMenu
                        trigger={
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      >
                        {(close) => (
                          <>
                            <DropdownMenuItem onClick={() => { close(); openEdit(row); }}>
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => { close(); setDeleting(row.id); setConfirmOpen(true); }}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${config.singular}` : `New ${config.singular}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {config.fields.map((f) => (
              <div key={f.key} className={`space-y-2 ${f.fullWidth ? "sm:col-span-2" : ""}`}>
                <Label htmlFor={f.key}>
                  {f.label}
                  {f.required && " *"}
                </Label>
                {f.type === "textarea" ? (
                  <Textarea id={f.key} required={f.required} placeholder={f.placeholder} value={form[f.key] ?? ""} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} />
                ) : (
                  <Input id={f.key} required={f.required} placeholder={f.placeholder} value={form[f.key] ?? ""} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${config.singular.toLowerCase()}?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={removeRow}
      />
    </div>
  );
}
