import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Button } from "../components/UI";
import { Search, Database, FileUp, Sparkles, AlertCircle } from "lucide-react";

export const TaskCreate: React.FC = () => {
  const navigate = useNavigate();
  const [dataSource, setDataSource] = useState<"HMS" | "DOCUMENT" | "HMS_AND_DOCUMENT">("HMS_AND_DOCUMENT");
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [selectedProjectTypeId, setSelectedProjectTypeId] = useState<string>("");

  // Patient Search (HMS)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Manual Document Patient Details fallback
  const [manualName, setManualName] = useState("");
  const [manualAge, setManualAge] = useState("");
  const [manualGender, setManualGender] = useState("MALE");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await api.get("/projects");
        setProjects(res.data.data);
        if (res.data.data.length > 0) {
          const firstProj = res.data.data[0];
          setSelectedProjectId(firstProj.id);
          setProjectTypes(firstProj.projectTypes || []);
          if (firstProj.projectTypes?.length > 0) {
            setSelectedProjectTypeId(firstProj.projectTypes[0].id);
          }
        }
      } catch (err: any) {
        console.error(err);
      }
    };
    loadProjects();
  }, []);

  const handleSearchPatient = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await api.get("/hms/patients/search", { params: { q: searchQuery } });
      setSearchResults(res.data.data || []);
      if (res.data.data?.length === 0) {
        setError("No patient records found in HMS matching the query.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to search patient in HMS.");
    } finally {
      setSearching(false);
    }
  };

  const handleCreateTask = async () => {
    setError("");
    if (!selectedProjectId || !selectedProjectTypeId) {
      setError("Please select a project and project workflow type.");
      return;
    }

    if ((dataSource === "HMS" || dataSource === "HMS_AND_DOCUMENT") && !selectedPatient) {
      setError("Please search and select a patient record from the HMS gateway.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        projectId: selectedProjectId,
        projectTypeId: selectedProjectTypeId,
        dataSource,
      };

      if (dataSource === "HMS" || dataSource === "HMS_AND_DOCUMENT") {
        payload.uhid = selectedPatient.uhid;
      } else {
        payload.patientData = {
          fullName: manualName || "Unspecified Patient",
          age: parseInt(manualAge) || 45,
          gender: manualGender,
        };
      }

      const res = await api.post("/tasks", payload);
      navigate(`/tasks/${res.data.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to create task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-[#E5E5E5] pb-3">
        <h1 className="text-base font-bold text-black tracking-tight">Create Clinical Task</h1>
        <p className="text-xs text-[#666666]">
          Initialize a new discharge workflow using one of the three clinical data ingestion channels
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded text-xs text-[#991B1B] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Select Ingestion Channel (3 primary options) */}
      <div className="border border-[#E5E5E5] rounded p-4 bg-white space-y-3">
        <label className="block text-xs font-bold text-black uppercase tracking-wider">
          1. Select Clinical Data Ingestion Channel
        </label>
        
        <div className="grid grid-cols-3 gap-3">
          {/* Option 1: HMS */}
          <div
            onClick={() => setDataSource("HMS")}
            className={`cursor-pointer border p-3 rounded transition-all ${
              dataSource === "HMS"
                ? "border-black bg-[#F7F7F7]"
                : "border-[#E5E5E5] hover:border-[#CCCCCC]"
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                checked={dataSource === "HMS"}
                onChange={() => setDataSource("HMS")}
                className="text-black"
              />
              <span className="font-semibold text-xs text-black">Option 1: HMS</span>
            </div>
            <p className="text-[11px] text-[#666666] mt-1.5 leading-relaxed">
              Retrieve patient demographics, admissions, diagnoses, and lab results directly via the configured HMS gateway.
            </p>
          </div>

          {/* Option 2: Document Upload */}
          <div
            onClick={() => setDataSource("DOCUMENT")}
            className={`cursor-pointer border p-3 rounded transition-all ${
              dataSource === "DOCUMENT"
                ? "border-black bg-[#F7F7F7]"
                : "border-[#E5E5E5] hover:border-[#CCCCCC]"
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                checked={dataSource === "DOCUMENT"}
                onChange={() => setDataSource("DOCUMENT")}
                className="text-black"
              />
              <span className="font-semibold text-xs text-black">Option 2: Document Upload</span>
            </div>
            <p className="text-[11px] text-[#666666] mt-1.5 leading-relaxed">
              Upload patient clinical documents (PDF, TIFF, Scans). Automated OCR and deterministic AI extraction pipeline.
            </p>
          </div>

          {/* Option 3: HMS + Document */}
          <div
            onClick={() => setDataSource("HMS_AND_DOCUMENT")}
            className={`cursor-pointer border p-3 rounded transition-all ${
              dataSource === "HMS_AND_DOCUMENT"
                ? "border-black bg-[#F7F7F7]"
                : "border-[#E5E5E5] hover:border-[#CCCCCC]"
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                checked={dataSource === "HMS_AND_DOCUMENT"}
                onChange={() => setDataSource("HMS_AND_DOCUMENT")}
                className="text-black"
              />
              <span className="font-semibold text-xs text-black">Option 3: HMS + Document</span>
            </div>
            <p className="text-[11px] text-[#666666] mt-1.5 leading-relaxed">
              Unified Clinical Data. Merges structured HMS data with uploaded notes, performing precedence resolution and conflict detection.
            </p>
          </div>
        </div>
      </div>

      {/* Step 2: Project & Workflow Type Configuration */}
      <div className="border border-[#E5E5E5] rounded p-4 bg-white grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
            Project Workflow
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              const proj = projects.find(p => p.id === e.target.value);
              setProjectTypes(proj?.projectTypes || []);
              if (proj?.projectTypes?.length > 0) {
                setSelectedProjectTypeId(proj.projectTypes[0].id);
              }
            }}
            className="w-full h-8 px-2 text-xs border border-[#E5E5E5] rounded bg-white focus:outline-none focus:border-black"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.department?.name || "General"})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
            Project Document Type
          </label>
          <select
            value={selectedProjectTypeId}
            onChange={(e) => setSelectedProjectTypeId(e.target.value)}
            className="w-full h-8 px-2 text-xs border border-[#E5E5E5] rounded bg-white focus:outline-none focus:border-black"
          >
            {projectTypes.map((pt) => (
              <option key={pt.id} value={pt.id}>
                {pt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Step 3: Patient Selection or Entry */}
      {(dataSource === "HMS" || dataSource === "HMS_AND_DOCUMENT") ? (
        <div className="border border-[#E5E5E5] rounded p-4 bg-white space-y-4">
          <label className="block text-xs font-bold text-black uppercase tracking-wider">
            3. Search Patient from HMS Gateway
          </label>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#888888] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search by UHID (e.g. UHID-2026-9011), Patient Name, or Encounter #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchPatient()}
                className="w-full h-8 pl-8 pr-2.5 text-xs bg-white border border-[#E5E5E5] rounded focus:outline-none focus:border-black"
              />
            </div>
            <Button variant="secondary" onClick={handleSearchPatient} isLoading={searching}>
              Search HMS
            </Button>
          </div>

          {/* Patient Search Results */}
          {searchResults.length > 0 && (
            <div className="border border-[#E5E5E5] rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F7F7] border-b border-[#E5E5E5] text-[#666666]">
                  <tr>
                    <th className="py-2 px-3 font-medium">UHID</th>
                    <th className="py-2 px-3 font-medium">Patient Name</th>
                    <th className="py-2 px-3 font-medium">Age / Gender</th>
                    <th className="py-2 px-3 font-medium">Encounter</th>
                    <th className="py-2 px-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {searchResults.map((p) => {
                    const isSelected = selectedPatient?.uhid === p.uhid;
                    return (
                      <tr key={p.uhid} className={isSelected ? "bg-[#F7F7F7]" : "hover:bg-[#FAFAFA]"}>
                        <td className="py-2 px-3 font-mono font-medium text-black">{p.uhid}</td>
                        <td className="py-2 px-3 font-medium text-black">{p.name}</td>
                        <td className="py-2 px-3">{p.age} Yrs / {p.gender}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-[#555555]">{p.encounterNumber || "ENC-081"}</td>
                        <td className="py-2 px-3 text-right">
                          <Button
                            size="sm"
                            variant={isSelected ? "primary" : "outline"}
                            onClick={() => setSelectedPatient(p)}
                          >
                            {isSelected ? "Selected" : "Select"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {selectedPatient && (
            <div className="p-3 bg-[#F7F7F7] border border-[#E5E5E5] rounded text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-black">Active Selection:</span> {selectedPatient.name} ({selectedPatient.uhid}) • {selectedPatient.department}
              </div>
              <span className="text-[11px] font-mono text-[#166534] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#BBF7D0]">
                HMS Ready
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-[#E5E5E5] rounded p-4 bg-white space-y-3">
          <label className="block text-xs font-bold text-black uppercase tracking-wider">
            3. Patient Initial Metadata (Optional)
          </label>
          <p className="text-xs text-[#666666]">
            Patient details will be automatically extracted from uploaded clinical notes. You may specify defaults below.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-[#444444] mb-1">Patient Full Name</label>
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="e.g. Eleanor Vance"
                className="w-full h-8 px-2.5 text-xs border border-[#E5E5E5] rounded bg-white focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#444444] mb-1">Age</label>
              <input
                type="number"
                value={manualAge}
                onChange={(e) => setManualAge(e.target.value)}
                placeholder="e.g. 52"
                className="w-full h-8 px-2.5 text-xs border border-[#E5E5E5] rounded bg-white focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#444444] mb-1">Gender</label>
              <select
                value={manualGender}
                onChange={(e) => setManualGender(e.target.value)}
                className="w-full h-8 px-2 text-xs border border-[#E5E5E5] rounded bg-white focus:outline-none focus:border-black"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Submission */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="outline" onClick={() => navigate("/tasks")}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleCreateTask} isLoading={loading}>
          Initialize Task & Proceed
        </Button>
      </div>
    </div>
  );
};

