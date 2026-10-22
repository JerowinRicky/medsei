import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { Badge, Button } from "../components/UI";
import {
  Layers,
  Plus,
  FileText,
  CheckCircle,
  FolderOpen,
  ArrowRight,
  Sparkles,
  X,
  Code
} from "lucide-react";

export const ProjectManager: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for creating new workflow project & template
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [dataSource, setDataSource] = useState("HMS_AND_DOCUMENT");
  const [templateName, setTemplateName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    setCreating(true);
    try {
      await api.post("/projects", {
        name: projectName,
        description: projectDescription,
        dataSource,
        templateName: templateName || `${projectName} Summary Template`
      });
      setShowCreateModal(false);
      setProjectName("");
      setProjectDescription("");
      setTemplateName("");
      fetchProjects();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight">
            Projects & Discharge Summary Setup
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure hospital workflows and summary templates without writing code
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-3.5 h-3.5" />
          <span>New Project Workflow</span>
        </Button>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading configured project workflows...</div>
        ) : projects.length > 0 ? (
          projects.map((proj) => (
            <div key={proj.id} className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">{proj.name}</h2>
                    <span className="text-[11px] text-gray-500 font-mono">
                      Department: {proj.department?.name || "Cardiology / Inpatient"}
                    </span>
                  </div>
                  <Badge status={proj.status} className="ml-2">{proj.status}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[11px] font-mono text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
                    Channel: {proj.dataSource}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                {proj.description || "Inpatient discharge summary processing pipeline with verified clinical precedence."}
              </p>

              {/* Configured Summary Workflows & Templates */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    Associated Workflow Types & Templates
                  </h3>
                  <Link to="/templates" className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    Manage Section Templates <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {proj.projectTypes?.map((pt: any) => (
                    <div key={pt.id} className="p-3 bg-gray-50/70 border border-gray-200/80 rounded-lg text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{pt.name}</span>
                        <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                          Summary Based
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">{pt.description}</p>
                      
                      {/* Attached Summary Template */}
                      {pt.summaryTemplates && pt.summaryTemplates.length > 0 ? (
                        <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1 text-gray-700 font-medium">
                            <FileText className="w-3.5 h-3.5 text-gray-500" />
                            {pt.summaryTemplates[0].name} (v{pt.summaryTemplates[0].version}.0)
                          </span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Active Template
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                          Template uses default discharge sections
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-10 text-center text-xs text-gray-400 bg-white border border-gray-200 rounded-xl">
            No projects configured yet. Click "New Project Workflow" to create one.
          </div>
        )}
      </div>

      {/* Modal: Create Workflow Project with Template */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900">New Discharge Workflow Project</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cardiology Inpatient Summaries"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  className="w-full h-8 px-2.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Workflow Description</label>
                <textarea
                  placeholder="Clinical purpose and scope of this discharge pipeline..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Data Ingestion Option</label>
                <select
                  value={dataSource}
                  onChange={(e) => setDataSource(e.target.value)}
                  className="w-full h-8 px-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="HMS_AND_DOCUMENT">HMS + Document Upload (Unified Model)</option>
                  <option value="HMS">HMS Direct Gateway Only</option>
                  <option value="DOCUMENT">Document Upload (OCR + AI Extraction)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Default Template Name</label>
                <input
                  type="text"
                  placeholder="e.g. Standard Clinical Discharge Note"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full h-8 px-2.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={creating}>
                  Create Project & Template
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
