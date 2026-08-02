import { useEffect } from "react";
import { useRouteError } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

function isChunkError(error: unknown) {
  const msg = (error as { message?: string } | null)?.message ?? "";
  return msg.includes("Failed to fetch dynamically imported module") || msg.includes("Importing a module script failed");
}

export function RouteError() {
  const error = useRouteError();
  const chunkError = isChunkError(error);

  // A chunk failure means the browser is holding a stale bundle from an old deploy.
  // Auto-reload once (guarded against loops) so the user lands on the current version.
  useEffect(() => {
    if (!chunkError || sessionStorage.getItem("chunk-reload")) return;
    sessionStorage.setItem("chunk-reload", "1");
    const t = setTimeout(() => window.location.reload(), 600);
    return () => clearTimeout(t);
  }, [chunkError]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <h1 className="text-lg font-semibold">{chunkError ? "New version deployed — reloading…" : "Something went wrong"}</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {chunkError
          ? "A new version of the app was just deployed. Your browser was holding an old copy — reloading automatically."
          : "The page failed to load. Please try again."}
      </p>
      <Button onClick={() => window.location.reload()}>
        <RotateCcw className="h-4 w-4" /> Reload
      </Button>
    </div>
  );
}
