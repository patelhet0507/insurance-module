import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  createUserWithEmailAndPassword,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { Role, UserProfile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // subscribe to profile for live role changes
        const unsubProfile = onSnapshot(doc(db, "users", u.uid), (snap) => {
          setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
        });
        return () => unsubProfile();
      }
      setProfile(null);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await ensureProfile(cred.user);
  }

  async function signOut() {
    await fbSignOut(auth);
  }

  async function ensureProfile(u: User) {
    const ref = doc(db, "users", u.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || u.email?.split("@")[0] || "User",
        role: "viewer" as Role,
        createdAt: serverTimestamp(),
      });
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function canWrite(role?: Role) {
  return role === "admin" || role === "staff";
}

export function canManageUsers(role?: Role) {
  return role === "admin";
}

export function canEditUser(role?: Role, target?: Role) {
  // admins can edit everyone; staff can edit non-admins; viewers none
  if (role === "admin") return true;
  if (role === "staff") return target !== "admin";
  return false;
}
