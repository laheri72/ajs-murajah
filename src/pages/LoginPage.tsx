import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock, User } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input, Label } from "../components/ui/Input";
import { apiFetch } from "../lib/api";
import { useAuthStore } from "../stores/auth-store";
import type { AdminAnalytics, RoomDashboardData, SessionUser } from "../types/domain";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const login = useMutation({
    mutationFn: () => apiFetch<{ user: SessionUser }>("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
    onSuccess: async ({ user }) => {
      setUser(user);
      queryClient.setQueryData(["session"], { user });
      try {
        if (user.role === "room") {
          await queryClient.fetchQuery({
            queryKey: ["room-dashboard"],
            queryFn: () => apiFetch<RoomDashboardData>("/api/room/dashboard"),
          });
        } else {
          await queryClient.fetchQuery({
            queryKey: ["admin-analytics"],
            queryFn: () => apiFetch<AdminAnalytics>("/api/admin/analytics"),
          });
        }
      } catch {
        // Let the destination page show its normal error state if preloading fails.
      }
      navigate(user.role === "admin" ? "/admin" : "/room");
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    login.mutate();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-8">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Quran Murajah Tracker</h1>
          <p className="mt-2 text-sm text-muted-foreground">Log in as a Maskan admin or room head.</p>
        </div>

        <form className="grid gap-4" onSubmit={onSubmit}>
          <div>
            <Label>Username</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input autoFocus value={username} onChange={(event) => setUsername(event.target.value)} className="pl-9" />
            </div>
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          {login.isError ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{login.error.message}</p> : null}
          <Button type="submit" size="lg" disabled={login.isPending || !username || !password}>
            {login.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
