import { Navigate, Link } from "react-router-dom";
import { ShieldCheck, FileText, Bell, Users, Building2, Tags, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  { icon: FileText, title: "Policy tracking", desc: "Store policies, customers, companies and brokers in one place." },
  { icon: Bell, title: "Renewal reminders", desc: "Automatic notifications when renewals are due or expiring." },
  { icon: Users, title: "Team roles", desc: "Admin, staff and viewer roles control who can edit what." },
  { icon: Tags, title: "Insurance types", desc: "Organize policies by product type and company." },
];

export function LandingPage() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="text-base font-semibold">{APP_NAME}</span>
        </div>
        <Button asChild variant="outline">
          <Link to="/login">Sign in</Link>
        </Button>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <section className="text-center">
          <Badge className="mb-4">Insurance renewals, under control</Badge>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Never miss a policy renewal again
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Track your insurance policies, customers and companies, and get reminded automatically before
            every renewal date.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/login">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="mt-20 grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6">
              <f.icon className="mb-3 h-6 w-6 text-primary" />
              <h2 className="font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <Building2 className="mx-auto mb-1 h-4 w-4" /> {APP_NAME}
      </footer>
    </div>
  );
}
