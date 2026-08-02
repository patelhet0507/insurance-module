import { EntityCrudPage } from "@/pages/crud/EntityCrudPage";

const config = {
  title: "Customers",
  singular: "Customer",
  description: "Manage your insurance customers",
  path: "customers",
  fields: [
    { key: "firstName", label: "First Name", required: true },
    { key: "lastName", label: "Last Name", required: true },
    { key: "phone", label: "Phone", type: "text" as const },
    { key: "email", label: "Email", type: "text" as const },
    { key: "address", label: "Address", fullWidth: true },
    { key: "notes", label: "Notes", type: "textarea" as const, fullWidth: true },
  ],
  columns: [
    { key: "name", label: "Name", render: (r: Record<string, unknown>) => `${r.firstName ?? ""} ${r.lastName ?? ""}` },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
  ],
  emptyTitle: "No customers yet",
  emptyDescription: "Create your first customer to link policies to them.",
};

export function CustomersPage() {
  return <EntityCrudPage config={config} />;
}
