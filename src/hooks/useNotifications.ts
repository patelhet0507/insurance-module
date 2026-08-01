import { useCollection, useUpdate } from "@/hooks/useFirestore";
import type { Notification } from "@/types";

export function useNotifications() {
  const { docs, loading } = useCollection<Notification>("notifications");
  const { update } = useUpdate();

  async function markRead(id: string) {
    await update(`notifications/${id}`, { read: true });
  }

  async function markAllRead() {
    await Promise.all(docs.filter((n) => !n.read).map((n) => update(`notifications/${n.id}`, { read: true })));
  }

  return { notifications: docs, loading, markRead, markAllRead };
}
