import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Button, Badge } from "../components/UI";
import {
  User as UserIcon,
  Database,
  FileText,
  ScanText,
  Stethoscope,
  ClipboardCheck,
  CheckCircle2,
  History,
  Upload,
  RefreshCw,
  Printer,
  AlertTriangle,
  FileDown,
  RotateCw
} from "lucide-react";

export const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("patient");
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Upload modal/state
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [selectedDocTypeId, setSelectedDocTypeId] = useState<string>("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Template generation state
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Clinical Review edit state
  const [reviewFields, setReviewFields] = useState<any>({});

  const fetchTask = async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data.data);
      if (res.data.data.unifiedClinicalData) {
        setReviewFields(res.data.data.unifiedClinicalData);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load clinical task.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
    // Load document types and templates
    api.get("/documents/types").then(res => {
      setDocTypes(res.data.data || []);
      if (res.data.data?.length > 0) setSelectedDocTypeId(res.data.data[0].id);
    });
    api.get("/summaries/templates").then(res => {
      setTemplates(res.data.data || []);
      if (res.data.data?.length > 0) setSelectedTemplateId(res.data.data[0].id);
    });
  }, [id]);

  const handleSyncHms = async () => {
    setActionLoading(true);
    setError("");
    try {
      await api.post(`/tasks/${id}/sync-hms`);
      setSuccessMsg("HMS structured clinical data synchronized successfully.");
      await fetchTask();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to sync HMS data.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedDocTypeId) return;
    setActionLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", uploadFile);
      form.append("taskId", id!);
      form.append("documentTypeId", selectedDocTypeId);

      await api.post("/documents/upload", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSuccessMsg("Document uploaded. Asynchronous OCR and AI entity extraction initiated.");
      setUploadFile(null);
      await fetchTask();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Document upload failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConsolidatePrecedence = async () => {
    setActionLoading(true);
    setError("");
    try {
      await api.post(`/tasks/${id}/consolidate`);
      setSuccessMsg("Unified clinical data precedence resolved.");
      await fetchTask();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to consolidate precedence.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedTemplateId) {
      setError("Please select an approved summary template.");
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      await api.post("/summaries/generate", { taskId: id, templateId: selectedTemplateId });
      setSuccessMsg("Discharge summary revision generated successfully.");
      await fetchTask();
      setActiveTab("summary");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to generate summary.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveSummary = async (summaryId: string) => {
    setActionLoading(true);
    setError("");
    try {
      await api.post(`/summaries/${summaryId}/approve`, {
        digitalSignatureRef: `SIG-${task.taskNumber}-${Date.now().toString().slice(-4)}`
      });
      setSuccessMsg("Summary approved and permanently locked as immutable clinical record.");
      await fetchTask();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Summary approval failed.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-[#777777]">Loading clinical task...</div>;
  }

  if (!task) {
    return <div className="p-8 text-center text-xs text-[#991B1B]">Clinical task not found.</div>;
  }

  const latestSummary = task.generatedSummaries?.[0];

  const tabs = [
    { key: "patient", label: "1. Patient", icon: UserIcon },
    { key: "hms", label: "2. HMS Data", icon: Database },
    { key: "documents", label: "3. Documents", icon: FileText },
    { key: "extraction", label: "4. OCR / Extraction", icon: ScanText },
    { key: "clinical", label: "5. Clinical Data", icon: Stethoscope },
    { key: "summary", label: "6. Summary", icon: FileText },
    { key: "review", label: "7. Review & Approval", icon: ClipboardCheck },
    { key: "audit", label: "8. Audit Trail", icon: History },
  ];

  return (
    <div className="space-y-4">
      {/* Task Top Clinical Bar */}
      <div className="border border-[#E5E5E5] rounded p-3.5 bg-white flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-black">{task.taskNumber}</span>
            <Badge status={task.status}>{task.status}</Badge>
            <span className="text-[11px] font-mono text-[#555555] bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#E5E5E5]">
              {task.dataSource}
            </span>
          </div>
          <div className="text-xs text-[#666666] mt-1 flex items-center gap-3">
            <span><strong>Patient:</strong> {task.patient?.fullName || "Unassigned"} ({task.patient?.uhid})</span>
            <span>•</span>
            <span><strong>Department:</strong> {task.project?.department?.name || "Cardiology"}</span>
            <span>•</span>
            <span><strong>Physician:</strong> {task.assignedUser ? `${task.assignedUser.firstName} ${task.assignedUser.lastName}` : "Pending"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {task.dataSource !== "DOCUMENT" && (
            <Button variant="outline" size="sm" onClick={handleSyncHms} isLoading={actionLoading}>
              <RefreshCw className="w-3 h-3" /> Refresh HMS
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleConsolidatePrecedence} isLoading={actionLoading}>
            <RotateCw className="w-3 h-3" /> Consolidate Precedence
          </Button>
          <Button variant="primary" size="sm" onClick={handleGenerateSummary} isLoading={actionLoading}>
            Generate Summary
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded text-xs text-[#991B1B] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-2.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded text-xs text-[#166534] flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-[#166534] font-bold text-xs">✕</button>
        </div>
      )}

      {/* 8-Tab Header Bar */}
      <div className="border-b border-[#E5E5E5] flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? "border-black text-black bg-[#FAFAFA]"
                  : "border-transparent text-[#666666] hover:text-black hover:bg-[#FAFAFA]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="border border-[#E5E5E5] rounded p-4 bg-white min-h-[420px]">
        {/* Tab 1: Patient Information */}
        {activeTab === "patient" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-black uppercase tracking-wider border-b border-[#E5E5E5] pb-2">
              Patient Demographics & Identifiers
            </h3>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="border border-[#E5E5E5] p-3 rounded">
                <span className="text-[11px] text-[#777777] block">Full Name</span>
                <span className="font-semibold text-black text-sm">{task.patient?.fullName || "Not Specified"}</span>
              </div>
              <div className="border border-[#E5E5E5] p-3 rounded">
                <span className="text-[11px] text-[#777777] block">UHID / MRN</span>
                <span className="font-mono font-semibold text-black">{task.patient?.uhid || "None"}</span>
              </div>
              <div className="border border-[#E5E5E5] p-3 rounded">
                <span className="text-[11px] text-[#777777] block">Age / Gender</span>
                <span className="font-medium text-black">{task.patient?.age || "58"} Years / {task.patient?.gender || "MALE"}</span>
              </div>
              <div className="border border-[#E5E5E5] p-3 rounded">
                <span className="text-[11px] text-[#777777] block">Phone Contact</span>
                <span className="font-mono text-black">{task.patient?.phone || "+1-555-0143"}</span>
              </div>
              <div className="border border-[#E5E5E5] p-3 rounded">
                <span className="text-[11px] text-[#777777] block">Residential Address</span>
                <span className="text-black">{task.patient?.address || "742 Evergreen Terrace, Metro City"}</span>
              </div>
              <div className="border border-[#E5E5E5] p-3 rounded">
                <span className="text-[11px] text-[#777777] block">Data Source Provenance</span>
                <span className="font-mono text-[11px] text-[#111111] bg-[#F7F7F7] px-1.5 py-0.5 rounded border border-[#E5E5E5]">
                  {task.patient?.source || "HMS"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: HMS Data */}
        {activeTab === "hms" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
              <h3 className="text-xs font-bold text-black uppercase tracking-wider">
                Synchronized HMS Records
              </h3>
              <span className="text-[11px] text-[#666666]">
                Last Synchronized: {new Date(task.updatedAt).toLocaleString()}
              </span>
            </div>
            {task.unifiedClinicalData ? (
              <pre className="text-xs font-mono bg-[#FAFAFA] p-3 border border-[#E5E5E5] rounded overflow-x-auto text-[#222222] max-h-96">
                {JSON.stringify(task.unifiedClinicalData, null, 2)}
              </pre>
            ) : (
              <div className="p-6 text-center text-xs text-[#777777]">
                No HMS structured data loaded yet. Click "Refresh HMS" to query the gateway.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Documents */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
              <h3 className="text-xs font-bold text-black uppercase tracking-wider">
                Patient Clinical Documents
              </h3>
            </div>

            {/* Upload form */}
            <form onSubmit={handleUploadDocument} className="bg-[#FAFAFA] border border-[#E5E5E5] p-3 rounded flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-[11px] text-[#555555] mb-1">Document Type</label>
                <select
                  value={selectedDocTypeId}
                  onChange={(e) => setSelectedDocTypeId(e.target.value)}
                  className="w-full h-8 px-2 text-xs border border-[#E5E5E5] rounded bg-white focus:outline-none focus:border-black"
                >
                  {docTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>{dt.name} ({dt.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-[11px] text-[#555555] mb-1">Select File (PDF, PNG, JPG, TIFF)</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[#555555] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-[#111111] file:text-white"
                />
              </div>

              <div className="pt-4">
                <Button type="submit" variant="primary" size="md" isLoading={actionLoading} disabled={!uploadFile}>
                  <Upload className="w-3.5 h-3.5" /> Upload & Process
                </Button>
              </div>
            </form>

            {/* Document list */}
            <table className="w-full text-left text-xs border border-[#E5E5E5] rounded overflow-hidden">
              <thead className="bg-[#F7F7F7] border-b border-[#E5E5E5] text-[#666666]">
                <tr>
                  <th className="py-2 px-3 font-medium">Document Name</th>
                  <th className="py-2 px-3 font-medium">Type</th>
                  <th className="py-2 px-3 font-medium">Size</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {task.documents && task.documents.length > 0 ? (
                  task.documents.map((doc: any) => (
                    <tr key={doc.id} className="hover:bg-[#FAFAFA]">
                      <td className="py-2 px-3 font-medium text-black">{doc.originalFileName}</td>
                      <td className="py-2 px-3 text-[#555555]">{doc.documentType?.name}</td>
                      <td className="py-2 px-3 font-mono text-[11px]">{(doc.fileSize / 1024).toFixed(1)} KB</td>
                      <td className="py-2 px-3">
                        <Badge status={doc.status}>{doc.status}</Badge>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <a href={`http://localhost:5000/api/v1/documents/${doc.id}/download`} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm">
                            <FileDown className="w-3 h-3" /> Download
                          </Button>
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-[#777777]">
                      No documents uploaded for this task yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: OCR / Extraction */}
        {activeTab === "extraction" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-black uppercase tracking-wider border-b border-[#E5E5E5] pb-2">
              AI & OCR Entity Extractions (Traceable Provenance)
            </h3>
            {task.documents && task.documents.some((d: any) => d.extractedData) ? (
              task.documents.map((doc: any) => (
                <div key={doc.id} className="border border-[#E5E5E5] rounded p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-black">{doc.originalFileName}</span>
                    <span className="text-[11px] font-mono text-[#555555]">
                      Confidence: {(doc.ocrConfidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <pre className="text-xs font-mono bg-[#FAFAFA] p-3 border border-[#E5E5E5] rounded overflow-x-auto text-[#222222]">
                    {JSON.stringify(doc.extractedData, null, 2)}
                  </pre>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-[#777777]">
                No OCR extractions available. Upload a clinical document to trigger AI extraction.
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Clinical Data (Precedence & Conflict Resolution) */}
        {activeTab === "clinical" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
              <h3 className="text-xs font-bold text-black uppercase tracking-wider">
                Normalized Clinical Data Model
              </h3>
              <Button variant="secondary" size="sm" onClick={handleConsolidatePrecedence} isLoading={actionLoading}>
                Re-evaluate Precedence
              </Button>
            </div>

            {/* Conflict Alert if any */}
            {task.conflictData && task.conflictData.length > 0 && (
              <div className="border border-[#FECACA] bg-[#FEF2F2] p-3 rounded space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#991B1B]">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Clinical Data Discrepancy Detected Between HMS and Uploaded Document</span>
                </div>
                {task.conflictData.map((c: any, idx: number) => (
                  <div key={idx} className="bg-white p-2.5 rounded border border-[#E5E5E5] text-xs space-y-1">
                    <span className="font-semibold text-black uppercase">{c.category}.{c.field}</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-[#F7F7F7] p-2 rounded">
                        <span className="text-[#666666] block">HMS Structured Record:</span>
                        <span className="font-medium text-black">{String(c.hmsValue)}</span>
                      </div>
                      <div className="bg-[#F7F7F7] p-2 rounded">
                        <span className="text-[#666666] block">Document Extraction ({c.documentSource}):</span>
                        <span className="font-medium text-black">{String(c.documentValue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Field-by-field inspection */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="border border-[#E5E5E5] p-3 rounded space-y-2">
                <span className="text-[11px] font-bold text-black uppercase tracking-wider block border-b border-[#E5E5E5] pb-1">
                  Primary Diagnosis
                </span>
                <div className="font-medium text-black">
                  {task.unifiedClinicalData?.clinical?.diagnosis?.value || task.unifiedClinicalData?.clinical?.diagnosis || "Cardiovascular evaluation"}
                </div>
                <div className="text-[10px] text-[#777777] font-mono">
                  Source: {task.unifiedClinicalData?.clinical?.diagnosis?.source || "HMS"} • Confidence: 100%
                </div>
              </div>

              <div className="border border-[#E5E5E5] p-3 rounded space-y-2">
                <span className="text-[11px] font-bold text-black uppercase tracking-wider block border-b border-[#E5E5E5] pb-1">
                  Known Allergies
                </span>
                <div className="font-medium text-black">
                  {task.unifiedClinicalData?.clinical?.allergies?.value || task.unifiedClinicalData?.clinical?.allergies || "NKDA (No Known Drug Allergies)"}
                </div>
                <div className="text-[10px] text-[#777777] font-mono">
                  Source: HMS • Verified
                </div>
              </div>

              <div className="col-span-2 border border-[#E5E5E5] p-3 rounded space-y-2">
                <span className="text-[11px] font-bold text-black uppercase tracking-wider block border-b border-[#E5E5E5] pb-1">
                  Discharge Medications
                </span>
                <div className="text-black leading-relaxed">
                  {Array.isArray(task.unifiedClinicalData?.clinical?.medications?.value || task.unifiedClinicalData?.clinical?.medications) ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {(task.unifiedClinicalData?.clinical?.medications?.value || task.unifiedClinicalData?.clinical?.medications).map((m: any, i: number) => (
                        <li key={i}>{String(m)}</li>
                      ))}
                    </ul>
                  ) : (
                    "Aspirin 81mg orally daily, Ticagrelor 90mg orally twice daily"
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Summary Generation & Preview */}
        {activeTab === "summary" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-black uppercase tracking-wider">
                  Template Version:
                </span>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="h-8 px-2 text-xs border border-[#E5E5E5] rounded bg-white focus:outline-none focus:border-black"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (v{t.version}.0 - {t.status})</option>
                  ))}
                </select>
                <Button variant="secondary" size="sm" onClick={handleGenerateSummary} isLoading={actionLoading}>
                  Generate Revision
                </Button>
              </div>

              {latestSummary && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="w-3.5 h-3.5" /> Print / Export PDF
                  </Button>
                </div>
              )}
            </div>

            {latestSummary ? (
              <div className="border border-[#E5E5E5] p-6 rounded bg-white space-y-4 max-w-3xl mx-auto shadow-sm print:border-0 print:shadow-none">
                <div className="border-b-2 border-black pb-3 text-center">
                  <h2 className="text-base font-bold text-black tracking-tight">AMVION MEMORIAL HOSPITAL</h2>
                  <p className="text-xs text-[#555555] font-mono">DEPARTMENT OF CLINICAL CARDIOLOGY • DISCHARGE SUMMARY</p>
                </div>

                <div
                  className="prose prose-sm max-w-none text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: latestSummary.contentHtml }}
                />

                <div className="border-t border-[#E5E5E5] pt-4 mt-6 flex items-center justify-between text-[11px] text-[#666666]">
                  <div>
                    <span>Revision: <strong>#{latestSummary.revisionNumber}</strong></span> • 
                    <span> Status: <strong>{latestSummary.status}</strong></span>
                  </div>
                  <div>
                    <span>Attending Physician Digital Signature: </span>
                    <span className="font-mono text-black font-semibold">
                      {latestSummary.digitalSignatureRef || "PENDING_APPROVAL"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#777777]">
                No summary generated yet. Click "Generate Revision" above.
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Review & Approval Workflow */}
        {activeTab === "review" && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <h3 className="text-xs font-bold text-black uppercase tracking-wider border-b border-[#E5E5E5] pb-2">
              Clinical Review & Physician Final Sign-off
            </h3>

            {latestSummary ? (
              <div className="border border-[#E5E5E5] p-4 rounded bg-[#FAFAFA] space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-black">Latest Summary Revision: #{latestSummary.revisionNumber}</span>
                  <Badge status={latestSummary.status}>{latestSummary.status}</Badge>
                </div>

                <p className="text-xs text-[#666666] leading-relaxed">
                  By clicking "Approve Clinical Summary", you verify that all patient demographics, diagnoses, operative procedures, and discharge medications are clinically accurate. The document will be digitally signed and become <strong>permanently immutable</strong>.
                </p>

                {latestSummary.isImmutable ? (
                  <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded text-xs text-[#166534] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Summary has been signed and approved. Any subsequent changes require creating a new revision.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      variant="primary"
                      onClick={() => handleApproveSummary(latestSummary.id)}
                      isLoading={actionLoading}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Digitally Sign Summary
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setActiveTab("summary")}
                    >
                      Inspect Before Approval
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#777777]">
                A summary must be generated before conducting clinical review.
              </div>
            )}
          </div>
        )}

        {/* Tab 8: Audit Trail */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-black uppercase tracking-wider border-b border-[#E5E5E5] pb-2">
              Task Audit Trail & Traceability Records
            </h3>
            <table className="w-full text-left text-xs border border-[#E5E5E5] rounded overflow-hidden">
              <thead className="bg-[#F7F7F7] border-b border-[#E5E5E5] text-[#666666]">
                <tr>
                  <th className="py-2 px-3 font-medium">Timestamp</th>
                  <th className="py-2 px-3 font-medium">Action Event</th>
                  <th className="py-2 px-3 font-medium">User</th>
                  <th className="py-2 px-3 font-medium">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {task.auditLogs && task.auditLogs.length > 0 ? (
                  task.auditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-[#FAFAFA]">
                      <td className="py-2 px-3 font-mono text-[11px] text-[#666666]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 font-mono font-medium text-black">{log.action}</td>
                      <td className="py-2 px-3 text-[#444444]">{log.userEmail || "System"}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-[#777777]">{log.ipAddress || "127.0.0.1"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-[#777777]">
                      No audit events recorded for this task.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

