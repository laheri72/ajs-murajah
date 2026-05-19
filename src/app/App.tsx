import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { LoadingState } from "../components/states/LoadingState";
import { apiFetch } from "../lib/api";
import { useAuthStore } from "../stores/auth-store";
import type { SessionUser } from "../types/domain";
import { LoginPage } from "../pages/LoginPage";
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { FloorsPage } from "../pages/admin/FloorsPage";
import { RoomsPage } from "../pages/admin/RoomsPage";
import { TargetsPage } from "../pages/admin/TargetsPage";
import { ActivityPage } from "../pages/admin/ActivityPage";
import { RoomDashboard } from "../pages/room/RoomDashboard";

export function App() {
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);
  const session = useQuery({
    queryKey: ["session"],
    queryFn: () => apiFetch<{ user: SessionUser | null }>("/api/auth/me"),
  });

  useEffect(() => {
    if (session.isSuccess) setUser(session.data.user);
  }, [session.isSuccess, session.data, setUser]);

  if (session.isLoading) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <LoadingState label="Preparing your dashboard..." />
      </div>
    );
  }

  const currentUser = session.data?.user ?? user;

  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to={currentUser.role === "admin" ? "/admin" : "/room"} replace /> : <LoginPage />} />
      <Route element={currentUser ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route path="/room" element={currentUser?.role === "room" ? <RoomDashboard /> : <Navigate to="/admin" replace />} />
        <Route path="/admin" element={currentUser?.role === "admin" ? <AdminDashboard /> : <Navigate to="/room" replace />} />
        <Route path="/admin/floors" element={currentUser?.role === "admin" ? <FloorsPage /> : <Navigate to="/room" replace />} />
        <Route path="/admin/rooms" element={currentUser?.role === "admin" ? <RoomsPage /> : <Navigate to="/room" replace />} />
        <Route path="/admin/targets" element={currentUser?.role === "admin" ? <TargetsPage /> : <Navigate to="/room" replace />} />
        <Route path="/admin/activity" element={currentUser?.role === "admin" ? <ActivityPage /> : <Navigate to="/room" replace />} />
      </Route>
      <Route path="*" element={<Navigate to={currentUser?.role === "admin" ? "/admin" : currentUser?.role === "room" ? "/room" : "/login"} replace />} />
    </Routes>
  );
}
