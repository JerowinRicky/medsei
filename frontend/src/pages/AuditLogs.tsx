import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { Shield } from "lucide-react";

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get("/audit-logs");
        setLogs(res.data.data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
        <div>
          <h1 className="text-base font-bold text-black tracking-tight">Audit Trail & Compliance Log</h1>
          <p className="text-xs text-[#666666]">
            Immutable chronological record of all patient data views, OCR extractions, and clinical approvals
          </p>
        </div>
      </div>

      <div className="border border-[#E5E5E5] rounded bg-white overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F7F7F7] border-b border-[#E5E5E5] text-[#666666]">
            <tr>
              <th className="py-2.5 px-3 font-medium">Timestamp</th>
              <th className="py-2.5 px-3 font-medium">Action Event</th>
              <th className="py-2.5 px-3 font-medium">Actor</th>
              <th className="py-2.5 px-3 font-medium">Role</th>
              <th className="py-2.5 px-3 font-medium">Target Entity</th>
              <th className="py-2.5 px-3 font-medium">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5]">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-[#FAFAFA]">
                <td className="py-2.5 px-3 font-mono text-[11px] text-[#555555]">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="py-2.5 px-3 font-mono font-medium text-black">
                  {log.action}
                </td>
                <td className="py-2.5 px-3 text-[#333333]">
                  {log.userEmail || "System Automation"}
                </td>
                <td className="py-2.5 px-3 text-[#666666] font-mono text-[11px]">
                  {log.userRole || "CORE_SERVICE"}
                </td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-[#444444]">
                  {log.entity} {log.entityId ? `(#${log.entityId.slice(0, 8)})` : ""}
                </td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-[#777777]">
                  {log.ipAddress || "127.0.0.1"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

