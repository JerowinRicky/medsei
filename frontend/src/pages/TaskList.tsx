import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { Badge, Button } from "../components/UI";
import { Plus, Search, Filter } from "lucide-react";

export const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dataSourceFilter, setDataSourceFilter] = useState("");

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get("/tasks", {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          dataSource: dataSourceFilter || undefined,
        }
      });
      setTasks(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, dataSourceFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTasks();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
        <div>
          <h1 className="text-base font-bold text-black tracking-tight">Clinical Tasks</h1>
          <p className="text-xs text-[#666666]">
            Manage patient discharge pipelines, reviews, and clinical approvals
          </p>
        </div>
        <Link to="/tasks/new">
          <Button variant="primary">
            <Plus className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-[#FAFAFA] p-2.5 rounded border border-[#E5E5E5]">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#888888] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by UHID, patient name, task number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-2.5 text-xs bg-white border border-[#E5E5E5] rounded focus:outline-none focus:border-black"
            />
          </div>
          <Button type="submit" variant="secondary" size="md">
            Filter
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[#666666]">
            <Filter className="w-3 h-3" /> Source:
          </div>
          <select
            value={dataSourceFilter}
            onChange={(e) => setDataSourceFilter(e.target.value)}
            className="h-8 px-2 text-xs bg-white border border-[#E5E5E5] rounded focus:outline-none focus:border-black"
          >
            <option value="">All Data Sources</option>
            <option value="HMS">HMS Only</option>
            <option value="DOCUMENT">Document Upload</option>
            <option value="HMS_AND_DOCUMENT">HMS + Document</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-2 text-xs bg-white border border-[#E5E5E5] rounded focus:outline-none focus:border-black"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="DATA_FETCHED">Data Fetched</option>
            <option value="EXTRACTION_COMPLETED">Extraction Completed</option>
            <option value="READY_FOR_REVIEW">Ready For Review</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="border border-[#E5E5E5] rounded bg-white overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F7F7F7] border-b border-[#E5E5E5] text-[#666666]">
            <tr>
              <th className="py-2.5 px-3 font-medium">Task ID</th>
              <th className="py-2.5 px-3 font-medium">Patient Details</th>
              <th className="py-2.5 px-3 font-medium">Data Source</th>
              <th className="py-2.5 px-3 font-medium">Encounter</th>
              <th className="py-2.5 px-3 font-medium">Workflow Status</th>
              <th className="py-2.5 px-3 font-medium">Assigned Doctor</th>
              <th className="py-2.5 px-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5]">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#777777]">
                  Loading task records...
                </td>
              </tr>
            ) : tasks.length > 0 ? (
              tasks.map((task) => (
                <tr key={task.id} className="hover:bg-[#FAFAFA]">
                  <td className="py-2.5 px-3 font-mono font-medium text-black">
                    {task.taskNumber}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-black">{task.patient?.fullName || "Unregistered"}</div>
                    <div className="text-[11px] text-[#777777] font-mono">
                      {task.patient?.uhid} {task.patient?.age ? `• ${task.patient.age}y` : ""} {task.patient?.gender ? `• ${task.patient.gender}` : ""}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[11px] font-mono bg-[#F7F7F7] px-1.5 py-0.5 rounded border border-[#E5E5E5]">
                      {task.dataSource}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-[#555555]">
                    {task.encounter?.encounterNumber || "ENC-081"}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge status={task.status}>{task.status}</Badge>
                  </td>
                  <td className="py-2.5 px-3 text-[#444444]">
                    {task.assignedUser ? `${task.assignedUser.firstName} ${task.assignedUser.lastName}` : "Unassigned"}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Link to={`/tasks/${task.id}`}>
                      <Button variant="outline" size="sm">
                        Inspect
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#777777]">
                  No tasks matched the criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

