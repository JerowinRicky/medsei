import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  FileText,
  Users,
  Settings,
  Shield,
  Activity,
  LogOut,
  Hospital,
  BarChart2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import medseiLogo from "../assets/medsei-logo.svg";

export const Layout: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Clinical Tasks", path: "/tasks", icon: FileText },
    { label: "Analytics", path: "/analytics", icon: BarChart2 },
    { label: "Projects & Setup", path: "/projects", icon: Layers },
    { label: "HMS Integrations", path: "/hms", icon: Hospital },
    { label: "Summary Templates", path: "/templates", icon: FileText },
    { label: "User Management", path: "/users", icon: Users },
    { label: "Audit Logs", path: "/audit-logs", icon: Shield },
    { label: "System & AI Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#FBFBFB] overflow-hidden select-none">
      {/* Sidebar */}
      <aside className="w-56 border-r border-gray-200/80 bg-white flex flex-col justify-between shadow-[1px_0_3px_rgba(0,0,0,0.02)]">
        <div>
          {/* Custom Branding Header with new SVG logo */}
          <div className="h-14 border-b border-gray-100 flex items-center px-4 gap-2.5">
            <img src={medseiLogo} alt="Medsei Logo" className="w-7 h-7 shadow-xs rounded-lg" />
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-gray-900 leading-tight">
                MEDSEI
              </span>
              <span className="text-[10px] text-gray-400 font-mono tracking-wider">
                CLINICAL ENTERPRISE
              </span>
            </div>
            <span className="text-[9px] text-gray-500 font-mono bg-gray-50 border border-gray-200 px-1 py-0.5 rounded ml-auto">
              v1.1
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-2.5 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                    isActive
                      ? "bg-gray-100 text-gray-900 font-semibold shadow-2xs border-l-2 border-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/70">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <div className="text-xs font-semibold text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[10px] text-gray-500 font-mono truncate">
                {user?.role?.name || "Clinical Specialist"}
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-gray-400 hover:text-gray-800 rounded-lg hover:bg-gray-200/60 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#FBFBFB]">
        <header className="h-12 border-b border-gray-200/80 flex items-center justify-between px-6 bg-white/90 backdrop-blur-xs">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Amvion Healthcare System</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium">{user?.organization?.name || "Hospital Network"}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              HMS Gateway: <span className="font-mono text-gray-900 font-semibold">ONLINE</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              AI Microservice: <span className="font-mono text-gray-900 font-semibold">ACTIVE</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
