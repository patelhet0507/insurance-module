import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function NotificationsPage() {
  const { notifications, loading, markRead, markAllRead } = useNotifications();

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Alerts about expiring policies and reminders">
        <Button variant="outline" size="sm" onClick={markAllRead}>
          Mark all read
        </Button>
      </PageHeader>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up." />
      ) : (
        <ul className="space-y-2">
          {[...notifications]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((n) => (
              <li
                key={n.id}
                className={cn(
                  "cursor-pointer rounded-md border p-4 transition-colors hover:bg-muted/50",
                  !n.read && "border-primary/40 bg-primary/5"
                )}
                onClick={() => (n.link ? undefined : markRead(n.id))}
              >
                {n.link ? (
                  <Link to={n.link} onClick={() => markRead(n.id)} className="block">
                    <NotificationBody n={n} />
                  </Link>
                ) : (
                  <NotificationBody n={n} />
                )}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

function NotificationBody({ n }: { n: { title: string; message?: string; createdAt: string; read: boolean } }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className={cn("text-sm font-medium", !n.read && "text-primary")}>{n.title}</p>
        {n.message && <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</span>
    </div>
  );
}
