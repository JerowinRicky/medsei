import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { Button, Badge } from "../components/UI";
import {
  Settings,
  Bot,
  Key,
  Globe,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Eye,
  EyeOff,
  Save,
  Server,
  Sparkles,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Check
} from "lucide-react";

interface AiConfigState {
  provider: string;
  model: string;
  apiKey: string;
  endpoint: string;
  temperature: number;
  maxTokens: number;
  confidenceThreshold: number;
  hasApiKey: boolean;
}

interface TestResult {
  loading: boolean;
  tested: boolean;
  success: boolean;
  message: string;
  latencyMs?: number;
  detectedModels?: string[];
}

const PROVIDER_METADATA: Record<
  string,
  {
    label: string;
    tagline: string;
    defaultModel: string;
    models: string[];
    defaultEndpoint?: string;
    docsUrl: string;
    badge: string;
  }
> = {
  gemini: {
    label: "Google Gemini",
    tagline: "Ultra-fast multimodal clinical document comprehension & high context window",
    defaultModel: "gemini-1.5-flash",
    models: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", "gemini-1.0-pro"],
    docsUrl: "https://aistudio.google.com/app/apikey",
    badge: "Recommended"
  },
  openai: {
    label: "OpenAI / ChatGPT",
    tagline: "Industry standard clinical structuring with GPT-4o & reasoning models",
    defaultModel: "gpt-4o",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo", "o1-mini"],
    docsUrl: "https://platform.openai.com/api-keys",
    badge: "Enterprise"
  },
  claude: {
    label: "Anthropic Claude",
    tagline: "Deep clinical reasoning, nuance detection, and detailed narrative synthesis",
    defaultModel: "claude-3-5-sonnet-20241022",
    models: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
    docsUrl: "https://console.anthropic.com/settings/keys",
    badge: "High Reasoning"
  },
  ollama: {
    label: "Ollama (Self-Hosted / Local)",
    tagline: "100% On-premises zero-data-leakage inference for air-gapped hospital networks",
    defaultModel: "llama3.2",
    models: ["llama3.2", "llama3.1:8b", "mistral:7b", "meditron:7b", "qwen2.5:7b"],
    defaultEndpoint: "http://localhost:11434",
    docsUrl: "https://ollama.ai",
    badge: "Air-Gapped Privacy"
  },
  custom: {
    label: "Custom / OpenAI-Compatible Gateway",
    tagline: "Private hospital vLLM, LiteLLM, Azure OpenAI, or custom internal model cluster",
    defaultModel: "custom-clinical-model",
    models: ["custom-model"],
    defaultEndpoint: "http://localhost:8000/v1",
    docsUrl: "",
    badge: "Custom Cluster"
  }
};

