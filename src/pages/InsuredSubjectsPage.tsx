import { EntityCrudPage, type EntityConfig } from "@/pages/crud/EntityCrudPage";
import { Badge } from "@/components/ui/badge";

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
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {Array.isArray(row.fields) && (row.fields as string[]).length > 0 ? (
            (row.fields as string[]).map((f) => (
              <Badge key={f} variant="secondary">
                {f}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">No details configured</span>
          )}
        </div>
      ),
    },
  ],
  emptyTitle: "No subject types yet",
  emptyDescription: "Add subject types (e.g. Shop, Car, House) and their detail fields to use in policies.",
};

export function InsuredSubjectsPage() {
  return <EntityCrudPage config={config} />;
}
