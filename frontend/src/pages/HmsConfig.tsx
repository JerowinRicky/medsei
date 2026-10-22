import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { Button, Badge } from "../components/UI";
import {
  Hospital,
  CheckCircle,
  RefreshCw,
  Plus,
  AlertCircle,
  Edit2,
  X,
  Save,
  Link as LinkIcon,
  Server,
  KeyRound,
  ShieldCheck
} from "lucide-react";

export const HmsConfig: React.FC = () => {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<any>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Edit / Add modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState("");
  const [hmsName, setHmsName] = useState("");
  const [integrationType, setIntegrationType] = useState("REST");
  const [baseUrl, setBaseUrl] = useState("");
  const [authType, setAuthType] = useState("BEARER");
  const [timeoutMs, setTimeoutMs] = useState(15000);
  const [retryCount, setRetryCount] = useState(3);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConnections = async () => {
    try {
      const res = await api.get("/hms/connections");
      setConnections(res.data.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await api.post(`/hms/connections/${id}/test`);
      setTestResult({ success: true, message: res.data.message });
      fetchConnections();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.response?.data?.error?.message || "Connection test failed."
      });
    } finally {
      setTestingId(null);
    }
  };

  const openEditModal = (conn?: any) => {
    if (conn) {
      setEditingId(conn.id);
      setHospitalName(conn.hospitalName || "");
      setHmsName(conn.hmsName || "");
      setIntegrationType(conn.integrationType || "REST");
      setBaseUrl(conn.baseUrl || "");
      setAuthType(conn.authType || "BEARER");
      setTimeoutMs(conn.timeoutMs || 15000);
      setRetryCount(conn.retryCount || 3);
      setActive(conn.active !== undefined ? conn.active : true);
    } else {
      setEditingId(null);
      setHospitalName("Amvion Memorial Hospital");
      setHmsName("");
      setIntegrationType("REST");
      setBaseUrl("http://localhost:5000/api/v1/mock-hms");
      setAuthType("BEARER");
      setTimeoutMs(15000);
      setRetryCount(3);
      setActive(true);
    }
    setShowModal(true);
  };

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/hms/connections", {
        id: editingId || undefined,
        hospitalName,
        hmsName,
        integrationType,
        baseUrl,
        authType,
        timeoutMs: Number(timeoutMs),
        retryCount: Number(retryCount),
        active
      });
      setShowModal(false);
      fetchConnections();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to save HMS connection");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight">
            Hospital Management System (HMS) Integration
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure live endpoints, authentication protocols, and patient clinical field bindings
          </p>
        </div>
        <Button variant="primary" onClick={() => openEditModal()}>
          <Plus className="w-3.5 h-3.5" />
          <span>New HMS Gateway</span>
        </Button>
      </div>

      {/* Permissions & Security Banner */}
      <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-blue-900">
          <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            <strong>Access Control:</strong> Modifying HMS gateway parameters requires{" "}
            <code className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono text-[11px]">HMS_CONFIGURE</code> permission (held by <strong>Super Admin</strong> & <strong>Hospital Admin</strong>).
          </span>
        </div>
        <span className="text-[11px] font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
          Encrypted Credentials
        </span>
      </div>

      {testResult && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
            testResult.success
              ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]"
              : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
          }`}
        >
          {testResult.success ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Connections List */}
      <div className="space-y-5">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading HMS connections...</div>
        ) : connections.length > 0 ? (
          connections.map((conn) => (
            <div
              key={conn.id}
              className="border border-gray-200/80 rounded-xl p-4 bg-white space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Hospital className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">{conn.hmsName}</h2>
                    <span className="text-[11px] text-gray-500 font-mono">
                      Hospital: {conn.hospitalName}
                    </span>
                  </div>
                  <Badge status={conn.lastTestStatus} className="ml-2">
                    {conn.lastTestStatus || "CONNECTED"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(conn)}
                  >
                    <Edit2 className="w-3 h-3 text-gray-600" /> Edit Configuration
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleTestConnection(conn.id)}
                    isLoading={testingId === conn.id}
                  >
                    <RefreshCw className="w-3 h-3" /> Test Gateway
                  </Button>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="border border-gray-200/80 p-2.5 rounded-lg bg-gray-50/70">
                  <span className="text-[11px] text-gray-500 block mb-0.5">Integration Type</span>
                  <span className="font-mono font-semibold text-gray-900">{conn.integrationType}</span>
                </div>
                <div className="border border-gray-200/80 p-2.5 rounded-lg bg-gray-50/70">
                  <span className="text-[11px] text-gray-500 block mb-0.5">Base Gateway URL</span>
                  <span className="font-mono text-gray-900 truncate block font-medium">{conn.baseUrl}</span>
                </div>
                <div className="border border-gray-200/80 p-2.5 rounded-lg bg-gray-50/70">
                  <span className="text-[11px] text-gray-500 block mb-0.5">Auth Protocol</span>
                  <span className="font-mono font-semibold text-gray-900">{conn.authType}</span>
                </div>
                <div className="border border-gray-200/80 p-2.5 rounded-lg bg-gray-50/70">
                  <span className="text-[11px] text-gray-500 block mb-0.5">Timeout / Retries</span>
                  <span className="font-mono text-gray-900">{conn.timeoutMs}ms / {conn.retryCount} Retries</span>
                </div>
              </div>

              {/* Configured Endpoints */}
              <div>
                <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Configured Endpoints
                </h3>
                <div className="border border-gray-200/80 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/80 border-b border-gray-200/60 text-gray-500">
                      <tr>
                        <th className="py-2 px-3 font-medium">Endpoint Purpose</th>
                        <th className="py-2 px-3 font-medium">Method</th>
                        <th className="py-2 px-3 font-medium">Relative Path</th>
                        <th className="py-2 px-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {conn.endpoints?.map((ep: any) => (
                        <tr key={ep.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-2 px-3 font-medium text-gray-900">{ep.name}</td>
                          <td className="py-2 px-3 font-mono text-[11px] font-semibold text-gray-800">
                            {ep.httpMethod}
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-gray-600">{ep.path}</td>
                          <td className="py-2 px-3">
                            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                              ACTIVE
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Field Mappings */}
              <div>
                <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Field Mappings (HMS Source Path → Internal Clinical Model)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {conn.fieldMappings?.map((m: any) => (
                    <div
                      key={m.id}
                      className="p-2 border border-gray-200/80 rounded-lg flex items-center justify-between bg-gray-50/60"
                    >
                      <span className="font-mono text-[11px] text-gray-600">{m.sourcePath}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-mono text-[11px] font-semibold text-gray-900">
                        {m.targetField}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-10 text-center text-xs text-gray-400 bg-white border border-gray-200 rounded-xl">
            No HMS connections configured. Click "New HMS Gateway" to connect your hospital system.
          </div>
        )}
      </div>

      {/* Modal: Edit / Configure HMS Gateway */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900">
                {editingId ? "Edit HMS Gateway Configuration" : "New HMS Gateway Connection"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConnection} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Hospital Facility</label>
                  <input
                    type="text"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    required
                    className="w-full h-8 px-2.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">HMS Gateway Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Cerner Millennium or Epic REST"
                    value={hmsName}
                    onChange={(e) => setHmsName(e.target.value)}
                    required
                    className="w-full h-8 px-2.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Base Gateway URL</label>
                <input
                  type="text"
                  placeholder="https://hms.hospital.org/api/v1"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  required
                  className="w-full h-8 px-2.5 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Integration Protocol</label>
                  <select
                    value={integrationType}
                    onChange={(e) => setIntegrationType(e.target.value)}
                    className="w-full h-8 px-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="REST">REST API Gateway</option>
                    <option value="FHIR">FHIR R4 Adapter</option>
                    <option value="HL7">HL7 v2 Message Broker</option>
                    <option value="MOCK">Simulated Internal Gateway</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Auth Type</label>
                  <select
                    value={authType}
                    onChange={(e) => setAuthType(e.target.value)}
                    className="w-full h-8 px-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="BEARER">Bearer Token (JWT)</option>
                    <option value="API_KEY">API Key / Secret Header</option>
                    <option value="OAUTH2">OAuth 2.0 (Client Credentials)</option>
                    <option value="BASIC">Basic Authentication</option>
                    <option value="NONE">No Authentication</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Timeout (ms)</label>
                  <input
                    type="number"
                    value={timeoutMs}
                    onChange={(e) => setTimeoutMs(Number(e.target.value))}
                    className="w-full h-8 px-2.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Retry Count</label>
                  <input
                    type="number"
                    value={retryCount}
                    onChange={(e) => setRetryCount(Number(e.target.value))}
                    className="w-full h-8 px-2.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={saving}>
                  Save HMS Connection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
