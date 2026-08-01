import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toast";
import { router } from "@/router";
import { firebaseConfigured } from "@/lib/firebase";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

export function App() {
  if (!firebaseConfigured) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <h1 className="text-lg font-semibold">Firebase not configured</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Add the <code className="rounded bg-muted px-1">VITE_FIREBASE_*</code> environment variables
          (apiKey, projectId, appId) to your hosting platform, then rebuild and redeploy.
        </p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
