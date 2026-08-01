import { EntityCrudPage } from "@/pages/crud/EntityCrudPage";

const config = {
  title: "Companies",
  description: "Insurance companies you issue policies with",
  path: "companies",
  fields: [
    { key: "name", label: "Company Name", required: true },
    { key: "contactName", label: "Contact Name" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "address", label: "Address", fullWidth: true },
  ],
  columns: [
    { key: "name", label: "Company" },
    { key: "contactName", label: "Contact" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
  ],
  emptyTitle: "No companies yet",
  emptyDescription: "Add insurance companies to link to policies.",
};

export function CompaniesPage() {
  return <EntityCrudPage config={config} />;
}
