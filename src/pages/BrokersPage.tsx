import { EntityCrudPage } from "@/pages/crud/EntityCrudPage";

const config = {
  title: "Brokers",
  singular: "Broker",
  description: "Brokers who handle your policies",
  path: "brokers",
  fields: [
    { key: "name", label: "Broker Name", required: true },
    { key: "contactName", label: "Contact Name" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "address", label: "Address", fullWidth: true },
  ],
  columns: [
    { key: "name", label: "Broker" },
    { key: "contactName", label: "Contact" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
  ],
  emptyTitle: "No brokers yet",
  emptyDescription: "Add brokers to assign to policies.",
};

export function BrokersPage() {
  return <EntityCrudPage config={config} />;
}
