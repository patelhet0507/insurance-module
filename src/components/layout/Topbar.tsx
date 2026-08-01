import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Menu, ShieldCheck, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { ROLE_LABEL } from "@/lib/constants";
import { useNotifications } from "@/hooks/useNotifications";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { notifications } = useNotifications();
  const unread = notifications.filter((n) => !n.read).length;

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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      {onMenuClick && (
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
      )}
      <Link to="/" className="flex items-center gap-2 md:hidden">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <span className="font-semibold">Renewal Mgr</span>
      </Link>
      <div className="flex-1" />
      <Button variant="ghost" size="icon" onClick={toggleTheme}>
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Link to="/notifications" className="relative">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </Link>
      <DropdownMenu
        trigger={
          <button className="flex items-center gap-2 rounded-md p-1 hover:bg-muted cursor-pointer">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </button>
        }
      >
        {(close) => (
          <>
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{profile?.displayName || "User"}</p>
              <p className="text-xs text-muted-foreground">
                {profile ? ROLE_LABEL[profile.role] : "—"}
              </p>
            </div>
            <DropdownMenuItem onClick={close}>
              <Link to="/settings" className="flex w-full items-center gap-2">
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { close(); void handleSignOut(); }} className="text-destructive">
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenu>
    </header>
  );
}
