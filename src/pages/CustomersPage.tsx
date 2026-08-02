import { EntityCrudPage } from "@/pages/crud/EntityCrudPage";
import { CUSTOMER_TYPES, GENDERS, COMPANY_TYPES } from "@/lib/constants";
import { customerDisplayName } from "@/lib/utils";

const config = {
  title: "Customers",
  singular: "Customer",
  description: "Manage your insurance customers",
  path: "customers",
  typeField: {
    key: "customerType",
    label: "Customer Type",
    options: [...CUSTOMER_TYPES],
    fields: {
      person: [
        { key: "firstName", label: "Name", required: true },
        { key: "gender", label: "Gender", type: "select" as const, options: GENDERS.map((g) => ({ value: g, label: g })) },
        { key: "phone", label: "Phone", type: "text" as const },
        { key: "email", label: "Email", type: "text" as const },
        { key: "address", label: "Address", fullWidth: true },
        { key: "notes", label: "Notes", type: "textarea" as const, fullWidth: true },
      ],
      company: [
        { key: "companyName", label: "Company Name", required: true },
        { key: "companyType", label: "Company Type", type: "select" as const, options: COMPANY_TYPES.map((t) => ({ value: t, label: t })) },
        { key: "phone", label: "Phone", type: "text" as const },
        { key: "email", label: "Email", type: "text" as const },
        { key: "address", label: "Address", fullWidth: true },
        { key: "notes", label: "Notes", type: "textarea" as const, fullWidth: true },
      ],
    },
  },
  columns: [
    { key: "name", label: "Name", render: (r: Record<string, unknown>) => customerDisplayName(r) },
    { key: "type", label: "Type", render: (r: Record<string, unknown>) => (r.customerType === "company" ? "Company" : "Person") },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
  ],
  emptyTitle: "No customers yet",
  emptyDescription: "Create your first customer to link policies to them.",
};

export function CustomersPage() {
  return <EntityCrudPage config={config} />;
}
