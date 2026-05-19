import { useQueryClient } from "@tanstack/react-query";
import { BedDouble, Building2, ClipboardList, Home, LogOut, Target } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../stores/auth-store";
import { Button } from "../ui/Button";

const adminNav = [
  { to: "/admin", label: "Overview", icon: Home },
  { to: "/admin/floors", label: "Floors", icon: Building2 },
  { to: "/admin/rooms", label: "Rooms", icon: BedDouble },
  { to: "/admin/targets", label: "Targets", icon: Target },
  { to: "/admin/activity", label: "Activity", icon: ClipboardList },
];

export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Still clear client state so the user is not trapped in the app if the
      // network request fails. The next protected request will be rejected.
    } finally {
      setUser(null);
      queryClient.setQueryData(["session"], { user: null });
      queryClient.removeQueries({ queryKey: ["admin-analytics"] });
      queryClient.removeQueries({ queryKey: ["room-dashboard"] });
      queryClient.removeQueries({ queryKey: ["rooms"] });
      queryClient.removeQueries({ queryKey: ["floors"] });
      queryClient.removeQueries({ queryKey: ["targets"] });
      queryClient.removeQueries({ queryKey: ["activity"] });
      navigate("/login", { replace: true });
      setIsLoggingOut(false);
    }
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link to={isAdmin ? "/admin" : "/room"} className="min-w-0">
            <p className="text-base font-bold text-primary">Quran Murajah Tracker</p>
            <p className="truncate text-xs text-muted-foreground">{user?.role === "room" ? user.roomName : "Maskan Admin"}</p>
          </Link>
          <Button variant="secondary" size="sm" onClick={logout} disabled={isLoggingOut}>
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </header>

      <div className={cn("mx-auto grid max-w-7xl gap-4 px-4 py-4", isAdmin ? "md:grid-cols-[220px_1fr]" : "max-w-6xl")}>
        {isAdmin ? (
          <aside className="hidden md:block">
            <div className="sticky top-20 rounded-lg border border-border bg-white p-2 shadow-soft">
              <div className="px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Control Center</p>
              </div>
              <nav className="grid gap-1">
                {adminNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/admin"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                        isActive && "bg-primary text-white shadow-sm hover:bg-primary hover:text-white",
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </aside>
        ) : null}
        <main className="min-w-0 pb-20">
          <Outlet />
        </main>
      </div>

      {isAdmin ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-white md:hidden">
          {adminNav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/admin"} className={({ isActive }) => cn("grid place-items-center gap-1 px-1 py-2 text-[11px]", isActive ? "text-primary" : "text-muted-foreground")}>
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
