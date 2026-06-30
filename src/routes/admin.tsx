import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getMe } from "@/lib/api";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

function Admin() {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // 1. Verify admin
    getMe()
      .then((res) => {
        if (res.profile.email !== "admin@admin.com") {
          navigate({ to: "/home" });
        } else {
          setIsCheckingAuth(false);
        }
      })
      .catch(() => {
        navigate({ to: "/auth" });
      });
  }, [navigate]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#08070f] flex items-center justify-center text-white text-sm">
        Verifying admin access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08070f] text-white flex flex-col">
      {/* Top Header with Back Button */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <Link 
          to="/profile" 
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Admin CMS</h1>
          <p className="text-xs text-white/50">Manage all platform data</p>
        </div>
      </div>

      {/* Main Dashboard Area */}
      <div className="flex-1 relative">
        <AdminDashboard />
      </div>
    </div>
  );
}
