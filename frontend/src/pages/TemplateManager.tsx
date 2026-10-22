import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { Badge, Button } from "../components/UI";
import { FileText, Plus, CheckCircle } from "lucide-react";

export const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get("/summaries/templates");
        setTemplates(res.data.data);
        if (res.data.data.length > 0) setSelectedTemplate(res.data.data[0]);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
        <div>
          <h1 className="text-base font-bold text-black tracking-tight">Discharge Summary Templates</h1>
          <p className="text-xs text-[#666666]">
            Configure section architectures, handlebars variables (&#123;&#123;patient.name&#125;&#125;), and version control
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Template List */}
        <div className="border border-[#E5E5E5] rounded p-3 bg-white space-y-2">
          <h2 className="text-xs font-bold text-black uppercase tracking-wider mb-2">Available Templates</h2>
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => setSelectedTemplate(tpl)}
              className={`p-3 border rounded cursor-pointer transition-colors ${
                selectedTemplate?.id === tpl.id
                  ? "border-black bg-[#F7F7F7]"
                  : "border-[#E5E5E5] hover:bg-[#FAFAFA]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-black">{tpl.name}</span>
                <Badge status={tpl.status}>{tpl.status}</Badge>
              </div>
              <div className="text-[11px] font-mono text-[#666666] mt-1">
                Version {tpl.version}.0 • {tpl.code}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Template Section View */}
        <div className="col-span-2 border border-[#E5E5E5] rounded p-4 bg-white space-y-4">
          {selectedTemplate ? (
            <>
              <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-black">{selectedTemplate.name}</h3>
                  <p className="text-xs text-[#666666]">{selectedTemplate.description}</p>
                </div>
                <div className="text-xs font-mono text-[#555555]">
                  Status: <strong>{selectedTemplate.status}</strong>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                  Configured Sections & Placeholders
                </h4>
                {selectedTemplate.sections?.map((sec: any, idx: number) => (
                  <div key={idx} className="border border-[#E5E5E5] p-3 rounded bg-[#FAFAFA] space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-black">Section {sec.order || idx + 1}: {sec.title}</span>
                    </div>
                    <pre className="text-xs font-mono bg-white p-2 border border-[#E5E5E5] rounded overflow-x-auto text-[#333333]">
                      {sec.content}
                    </pre>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-[#777777]">
              Select a summary template to review its section structure.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
