import { EntityCrudPage, type EntityConfig } from "@/pages/crud/EntityCrudPage";
import { Badge } from "@/components/ui/badge";
import { normalizeSubjectFields } from "@/lib/utils";

const config: EntityConfig = {
  title: "Insured Subjects",
  singular: "Subject Type",
  description: "Types of insured subjects and the details to capture for each",
  path: "insuredSubjectTypes",
  fields: [
    { key: "name", label: "Subject Type", required: true, placeholder: "e.g. Shop, Car, House, Factory" },
    {
      key: "fields",
      label: "Details to capture",
      type: "list" as const,
      fullWidth: true,
      placeholder: "One detail per line\ne.g. Number of units\nMake / Model\nRegistration number",
    },
  ],
  columns: [
    { key: "name", label: "Subject" },
    {
      key: "fields",
      label: "Details",
      render: (row) => {
        const fields = normalizeSubjectFields(row.fields as Array<string | { name: string; required?: boolean }> | undefined);
        return fields.length ? (
          <div className="flex flex-wrap gap-1">
            {fields.map((f) => (
              <Badge key={f.name} variant="secondary">
                {f.name}
                {f.required && <span className="ml-1 text-destructive">*</span>}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">No details configured</span>
        );
      },
    },
  ],
  emptyTitle: "No subject types yet",
  emptyDescription: "Add subject types (e.g. Shop, Car, House) and their detail fields to use in policies.",
};

export function InsuredSubjectsPage() {
  return <EntityCrudPage config={config} />;
}
