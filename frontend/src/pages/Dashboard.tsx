import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { Badge, Button } from "../components/UI";
import {
  Activity,
  Plus,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  RotateCw
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get("/dashboard/stats");
      setData(res.data.data);
    } catch (e) {
      console.error("Failed to load dashboard stats", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-gray-400">
        Loading clinical operational metrics...
      </div>
    );
  }

  const { metrics, systemStatus, recentTasks, recentAuditLogs, statusBreakdown, sourceBreakdown, trendTimeline } = data || {};

  // Soft light-tinted colors for analytics charts
  const LIGHT_STATUS_COLORS: Record<string, string> = {
    DRAFT: "#94A3B8",
    DATA_FETCHED: "#38BDF8",
    DOCUMENT_UPLOADED: "#818CF8",
    PROCESSING: "#A78BFA",
    EXTRACTION_COMPLETED: "#67E8F9",
    VALIDATION_REQUIRED: "#FBBF24",
    READY_FOR_REVIEW: "#F59E0B",
    REVIEWED: "#34D399",
    APPROVED: "#10B981",
    COMPLETED: "#059669",
    FAILED: "#F87171"
  };

  const pieData = statusBreakdown && statusBreakdown.length > 0 
    ? statusBreakdown.map((s: any) => ({
        name: s.status.replace(/_/g, " "),
        value: s.count,
        color: LIGHT_STATUS_COLORS[s.status] || "#94A3B8"
      }))
    : [
        { name: "Approved", value: metrics?.completedSummaries || 1, color: "#34D399" },
        { name: "Ready for Review", value: metrics?.pendingReview || 1, color: "#FBBF24" },
        { name: "Active Ingestion", value: metrics?.activeTasks || 2, color: "#60A5FA" }
      ];

  const sourceData = sourceBreakdown && sourceBreakdown.length > 0
    ? sourceBreakdown.map((s: any) => ({
        name: s.source.replace(/_/g, " + "),
        count: s.count
      }))
    : [
        { name: "HMS + Doc", count: 4 },
        { name: "HMS Only", count: 3 },
        { name: "Doc Upload", count: 2 }
      ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between border-b border-gray-200/90 pb-3">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight">Clinical Operations Dashboard</h1>
          <p className="text-xs text-gray-500">
            Real-time discharge summary generation statistics and pipeline health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchStats}>
            <RotateCw className="w-3 h-3 text-gray-500" /> Refresh
          </Button>
          <Link to="/tasks/new">
            <Button variant="primary">
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards (Using soft light background accents for healthcare topography) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-gray-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Active Tasks
            </span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {metrics?.activeTasks || 0}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">In-flight patient summaries</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-gray-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Pending Review
            </span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {metrics?.pendingReview || 0}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Awaiting physician sign-off</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-gray-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Approved Summaries
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {metrics?.completedSummaries || 0}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Locked immutable records</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-gray-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Total Patients
            </span>
            <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {metrics?.totalPatients || 0}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Clinical repository</p>
        </div>
      </div>

      {/* Light-Coloured Analytics & Trend Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Throughput (AreaChart with subtle light blue fill) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Summary Throughput & Approval Velocity
              </h2>
            </div>
            <span className="text-[11px] font-mono text-gray-400">Past 7 Days</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendTimeline || []} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#93C5FD" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#EFF6FF" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A7F3D0" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#F0FDF4" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid #E2E8F0" }} />
                <Area type="monotone" dataKey="created" name="Tasks Initialized" stroke="#3B82F6" fillOpacity={1} fill="url(#colorCreated)" />
                <Area type="monotone" dataKey="approved" name="Summaries Approved" stroke="#10B981" fillOpacity={1} fill="url(#colorApproved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Donut Chart */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-gray-500" />
              <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Workflow Distribution
              </h2>
            </div>
            <span className="text-[10px] text-gray-400">By Status</span>
          </div>

          <div className="h-32 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: "10px", borderRadius: "6px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1 pt-2 border-t border-gray-100">
            {pieData.slice(0, 3).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-[11px] text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-mono font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Integration Status Banner */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-5">
          <span className="font-semibold text-gray-900 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-600" /> Microservice Connectivity:
          </span>
          <span className="flex items-center gap-1.5 text-gray-600">
            HMS Gateway: <span className="font-mono text-gray-900 font-semibold">{systemStatus?.hmsName}</span>
            <Badge status={systemStatus?.hms}>{systemStatus?.hms}</Badge>
          </span>
          <span className="flex items-center gap-1.5 text-gray-600">
            AI Engine: <Badge status={systemStatus?.aiService}>{systemStatus?.aiService}</Badge>
          </span>
        </div>
        <Link to="/hms" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 text-[11px]">
          Configure Gateway <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Recent Tasks & Audit Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Recent Clinical Summaries
            </h2>
            <Link to="/tasks" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all tasks
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200/60 text-gray-500">
                <tr>
                  <th className="py-2.5 px-3.5 font-medium">Task #</th>
                  <th className="py-2.5 px-3.5 font-medium">Patient Details</th>
                  <th className="py-2.5 px-3.5 font-medium">Channel</th>
                  <th className="py-2.5 px-3.5 font-medium">Status</th>
                  <th className="py-2.5 px-3.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTasks && recentTasks.length > 0 ? (
                  recentTasks.map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono font-medium text-gray-900">
                        {t.taskNumber}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="font-semibold text-gray-900">{t.patient?.fullName || "Unassigned"}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{t.patient?.uhid}</div>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="text-[10px] font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                          {t.dataSource}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <Badge status={t.status}>{t.status}</Badge>
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        <Link to={`/tasks/${t.id}`}>
                          <Button variant="outline" size="sm">
                            Inspect
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-gray-400">
                      No active tasks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Audit Event Stream
            </h2>
            <Link to="/audit-logs" className="text-xs text-gray-500 hover:text-gray-900">
              Full Logs
            </Link>
          </div>
          <div className="p-3 divide-y divide-gray-100 overflow-y-auto max-h-80">
            {recentAuditLogs && recentAuditLogs.length > 0 ? (
              recentAuditLogs.map((log: any) => (
                <div key={log.id} className="py-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold text-gray-900">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                    {log.userEmail || "System Automation"} • {log.entity}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-gray-400">
                No recent audit events.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
