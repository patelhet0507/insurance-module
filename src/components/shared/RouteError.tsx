import { useRouteError } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RouteError() {
  const error = useRouteError() as { status?: number; message?: string } | undefined;
  const isChunkError =
    (error?.message ?? "").includes("Failed to fetch dynamically imported module") ||
    (error?.message ?? "").includes("Importing a module script failed");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <h1 className="text-lg font-semibold">{isChunkError ? "New version deployed" : "Something went wrong"}</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {isChunkError
          ? "A new version of the app was just deployed. Your browser was holding an old copy — reload to pick up the latest."
          : "The page failed to load. Please try again."}
      </p>
      <Button onClick={() => window.location.reload()}>
        <RotateCcw className="h-4 w-4" /> Reload
      </Button>
    </div>
  );
}
