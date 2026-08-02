import { useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  Handshake,
  Bell,
  Settings,
  ShieldCheck,
  LogOut,
  Moon,
  Sun,
  Tags,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { APP_NAME, ROLE_LABEL } from "@/lib/constants";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/policies", label: "Policies", icon: FileText },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/companies", label: "Insurance Companies", icon: Building2 },
  { to: "/brokers", label: "Brokers", icon: Handshake },
  { to: "/insurance-types", label: "Insurance Types", icon: Tags },
  { to: "/reminders", label: "Reminders", icon: Bell },
];

export function Sidebar() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const initials = useMemo(() => {
    const name = profile?.displayName || profile?.email || "U";
    return name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [profile]);

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <aside className="hidden w-64 flex-col border-r bg-card md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-6">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <span className="text-base font-semibold">{APP_NAME}</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
        <div className="pt-4">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Settings className="h-4 w-4" />
            Settings
          </NavLink>
        </div>
      </nav>
      <div className="border-t p-4">
        <DropdownMenu
          trigger={
            <button className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted cursor-pointer">
              <Avatar>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{profile?.displayName || "User"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {profile ? ROLE_LABEL[profile.role] : "—"}
                </p>
              </div>
              <Sun className="h-4 w-4 text-muted-foreground cursor-pointer" onClick={toggleTheme} />
            </button>
          }
        >
          {(close) => (
            <>
              <DropdownMenuItem onClick={close}>
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { close(); void handleSignOut(); }} className="text-destructive">
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenu>
      </div>
    </aside>
  );
}
