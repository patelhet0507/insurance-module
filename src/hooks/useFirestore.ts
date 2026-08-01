import { useCallback, useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
  type QueryConstraint,
  type CollectionReference,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type FirestoreDoc<T extends object = object> = T & { id: string };

/** Live collection subscription with a helper shape used across list pages. */
export function useCollection<T extends object>(path: string, ...constraints: QueryConstraint[]) {
  const [docs, setDocs] = useState<FirestoreDoc<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const ref = collection(db, path) as CollectionReference;
    const q = constraints.length ? query(ref, ...constraints) : ref;
    const unsub = onSnapshot(
      q,
      (snap) => {
        setDocs(snap.docs.map((d) => ({ id: d.id, ...normalizeData(d.data()) }) as FirestoreDoc<T>));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsub;
  }, [path, ...constraints.map((c) => c.toString())]);

  return { docs, loading, error };
}

export function useDoc<T extends object>(path: string) {
  const [docData, setDocData] = useState<FirestoreDoc<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const ref = doc(db, path);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setDocData(snap.exists() ? ({ id: snap.id, ...normalizeData(snap.data()) } as FirestoreDoc<T>) : null);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsub;
  }, [path]);

  return { doc: docData, loading, error };
}

export function useCreate(path: string) {
  const [creating, setCreating] = useState(false);
  const create = useCallback(
    async (data: Record<string, unknown>) => {
      setCreating(true);
      try {
        const ref = collection(db, path);
        const snap = await addDoc(ref, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return { id: snap.id };
      } finally {
        setCreating(false);
      }
    },
    [path]
  );
  return { create, creating };
}

export function useUpdate() {
  const [updating, setUpdating] = useState(false);
  const update = useCallback(async (path: string, data: Record<string, unknown>) => {
    setUpdating(true);
    try {
      await updateDoc(doc(db, path), { ...data, updatedAt: serverTimestamp() });
    } finally {
      setUpdating(false);
    }
  }, []);
  return { update, updating };
}

export function useRemove() {
  const [removing, setRemoving] = useState(false);
  const remove = useCallback(async (path: string) => {
    setRemoving(true);
    try {
      await deleteDoc(doc(db, path));
    } finally {
      setRemoving(false);
    }
  }, []);
  return { remove, removing };
}

/** Firestore stores serverTimestamp() as a Timestamp; convert any Timestamp values to ISO strings. */
function normalizeData(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = isTimestamp(v) ? new Date(v.seconds * 1000).toISOString() : v;
  }
  return out;
}

function isTimestamp(v: unknown): v is { seconds: number } {
  return (
    typeof v === "object" &&
    v !== null &&
    "seconds" in (v as { seconds?: unknown }) &&
    typeof (v as { seconds?: unknown }).seconds === "number"
  );
}