export const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"ai" | "system">("ai");

  // AI Configuration State
  const [aiConfig, setAiConfig] = useState<AiConfigState>({
    provider: "gemini",
    model: "gemini-1.5-flash",
    apiKey: "",
    endpoint: "",
    temperature: 0.2,
    maxTokens: 2048,
    confidenceThreshold: 0.85,
    hasApiKey: false
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [aiLoading, setAiLoading] = useState(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [saveErrorMsg, setSaveErrorMsg] = useState("");

  // Test Connection State
  const [testResult, setTestResult] = useState<TestResult>({
    loading: false,
    tested: false,
    success: false,
    message: ""
  });

  // General System Settings State
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
  const [systemLoading, setSystemLoading] = useState(true);

  // Fetch AI Config on Mount
  useEffect(() => {
    const fetchAiConfig = async () => {
      try {
        setAiLoading(true);
        const res = await api.get("/settings/ai");
        if (res.data?.success && res.data?.data) {
          const d = res.data.data;
          setAiConfig({
            provider: d.provider || "gemini",
            model: d.model || "gemini-1.5-flash",
            apiKey: d.apiKeyMasked || "",
            endpoint: d.endpoint || "",
            temperature: typeof d.temperature === "number" ? d.temperature : 0.2,
            maxTokens: typeof d.maxTokens === "number" ? d.maxTokens : 2048,
            confidenceThreshold: typeof d.confidenceThreshold === "number" ? d.confidenceThreshold : 0.85,
            hasApiKey: !!d.hasApiKey
          });
        }
      } catch (err: any) {
        console.error("Failed to load AI settings:", err);
      } finally {
        setAiLoading(false);
      }
    };

    fetchAiConfig();
  }, []);

  // Fetch General System Settings
  useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        setSystemLoading(true);
        const res = await api.get("/settings");
        if (res.data?.data) {
          setSystemSettings(res.data.data);
        }
      } catch (err: any) {
        console.error("Failed to load system settings:", err);
      } finally {
        setSystemLoading(false);
      }
    };

    fetchSystemSettings();
  }, []);

  const handleProviderChange = (newProvider: string) => {
    const meta = PROVIDER_METADATA[newProvider];
    setAiConfig((prev) => ({
      ...prev,
      provider: newProvider,
      model: meta ? meta.defaultModel : prev.model,
      endpoint: meta?.defaultEndpoint || (newProvider === "gemini" || newProvider === "openai" || newProvider === "claude" ? "" : prev.endpoint)
    }));
    // Reset test result when provider changes
    setTestResult({ loading: false, tested: false, success: false, message: "" });
  };

  const handleTestConnection = async () => {
    setTestResult({
      loading: true,
      tested: false,
      success: false,
      message: ""
    });
    setSaveSuccessMsg("");
    setSaveErrorMsg("");

    try {
      const res = await api.post("/settings/ai/test", {
        provider: aiConfig.provider,
        apiKey: aiConfig.apiKey,
        model: aiConfig.model,
        endpoint: aiConfig.endpoint,
        temperature: aiConfig.temperature,
        maxTokens: aiConfig.maxTokens
      });

      const responseData = res.data?.data;
      if (responseData) {
        setTestResult({
          loading: false,
          tested: true,
          success: responseData.success,
          message: responseData.message || (responseData.success ? "Connection verified successfully!" : "Handshake failed."),
          latencyMs: responseData.latency_ms,
          detectedModels: responseData.detected_models || []
        });
      } else {
        setTestResult({
          loading: false,
          tested: true,
          success: false,
          message: "No response received from Python AI service."
        });
      }
    } catch (err: any) {
      setTestResult({
        loading: false,
        tested: true,
        success: false,
        message: err.response?.data?.error?.message || err.message || "Failed to execute connection test."
      });
    }
  };

  const handleSaveAiConfig = async () => {
    setSaveSuccessMsg("");
    setSaveErrorMsg("");
    try {
      await api.post("/settings/ai", {
        provider: aiConfig.provider,
        model: aiConfig.model,
        apiKey: aiConfig.apiKey,
        endpoint: aiConfig.endpoint,
        temperature: aiConfig.temperature,
        maxTokens: aiConfig.maxTokens,
        confidenceThreshold: aiConfig.confidenceThreshold
      });

      setSaveSuccessMsg(`AI Configuration saved successfully. Active engine: ${PROVIDER_METADATA[aiConfig.provider]?.label || aiConfig.provider}.`);
      if (aiConfig.apiKey && aiConfig.apiKey !== "••••••••••••••••") {
        setAiConfig((prev) => ({ ...prev, hasApiKey: true, apiKey: "••••••••••••••••" }));
      }
      setTimeout(() => setSaveSuccessMsg(""), 5000);
    } catch (err: any) {
      setSaveErrorMsg(err.response?.data?.error?.message || "Failed to save AI configuration.");
    }
  };

  const handleUpdateGeneralSetting = async (category: string, key: string, value: string) => {
    try {
      await api.post("/settings", { category, key, value });
      setSaveSuccessMsg(`Updated system parameter ${key} successfully.`);
      setTimeout(() => setSaveSuccessMsg(""), 3000);
    } catch (err: any) {
      alert("Failed to update setting");
    }
  };

  const currentMeta = PROVIDER_METADATA[aiConfig.provider] || PROVIDER_METADATA.gemini;

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
        <div>
          <h1 className="text-base font-bold text-black tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-800" />
            System & AI Platform Configuration
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Configure generative AI engines, API credentials, Python extraction pipelines, and hospital operational policies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-medium bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
            <Server className="w-3.5 h-3.5" />
            Python Service: Port 8000 (Active)
          </span>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-[#E5E5E5] gap-2">
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "ai"
              ? "border-black text-black bg-white shadow-2xs"
              : "border-transparent text-[#666666] hover:text-black hover:border-gray-300"
          }`}
        >
          <Bot className="w-4 h-4 text-gray-700" />
          <span>AI Provider & Extraction Models</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-gray-100 text-gray-700 font-bold border border-gray-200">
            {PROVIDER_METADATA[aiConfig.provider]?.label.split(" ")[0]}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("system")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "system"
              ? "border-black text-black bg-white shadow-2xs"
              : "border-transparent text-[#666666] hover:text-black hover:border-gray-300"
          }`}
        >
          <Sliders className="w-4 h-4 text-gray-700" />
          <span>General Operational Parameters</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-gray-100 text-gray-600 border border-gray-200">
            {systemSettings.length} Settings
          </span>
        </button>
      </div>

      {/* Alerts */}
      {saveSuccessMsg && (
        <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg text-xs text-[#166534] flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg("")} className="text-[#166534] hover:opacity-75 text-xs">
            ✕
          </button>
        </div>
      )}

      {saveErrorMsg && (
        <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#991B1B] flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{saveErrorMsg}</span>
          </div>
          <button onClick={() => setSaveErrorMsg("")} className="text-[#991B1B] hover:opacity-75 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 1: AI Provider & Model Configuration                             */}
      {/* ==================================================================== */}
      {activeTab === "ai" && (
        <div className="space-y-6">
          {/* Architecture Informational Notice */}
          <div className="bg-white border border-[#E5E5E5] rounded-lg p-3.5 flex items-start gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
              <Sparkles className="w-4 h-4 text-gray-900" />
            </div>
            <div className="flex-1 text-xs">
              <div className="font-semibold text-black flex items-center gap-2">
                <span>Decoupled Clinical AI Architecture</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  FastAPI Port 8000
                </span>
              </div>
              <p className="text-[#666666] mt-0.5 leading-relaxed">
                All AI handshakes, entity extraction, confidence calculations, and connection tests execute through the Python AI
                microservice. Credentials are encrypted and never exposed to the client browser.
              </p>
            </div>
          </div>

          {/* Provider Selection Grid */}
          <div className="border border-[#E5E5E5] rounded-lg p-4 bg-white space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2.5">
              <div>
                <h2 className="text-xs font-bold text-black uppercase tracking-wider">
                  1. Select AI Intelligence Provider
                </h2>
                <p className="text-[11px] text-[#666666]">
                  Switch between Google Gemini, OpenAI, Claude, or Local Ollama without modifying backend code
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(PROVIDER_METADATA).map(([key, meta]) => {
                const isSelected = aiConfig.provider === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleProviderChange(key)}
                    className={`text-left p-3 rounded-lg border transition-all relative ${
                      isSelected
                        ? "border-black bg-gray-50/70 ring-1 ring-black shadow-xs"
                        : "border-[#E5E5E5] bg-white hover:border-gray-400 hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-black">{meta.label}</span>
                      <span
                        className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border ${
                          isSelected
                            ? "bg-black text-white border-black"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {meta.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#666666] line-clamp-2 leading-relaxed">
                      {meta.tagline}
                    </p>
                    {isSelected && (
                      <div className="mt-2.5 flex items-center gap-1 text-[11px] font-semibold text-black">
                        <Check className="w-3.5 h-3.5" />
                        <span>Active Provider</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Credentials & Model Parameters */}
          <div className="border border-[#E5E5E5] rounded-lg p-5 bg-white space-y-5 shadow-2xs">
            <div className="border-b border-[#E5E5E5] pb-2.5 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-black uppercase tracking-wider">
                  2. Provider Credentials & Model Configuration
                </h2>
                <p className="text-[11px] text-[#666666]">
                  Configure API keys, model selections, and inference tuning parameters
                </p>
              </div>
              {currentMeta.docsUrl && (
                <a
                  href={currentMeta.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <span>Get {currentMeta.label} API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* API Key */}
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-black flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-gray-600" />
                    <span>API Key / Authorization Secret</span>
                  </label>
                  {aiConfig.hasApiKey && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" />
                      Key is saved & encrypted in database
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={aiConfig.apiKey}
                    onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                    placeholder={
                      aiConfig.provider === "ollama"
                        ? "Not required for local Ollama daemon (Leave empty)"
                        : aiConfig.hasApiKey
                        ? "•••••••••••••••• (Leave unchanged to keep current key, or type new key)"
                        : `Enter your ${currentMeta.label} API key (e.g. AIzaSy... or sk-...)`
                    }
                    className="w-full h-9 px-3 pr-20 border border-[#E5E5E5] rounded-md font-mono text-xs focus:outline-none focus:border-black bg-[#FAFAFA] focus:bg-white transition-colors"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-1 text-gray-500 hover:text-black rounded"
                      title={showApiKey ? "Hide Key" : "Show Key"}
                    >
                      {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-[#777777]">
                  {aiConfig.provider === "ollama"
                    ? "Local Ollama models do not require an API key."
                    : "The API key is securely routed to the Python AI service over internal transport and never written to logs."}
                </p>
              </div>

              {/* Model Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-black flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-gray-600" />
                  <span>Model Selection</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={currentMeta.models.includes(aiConfig.model) ? aiConfig.model : "custom"}
                    onChange={(e) => {
                      if (e.target.value !== "custom") {
                        setAiConfig({ ...aiConfig, model: e.target.value });
                      }
                    }}
                    className="h-9 px-2.5 border border-[#E5E5E5] rounded-md text-xs bg-white font-medium focus:outline-none focus:border-black flex-1"
                  >
                    {currentMeta.models.map((m) => (
                      <option key={m} value={m}>
                        {m} {m === currentMeta.defaultModel ? "(Default)" : ""}
                      </option>
                    ))}
                    <option value="custom">-- Custom Model Name --</option>
                  </select>
                </div>
                {/* Custom Model input if user chooses custom or types directly */}
                <input
                  type="text"
                  value={aiConfig.model}
                  onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value.trim() })}
                  placeholder="Or enter custom model identifier"
                  className="w-full h-8 px-2.5 border border-[#E5E5E5] rounded-md text-xs font-mono bg-[#FAFAFA] focus:bg-white focus:outline-none focus:border-black"
                />
              </div>

              {/* API Endpoint Base URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-black flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-gray-600" />
                  <span>Custom Endpoint / Base URL (Optional)</span>
                </label>
                <input
                  type="text"
                  value={aiConfig.endpoint}
                  onChange={(e) => setAiConfig({ ...aiConfig, endpoint: e.target.value.trim() })}
                  placeholder={
                    aiConfig.provider === "ollama"
                      ? "http://localhost:11434"
                      : "Leave empty for default cloud API endpoint"
                  }
                  className="w-full h-9 px-3 border border-[#E5E5E5] rounded-md text-xs font-mono bg-[#FAFAFA] focus:bg-white focus:outline-none focus:border-black"
                />
                <p className="text-[10px] text-[#777777]">
                  {aiConfig.provider === "ollama"
                    ? "Target URL where Ollama daemon is running (default: http://localhost:11434)"
                    : "Use for Azure OpenAI, custom reverse proxies, or self-hosted vLLM/LiteLLM gateways"}
                </p>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-black flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-gray-600" />
                    <span>Inference Temperature: {aiConfig.temperature.toFixed(2)}</span>
                  </label>
                  <span className="text-[10px] font-mono text-[#666666]">
                    {aiConfig.temperature <= 0.1
                      ? "Exact Deterministic"
                      : aiConfig.temperature <= 0.3
                      ? "Clinical Extraction (Recommended)"
                      : "Creative Synthesis"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={aiConfig.temperature}
                  onChange={(e) => setAiConfig({ ...aiConfig, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-black cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#888888] font-mono">
                  <span>0.0 (Strict Fact)</span>
                  <span>0.2 (Optimal)</span>
                  <span>1.0 (Varied)</span>
                </div>
              </div>

              {/* Confidence Threshold */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-black flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-gray-600" />
                    <span>Minimum Confidence: {Math.round(aiConfig.confidenceThreshold * 100)}%</span>
                  </label>
                  <span className="text-[10px] font-mono text-[#666666]">
                    {aiConfig.confidenceThreshold >= 0.9 ? "Strict Review Trigger" : "Standard Review Trigger"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="0.99"
                  step="0.01"
                  value={aiConfig.confidenceThreshold}
                  onChange={(e) => setAiConfig({ ...aiConfig, confidenceThreshold: parseFloat(e.target.value) })}
                  className="w-full accent-black cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#888888] font-mono">
                  <span>50%</span>
                  <span>85% (Recommended)</span>
                  <span>99%</span>
                </div>
              </div>
            </div>

            {/* Test Connection Result Banner */}
            {testResult.tested && (
              <div
                className={`p-4 rounded-lg border text-xs transition-all ${
                  testResult.success
                    ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]"
                    : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">
                        {testResult.success ? "AI Provider Credentials Verified" : "AI Handshake Failed"}
                      </span>
                      {typeof testResult.latencyMs === "number" && (
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/80 border border-current font-semibold">
                          Latency: {testResult.latencyMs} ms
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed">{testResult.message}</p>

                    {/* Detected models tags if any */}
                    {testResult.detectedModels && testResult.detectedModels.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">
                          Available Models Returned by {currentMeta.label}:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {testResult.detectedModels.map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setAiConfig({ ...aiConfig, model: m })}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors border ${
                                aiConfig.model === m
                                  ? "bg-black text-white border-black font-semibold"
                                  : "bg-white text-gray-800 border-gray-300 hover:border-black"
                              }`}
                              title={`Click to set model to ${m}`}
                            >
                              {m} {aiConfig.model === m ? "✓" : ""}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E5]">
              <div className="text-[11px] text-[#666666]">
                Testing sends a verification request through Python backend to validate credentials before saving.
              </div>
              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleTestConnection}
                  isLoading={testResult.loading}
                  className="gap-2 border-gray-300"
                >
                  <Activity className="w-3.5 h-3.5 text-gray-700" />
                  <span>Check Connection & Credentials</span>
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleSaveAiConfig}
                  className="gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save AI Configuration</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: General System Parameters                                     */}
      {/* ==================================================================== */}
      {activeTab === "system" && (
        <div className="border border-[#E5E5E5] rounded-lg p-5 bg-white space-y-4 shadow-2xs">
          <div className="border-b border-[#E5E5E5] pb-2 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-black uppercase tracking-wider">
                Hospital Operational System Parameters
              </h2>
              <p className="text-[11px] text-[#666666]">
                Global parameters take immediate effect without redeploying the application
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#777777]">
              Total Parameters: {systemSettings.length}
            </span>
          </div>

          <div className="space-y-3">
            {systemSettings.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#777777]">
                No custom parameters loaded. Standard enterprise defaults are active.
              </div>
            ) : (
              systemSettings.map((s) => (
                <div
                  key={`${s.category}-${s.key}`}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center p-3 border border-[#E5E5E5] rounded-md bg-[#FAFAFA] text-xs hover:border-gray-300 transition-colors"
                >
                  <div>
                    <span className="font-semibold text-black block text-xs">{s.key}</span>
                    <span className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">
                      {s.category} PARAMETER
                    </span>
                  </div>
                  <div>
                    <input
                      type="text"
                      defaultValue={s.value}
                      onBlur={(e) => handleUpdateGeneralSetting(s.category, s.key, e.target.value)}
                      className="w-full h-8 px-2.5 border border-[#E5E5E5] rounded bg-white font-mono text-xs focus:outline-none focus:border-black"
                    />
                  </div>
                  <div className="text-[11px] text-[#666666] flex items-center justify-between">
                    <span>Live editable. Saves on blur.</span>
                    {s.isSecret && (
                      <span className="text-[9px] font-mono bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                        Encrypted
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default SystemSettings;
