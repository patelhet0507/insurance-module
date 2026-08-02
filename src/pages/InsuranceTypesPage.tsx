import { EntityCrudPage } from "@/pages/crud/EntityCrudPage";

const config = {
  title: "Insurance Types",
  description: "Types of insurance used by your policies",
  path: "insuranceTypes",
  fields: [
    { key: "name", label: "Type Name", required: true, placeholder: "e.g. Motor, Life, Health" },
    { key: "description", label: "Description", type: "textarea" as const, fullWidth: true },
  ],
  columns: [
    { key: "name", label: "Type" },
    { key: "description", label: "Description" },
  ],
  emptyTitle: "No insurance types yet",
  emptyDescription: "Add insurance types to link to policies.",
};

export function InsuranceTypesPage() {
  return <EntityCrudPage config={config} />;
}
