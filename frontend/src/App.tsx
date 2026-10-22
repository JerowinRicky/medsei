import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { TaskList } from "./pages/TaskList";
import { TaskCreate } from "./pages/TaskCreate";
import { TaskDetail } from "./pages/TaskDetail";
import { HmsConfig } from "./pages/HmsConfig";
import { TemplateManager } from "./pages/TemplateManager";
import { UserManager } from "./pages/UserManager";
import { AuditLogs } from "./pages/AuditLogs";
import { SystemSettings } from "./pages/SystemSettings";
import { ProjectManager } from "./pages/ProjectManager";
import { AnalyticsPage } from "./pages/AnalyticsPage";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();
  if (isLoading) return <div className="p-8 text-center text-xs text-gray-400">Validating hospital session...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="tasks" element={<TaskList />} />
            <Route path="tasks/new" element={<TaskCreate />} />
            <Route path="tasks/:id" element={<TaskDetail />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="projects" element={<ProjectManager />} />
            <Route path="hms" element={<HmsConfig />} />
            <Route path="templates" element={<TemplateManager />} />
            <Route path="users" element={<UserManager />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="settings" element={<SystemSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
