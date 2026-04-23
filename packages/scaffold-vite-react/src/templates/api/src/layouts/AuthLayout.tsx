import { getToken } from "@/utils/token";
import { Navigate, Outlet } from "react-router";

export function AuthLayout() {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}
