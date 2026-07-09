import React, { useState, useEffect } from "react";
import {
  Scale,
  Shield,
  FileText,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  RefreshCw,
  FolderLock,
  Printer,
  ChevronRight,
  HelpCircle,
  FileSpreadsheet,
  X,
  Download
} from "lucide-react";
import { VaultDocument, SavedAnalysis, AnalysisResult } from "./types";
import VaultManager from "./components/VaultManager";
import ExplainabilityTree from "./components/ExplainabilityTree";
import RightsHeatmap from "./components/RightsHeatmap";
import WhatIfSimulator from "./components/WhatIfSimulator";
import InteractiveChat from "./components/InteractiveChat";
import AnalysisHistory from "./components/AnalysisHistory";

// Predefined sandbox scenarios for easy one-click testing
const PRELOADED_SCENARIOS = [
  {
    title: "Illegal Rent Eviction (Tenancy)",
    domain: "tenancy",
    text: "My residential landlord locked me out of my apartment in Bangalore with only 1 day of verbal notice, claiming he needs the flat for his relatives. I paid rent on time every month, and he refused to return my security deposit of 10 months rent, claiming there are damages which I did not make."
  },
  {
    title: "Sudden Job Retrenchment (Workplace)",
    domain: "workplace",
    text: "My company laid me off immediately on a Friday afternoon with zero notice and no severance pay. I have worked there as a continuous software developer for over 18 months. They claimed the company is downsizing, but they refuse to pay my pending salary or any retrenchment compensation."
  },
  {
    title: "Unlawful Custody & Night Arrest (Policing)",
    domain: "policing",
    text: "At 10:30 PM, two male police officers came to my house, accused me of a minor non-cognizable offense, and forced me to come to the police station. No female officer was present, they did not show me any warrant or prior notice, and they are refusing to let me contact my family or a lawyer."
  },
  {
    title: "Defective Electronics Refund Denial (Consumer)",
    domain: "consumer",
    text: "I bought a Smart TV for INR 45,000 from Galaxy Electronics. It arrived completely broken and dead on arrival. When I asked for a refund or replacement, the merchant refused, pointing to their store receipt which states 'Strictly No Refunds under any circumstances' and told me to contact the factory in China directly."
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"evaluate" | "vault" | "chat">("evaluate");
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [currentScenario, setCurrentScenario] = useState("");
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<SavedAnalysis | null>(null);
  
  // Custom API key states
  const [apiKeyInput, setApiKeyInput] = useState(localStorage.getItem("gemini_api_key") || "");
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isApiKeySaved, setIsApiKeySaved] = useState(!!localStorage.getItem("gemini_api_key"));

  // Tab within the analysis results card
  const [reportTab, setReportTab] = useState<"laws" | "heatmap" | "tree" | "simulator">("laws");
  
  // Interactive Clarifying Questions state
  const [clarifyingAnswers, setClarifyingAnswers] = useState<Record<string, string>>({});
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [citizenName, setCitizenName] = useState("Authenticated Citizen");

  const downloadPlainTextReport = () => {
    if (!activeAnalysis) return;
    const res = activeAnalysis.result;
    const dateStr = new Date(activeAnalysis.createdAt).toLocaleString();
    const content = `================================================================================
SAHUR CITIZEN COMPLIANCE PASSPORT
Official Grounding: Indian Constitutional & Statutory Jurisprudence
Generated on: ${dateStr}
================================================================================

CITIZEN DETAILS
--------------------------------------------------------------------------------
Claimant Name: ${citizenName}
Passport ID: PASSPORT_${activeAnalysis.id.split("_")[1]}
Evaluation Status: ${res.verdict.toUpperCase()}
Compliance Safety Score: ${res.score}% (RAG Confidence: ${res.confidence}%)
Dispute Domain: ${res.domain.toUpperCase()}

STATEMENT OF CIRCUMSTANCES
--------------------------------------------------------------------------------
"${activeAnalysis.scenario}"

EXECUTIVE LEGAL OPINION
--------------------------------------------------------------------------------
${res.summary}

CITED FUNDAMENTAL RIGHTS & CONSTITUTIONAL SAFEGUARDS
--------------------------------------------------------------------------------
${res.rights_heatmap.map(r => `- ${r.rightName} (${r.constitutionalRef}): [${r.status.toUpperCase()}]
  ${r.description}`).join("\n\n")}

APPLICABLE STATUTORY CITATIONS (GROUNDING SOURCE)
--------------------------------------------------------------------------------
${res.applicable_laws.map(l => `- ${l.statute} — ${l.section}
  Statute Rule: ${l.text}
  Application: ${l.explanation}`).join("\n\n")}

MANDATORY EVIDENCE GATHER CHECKLIST
--------------------------------------------------------------------------------
${res.evidence_checklist.map((e, idx) => `[ ] ${idx + 1}. ${e}`).join("\n")}

RECOMMENDED ESCALATION AUTHORITY & GREIVANCE FORUM
--------------------------------------------------------------------------------
Authority Name: ${res.authority_recommendation.name}
Description: ${res.authority_recommendation.description}

Step-by-Step Filing Procedure:
${res.authority_recommendation.stepByStepGrievance.map((step, idx) => `${idx + 1}. ${step}`).join("\n")}

--------------------------------------------------------------------------------
DISCLAIMER: Sahur AI is a legal knowledge system powered by RAG-retrieval. 
This document does not constitute formal attorney representation or signed court advocacy counsel.
================================================================================`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Sahur_Compliance_Passport_${activeAnalysis.id.split("_")[1]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Load initial data
  useEffect(() => {
    fetchVault();
    fetchAnalyses();
  }, []);

  const getHeaders = (extraHeaders: Record<string, string> = {}) => {
    const headers: Record<string, string> = { ...extraHeaders };
    const customKey = localStorage.getItem("gemini_api_key");
    if (customKey && customKey.trim() !== "") {
      headers["x-gemini-api-key"] = customKey.trim();
    }
    return headers;
  };

  const fetchVault = async () => {
    try {
      const res = await fetch("/api/vault", {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAnalyses = async () => {
    try {
      const res = await fetch("/api/analyses", {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAnalyses(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadSuccess = (doc: VaultDocument) => {
    setDocuments((prev) => [...prev, doc]);
    alert(`Success: "${doc.name}" has been uploaded to your personal vault and scanned for statutory clauses!`);
  };

  const handleDeleteDocSuccess = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setSelectedDocIds((prev) => prev.filter((dId) => dId !== id));
  };

  const handleDeleteAnalysisSuccess = async (id: string) => {
    try {
      const res = await fetch(`/api/analyses/${id}`, {
        method: "DELETE",
        headers: getHeaders({ "Content-Type": "application/json" })
      });
      if (res.ok) {
        setAnalyses((prev) => prev.filter((a) => a.id !== id));
        if (activeAnalysis?.id === id) {
          setActiveAnalysis(null);
        }
      } else {
        alert("Failed to delete analysis from server.");
      }
    } catch (e) {
      console.error(e);
      // Fallback
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      if (activeAnalysis?.id === id) {
        setActiveAnalysis(null);
      }
    }
  };

  const runAnalysis = async (customAnswers?: { question: string; answer: string }[]) => {
    if (!currentScenario.trim()) {
      alert("Please enter a legal scenario description or select one of the templates.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: getHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          scenario: currentScenario,
          vaultDocIds: selectedDocIds,
          clarifyingAnswers: customAnswers || [],
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setActiveAnalysis(data);
        setAnalyses((prev) => [data, ...prev.filter((a) => a.id !== data.id)]);
        // If we received clarifying questions, clear old answer states
        if (data.result.missing_info?.length > 0 && !customAnswers) {
          const initialAnswers: Record<string, string> = {};
          data.result.missing_info.forEach((q: string) => {
            initialAnswers[q] = "";
          });
          setClarifyingAnswers(initialAnswers);
        }
      } else {
        alert(data.error || "Analysis failed.");
      }
    } catch (e) {
      console.error(e);
      alert("Error reaching AI evaluation service.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitClarifications = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedAnswers = Object.entries(clarifyingAnswers).map(([q, a]) => ({
      question: q,
      answer: a as string,
    }));
    runAnalysis(formattedAnswers);
  };

  const handleSelectScenarioPreset = (presetText: string) => {
    setCurrentScenario(presetText);
    // Find matching document type from presets and auto-link if it exists
    const textLower = presetText.toLowerCase();
    let guessedDoc = null;
    if (textLower.includes("landlord")) {
      guessedDoc = documents.find((d) => d.name.includes("Lease") || d.type.includes("Rental"));
    } else if (textLower.includes("laid me off")) {
      guessedDoc = documents.find((d) => d.name.includes("Employment") || d.type.includes("Workplace"));
    } else if (textLower.includes("smart tv")) {
      guessedDoc = documents.find((d) => d.name.includes("Electronics") || d.type.includes("Consumer"));
    }

    if (guessedDoc) {
      setSelectedDocIds([guessedDoc.id]);
    } else {
      setSelectedDocIds([]);
    }
  };

  const toggleDocSelection = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  // Setup domain color accents
  const getDomainStyles = (domain: string) => {
    switch (domain) {
      case "tenancy":
        return { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-100", label: "Tenancy Rights" };
      case "workplace":
        return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100", label: "Labour Law" };
      case "policing":
        return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100", label: "Constitutional / Policing" };
      case "consumer":
        return { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100", label: "Consumer Rights" };
      default:
        return { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-100", label: "General Law" };
    }
  };

  const reportResult = activeAnalysis?.result;
  const domainStyle = reportResult ? getDomainStyles(reportResult.domain) : null;

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans" id="app_root">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shrink-0 sticky top-0 z-40 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-base font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5">
                Sahur AI
                <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full font-bold">
                  v1.0
                </span>
              </h1>
              <p className="text-[10.5px] text-gray-400 font-medium">Constitutional Rights & Statutory Compliance Analyzer</p>
            </div>
          </div>

          {/* Navigation Tab list */}
          <nav className="flex gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => { setActiveTab("evaluate"); setIsPrintMode(false); }}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "evaluate" ? "bg-white text-slate-900 shadow-xs" : "text-gray-500 hover:text-gray-700"
              }`}
              id="tab_evaluate"
            >
              <Scale className="w-3.5 h-3.5" /> Evaluate Scenario
            </button>
            <button
              onClick={() => { setActiveTab("vault"); setIsPrintMode(false); }}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "vault" ? "bg-white text-slate-900 shadow-xs" : "text-gray-500 hover:text-gray-700"
              }`}
              id="tab_vault"
            >
              <FolderLock className="w-3.5 h-3.5" /> Legal Vault
            </button>
            <button
              onClick={() => { setActiveTab("chat"); setIsPrintMode(false); }}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "chat" ? "bg-white text-slate-900 shadow-xs" : "text-gray-500 hover:text-gray-700"
              }`}
              id="tab_chat"
            >
              <MessageSquare className="w-3.5 h-3.5" /> AI Companion
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setShowApiKeyModal(true)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                isApiKeySaved 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/50" 
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/50"
              }`}
              id="btn_api_key_settings"
            >
              <span className={`w-2 h-2 rounded-full ${isApiKeySaved ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
              <span>{isApiKeySaved ? "Custom API Key Active" : "Using Default Key"}</span>
            </button>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-mono">OWASP GEN-017 MVP</p>
              <p className="text-[11px] text-gray-600 font-medium font-mono">Team Velocity Sandbox</p>
            </div>
          </div>
        </div>
      </header>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs" id="api_key_modal_backdrop">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-8 max-w-md w-full space-y-6" id="api_key_modal_container">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-800">Gemini API Configuration</h3>
                <p className="text-xs text-slate-400 mt-1">Configure your own developer key stored securely in your browser's Local Storage.</p>
              </div>
              <button 
                onClick={() => setShowApiKeyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Your Gemini API Key</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:border-slate-500 focus:ring-slate-500 focus:outline-none font-mono text-slate-800"
                  id="api_key_input_field"
                />
              </div>

              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 space-y-1.5">
                <p className="font-semibold">⚠️ Rate-Limit Mitigation & Privacy Notice</p>
                <p className="leading-relaxed font-medium">Your API key is stored <strong>only</strong> in your local browser and is processed as a proxy header to provide dedicated quota, avoiding public demo limits.</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  localStorage.removeItem("gemini_api_key");
                  setApiKeyInput("");
                  setIsApiKeySaved(false);
                  setShowApiKeyModal(false);
                  alert("Custom key cleared! Using system defaults.");
                  window.location.reload();
                }}
                disabled={!isApiKeySaved}
                className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                id="btn_clear_api_key"
              >
                Clear Custom Key
              </button>
              
              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (apiKeyInput.trim() === "") {
                      alert("Please provide a valid key or click Cancel.");
                      return;
                    }
                    localStorage.setItem("gemini_api_key", apiKeyInput.trim());
                    setIsApiKeySaved(true);
                    setShowApiKeyModal(false);
                    alert("Custom Gemini API Key saved successfully! The app will now run on your dedicated quota.");
                    window.location.reload();
                  }}
                  className="bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                  id="btn_save_api_key"
                >
                  Save API Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 min-h-0 print:p-0 print:bg-white">
        
        {/* Printable Passport View Overrides */}
        {isPrintMode && reportResult && (
          <div className="bg-security-grid p-10 max-w-3xl mx-auto border-5 double border-slate-900 rounded-none shadow-none space-y-8 relative" id="print_passport_template">
            {/* Header with emblem look */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-700 font-extrabold block">
                  STATUTORY COMPLIANCE RECORD • REPUBLIC OF INDIA
                </span>
                <h1 className="font-display text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                  <Scale className="w-6 h-6 text-slate-900" /> SAHUR CITIZEN COMPLIANCE PASSPORT
                </h1>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  DOCUMENT NO: SAHUR-PASSPORT-{activeAnalysis?.id?.split("_")[1]} • REGISTERED ON {new Date(activeAnalysis?.createdAt || "").toLocaleString()}
                </p>
              </div>

              <div className="text-right flex flex-col items-end gap-1.5 shrink-0 print:hidden">
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                  </button>
                  <button
                    onClick={downloadPlainTextReport}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download TXT
                  </button>
                </div>
                <button
                  onClick={() => setIsPrintMode(false)}
                  className="text-xs text-slate-500 hover:underline font-bold mt-1.5 cursor-pointer"
                >
                  ← Exit Print Preview
                </button>
              </div>
            </div>

            {/* Upper Section: Citizen Details & Barcode */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2 space-y-2 text-xs border-r border-slate-200 pr-6">
                <h4 className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-widest">Citizen Declaration & Attestation</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Claimant Name:</span>
                    <strong className="font-bold text-slate-800 text-sm font-display">{citizenName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Evaluation Timestamp:</span>
                    <span className="font-mono text-slate-800 text-[11px] font-medium">{new Date(activeAnalysis?.createdAt || "").toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Statutory Domain:</span>
                    <span className="font-bold text-slate-800 uppercase text-[11px]">{reportResult.domain}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Record Integrity Hash:</span>
                    <span className="font-mono text-slate-400 text-[9px] truncate block">SHA256-{activeAnalysis?.id?.split("_")[1]}</span>
                  </div>
                </div>
              </div>

              {/* Barcode and Security Seal */}
              <div className="md:col-span-1 flex flex-col items-center justify-center space-y-3.5">
                {/* Verification Barcode */}
                <div className="flex flex-col items-center space-y-1 bg-white p-2.5 border border-slate-200/80 rounded-lg">
                  <div className="flex items-end h-8 space-x-[2px]">
                    {[1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 1, 4, 2, 1, 3].map((w, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900"
                        style={{ width: `${w}px`, height: "100%" }}
                      />
                    ))}
                  </div>
                  <span className="text-[8px] font-mono tracking-widest text-slate-500">
                    *SAHUR-{activeAnalysis?.id?.split("_")[1]}*
                  </span>
                </div>
              </div>
            </div>

            {/* Print Core details summary */}
            <div className="grid grid-cols-3 gap-6 bg-white border border-slate-200 p-5 text-xs">
              <div>
                <span className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Evaluated Category</span>
                <span className="font-bold text-slate-800 uppercase">{domainStyle?.label || reportResult.domain}</span>
              </div>
              <div>
                <span className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Compliance Safety Index</span>
                <span className={`font-mono font-bold ${
                  reportResult.score >= 80 ? "text-green-600" : reportResult.score >= 50 ? "text-amber-600" : "text-red-600"
                }`}>
                  {reportResult.score}% Safety Level
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Statutory Verdict</span>
                <span className={`font-black uppercase tracking-wide px-2 py-0.5 border ${
                  reportResult.verdict === "compliant"
                    ? "border-green-300 text-green-700 bg-green-50"
                    : reportResult.verdict === "needs_review"
                    ? "border-amber-300 text-amber-700 bg-amber-50"
                    : "border-red-300 text-red-700 bg-red-50"
                }`}>
                  {reportResult.verdict}
                </span>
              </div>
            </div>

            {/* Case Scenario */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                Citizen Statement of Circumstances
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed italic bg-white p-4 border border-slate-100 rounded-xl">
                "{activeAnalysis?.scenario}"
              </p>
            </div>

            {/* Case Summary */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                Summary Executive Legal Opinion
              </h3>
              <p className="text-xs text-slate-800 leading-relaxed bg-white p-4 border border-slate-100 rounded-xl">
                {reportResult.summary}
              </p>
            </div>

            {/* Constitutional mapping */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                Cited Fundamental Rights (Heatmap Status)
              </h3>
              <div className="space-y-2">
                {reportResult.rights_heatmap.map((r, i) => (
                  <div key={i} className="text-xs flex justify-between items-start border-b border-slate-100 pb-2 bg-white/50 p-2 rounded">
                    <div className="pr-4">
                      <strong className="text-slate-800 font-bold">{r.rightName}</strong>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">({r.constitutionalRef})</span>
                      <p className="text-slate-500 mt-1">{r.description}</p>
                    </div>
                    <span className={`font-mono text-[10px] uppercase font-bold shrink-0 ${
                      r.status === "violated" ? "text-red-600 font-bold" : r.status === "compromised" ? "text-amber-600 font-bold" : "text-green-600 font-bold"
                    }`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Applicable Statutes */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                Retrieved Statutory Citations (Grounding)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportResult.applicable_laws.map((l, i) => (
                  <div key={i} className="text-xs p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                    <div className="font-bold text-slate-800">
                      {l.statute} — {l.section}
                    </div>
                    <p className="text-slate-500 mt-1 text-[10px] leading-relaxed">
                      <strong>Statute Rule:</strong> {l.text}
                    </p>
                    <p className="text-slate-700 mt-1 leading-relaxed">
                      <strong>Application:</strong> {l.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence & Authority & Seal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200">
              <div className="space-y-2 md:col-span-1">
                <h4 className="text-xs font-bold uppercase text-slate-900">Mandatory Evidence Checklist</h4>
                <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                  {reportResult.evidence_checklist.map((e, idx) => (
                    <li key={idx} className="leading-relaxed">{e}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2 md:col-span-1">
                <h4 className="text-xs font-bold uppercase text-slate-900">Recommended Escalation Authority</h4>
                <div className="text-xs text-slate-800 bg-white p-3 border border-slate-100 rounded-xl">
                  <strong className="block font-bold text-slate-900">{reportResult.authority_recommendation.name}</strong>
                  <p className="text-slate-500 mt-0.5 text-[11px] leading-relaxed">{reportResult.authority_recommendation.description}</p>
                </div>
              </div>
              
              {/* Attestation Stamp */}
              <div className="md:col-span-1 flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="security-seal">
                  <Shield className="w-8 h-8 text-emerald-600 fill-emerald-50/20" />
                </div>
                <div className="text-center">
                  <span className="block text-[8px] font-mono uppercase tracking-widest text-slate-400 font-bold">Sahur Automated Attestation</span>
                  <div className="border-t border-slate-200 mt-3 pt-1 w-28 mx-auto">
                    <span className="font-mono text-[9px] text-slate-500 block italic">Sahur AI Legal Agent</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Disclaimer */}
            <div className="border-t border-slate-200 pt-5 text-[9px] text-slate-400 text-center leading-relaxed">
              <strong>DISCLAIMER & RECORD ATTESTATION:</strong> Sahur AI is an automated legal knowledge retrieval system grounded strictly in Indian Constitutional and statutory jurisprudence. All evaluations are educational, and do not constitute formal attorney representation or signed court advocacy counsel.
            </div>
          </div>
        )}

        {/* Tab content router */}
        {!isPrintMode && (
          <div className="space-y-6">
            
            {/* Tab 1: Evaluate Scenario */}
            {activeTab === "evaluate" && (
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                
                {/* Left Form Panel */}
                <div className="xl:col-span-3 space-y-6">
                  
                  {/* Scenario Input Card */}
                  <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all duration-300 space-y-6">
                    <div>
                      <h3 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Scale className="w-5 h-5 text-slate-800" /> Ground a New Case Study
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Describe a dispute in plain language, attach relevant contract documents from your Legal Vault, and let the reasoning agent compile an explainable statutory audit.
                      </p>
                    </div>

                    {/* Preloaded Scenario presets */}
                    <div className="space-y-3">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                        One-Click Sandbox Test Scenarios
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {PRELOADED_SCENARIOS.map((preset, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectScenarioPreset(preset.text)}
                            className="bg-slate-50 border border-slate-200 hover:border-slate-500 hover:bg-slate-100/50 text-xs font-semibold text-slate-700 px-4 py-2.5 rounded-full transition-all cursor-pointer shadow-2xs"
                            id={`scenario_preset_${idx}`}
                          >
                            {preset.title}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Form input */}
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                          Claimant Name (Printed on Passport)
                        </label>
                        <input
                          type="text"
                          value={citizenName}
                          onChange={(e) => setCitizenName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full max-w-md px-5 py-3 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-slate-500 font-sans bg-slate-50/30 text-slate-800"
                          id="citizen_name_input"
                        />
                      </div>

                      <div className="space-y-1.5 relative">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                          Statement of Facts & Circumstances
                        </label>
                        <textarea
                          rows={5}
                          required
                          value={currentScenario}
                          onChange={(e) => setCurrentScenario(e.target.value)}
                          placeholder="Describe the legal situation here... Be detailed! Mention written contracts, notice timelines, amounts of deposit, genders involved, times of arrest, and other specific details to ensure high-confidence reasoning."
                          className="w-full px-5 py-4 border border-slate-200 rounded-2xl text-xs focus:outline-hidden focus:ring-2 focus:ring-slate-500 font-sans bg-slate-50/30 text-slate-800"
                          id="scenario_input"
                        />
                        <span className="absolute bottom-3 right-4 text-[10px] text-slate-400 font-mono">
                          {currentScenario.length} characters
                        </span>
                      </div>

                      {/* Attach documents selector */}
                      {documents.length > 0 && (
                        <div className="bg-slate-100/60 border border-slate-200/80 p-5 rounded-2xl space-y-3">
                          <span className="block text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                            <FileSpreadsheet className="w-4 h-4 text-slate-400" /> Context Linking: Attach Contract documents from Vault
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {documents.map((doc) => {
                              const selected = selectedDocIds.includes(doc.id);
                              return (
                                <button
                                  key={doc.id}
                                  onClick={() => toggleDocSelection(doc.id)}
                                  className={`p-3 border rounded-xl text-left transition-all cursor-pointer ${
                                    selected
                                      ? "border-slate-900 bg-slate-100 text-slate-900 shadow-2xs font-bold"
                                      : "bg-white border-slate-200 hover:border-slate-400 text-slate-600"
                                  }`}
                                  id={`attach_doc_${doc.id}`}
                                >
                                  <p className="text-xs font-bold truncate">{doc.name}</p>
                                  <p className="text-[10px] opacity-75 truncate mt-0.5 font-mono">{doc.type}</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          🔒 Secure Local Sandbox Processing
                        </span>
                        <button
                          onClick={() => runAnalysis()}
                          disabled={isLoading || !currentScenario.trim()}
                          className="bg-slate-950 hover:bg-slate-800 text-white disabled:bg-slate-100 disabled:text-slate-400 px-8 py-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                          id="btn_run_analysis"
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Retrieving Statutes & Evaluating...
                            </>
                          ) : (
                            <>
                              <Scale className="w-3.5 h-3.5" /> Compile Legal Compliance Passport
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Clarifying Interactive Questions (Visible if AI needs more info) */}
                  {reportResult && reportResult.missing_info?.length > 0 && (
                    <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 space-y-4" id="clarifying_questions_panel">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700 shrink-0 mt-0.5">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-display text-sm font-bold text-amber-900">
                            Interactive Fact-Refining Dialog (Confidence: {reportResult.confidence}%)
                          </h4>
                          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                            Sahur AI has processed your case, but is currently missing critical facts required to emit a 100% secure statutory verdict. Please provide answers to refine the compliance audit:
                          </p>
                        </div>
                      </div>

                      <form onSubmit={submitClarifications} className="space-y-3.5">
                        {reportResult.missing_info.map((q, idx) => (
                          <div key={idx} className="space-y-1.5">
                            <label className="block text-xs font-bold text-gray-700">
                              {idx + 1}. {q}
                            </label>
                            <input
                              type="text"
                              required
                              value={clarifyingAnswers[q] || ""}
                              onChange={(e) =>
                                setClarifyingAnswers((prev) => ({
                                  ...prev,
                                  [q]: e.target.value,
                                }))
                              }
                              placeholder="Type your response..."
                              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                              id={`clarify_input_${idx}`}
                            />
                          </div>
                        ))}

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-amber-600 hover:bg-amber-700 text-white disabled:bg-amber-100 disabled:text-amber-300 px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            {isLoading ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" /> Re-Evaluating...
                              </>
                            ) : (
                              "Submit Clarifications"
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Active Analysis Detailed Compliance Report Dashboard */}
                  {reportResult && (
                    <div className="space-y-6" id="report_display_board">
                      
                      {/* Top Highlight Verdict Card */}
                      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-8 relative overflow-hidden transition-all duration-300 hover:shadow-md">
                        
                        {/* Domain top absolute marker */}
                        <div className={`absolute left-0 top-0 bottom-0 w-2.5 ${
                          reportResult.verdict === "compliant"
                            ? "bg-green-500"
                            : reportResult.verdict === "needs_review"
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`} />

                        {/* Col 1: Verdict Gauge */}
                        <div className="lg:col-span-1 border-r border-slate-100 pr-0 lg:pr-8 flex flex-col justify-between space-y-6">
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-widest block">
                              Active Statutory Audit Verdict
                            </span>
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-3.5 h-3.5 rounded-full ${
                                  reportResult.verdict === "compliant"
                                    ? "bg-green-500 animate-pulse"
                                    : reportResult.verdict === "needs_review"
                                    ? "bg-amber-500 animate-pulse"
                                    : "bg-red-500 animate-pulse"
                                }`}
                              />
                              <h3 className="font-display text-2xl font-black uppercase text-slate-900 tracking-wide">
                                {reportResult.verdict}
                              </h3>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-500">Compliance Safety Index</span>
                              <span className="font-mono font-black text-slate-900 text-sm">{reportResult.score}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  reportResult.score >= 80
                                    ? "bg-green-500"
                                    : reportResult.score >= 50
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${reportResult.score}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-100 pt-4">
                            <span className="font-mono font-medium">Category: {domainStyle?.label}</span>
                            <span className="font-mono font-medium">RAG Confidence: {reportResult.confidence}%</span>
                          </div>
                        </div>

                        {/* Col 2: Summary text */}
                        <div className="lg:col-span-2 flex flex-col justify-between space-y-6">
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-widest block">
                              Executive Legal Opinion (Explainable Synthesis)
                            </span>
                            <p className="text-xs text-slate-600 leading-relaxed font-sans">
                              {reportResult.summary}
                            </p>
                          </div>

                          <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button
                              onClick={() => setIsPrintMode(true)}
                              className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center gap-2 shadow-xs cursor-pointer transition-all hover:scale-[1.02]"
                              id="btn_export_passport"
                            >
                              <Printer className="w-4 h-4" /> Export Compliance Passport
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Main Interactive Subparts */}
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        
                        {/* Left checklists */}
                        <div className="lg:col-span-2 space-y-6">
                          
                          {/* Evidence Checklist */}
                          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 space-y-6 shadow-sm hover:shadow-md transition-all duration-300">
                            <h4 className="font-display text-base font-bold text-slate-800">
                              Mandatory Evidence to Gather
                            </h4>
                            <div className="space-y-3.5">
                              {reportResult.evidence_checklist.map((evidence, idx) => (
                                <div key={idx} className="flex items-start gap-3 text-xs text-slate-600">
                                  <input
                                    type="checkbox"
                                    className="mt-1 w-4.5 h-4.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                                  />
                                  <span className="leading-relaxed">{evidence}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Escalation Authority */}
                          <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl space-y-6 relative overflow-hidden">
                            {/* Accent blur sphere inside */}
                            <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-slate-500/10 rounded-full blur-3xl pointer-events-none" />

                            <h4 className="font-display text-base font-bold text-white relative z-10 flex items-center gap-2">
                              <Scale className="w-5 h-5 text-slate-400" /> Escalation Authority
                            </h4>

                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1 relative z-10">
                              <span className="text-[9px] uppercase font-mono font-bold text-slate-300 tracking-widest">Grievance Forum</span>
                              <strong className="block text-sm text-white font-bold">
                                {reportResult.authority_recommendation.name}
                              </strong>
                              <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                                {reportResult.authority_recommendation.description}
                              </p>
                            </div>

                            <div className="space-y-4 relative z-10">
                              <span className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono">
                                Step-by-Step Filing Procedure
                              </span>
                              <div className="relative pl-3 space-y-4 before:content-[''] before:absolute before:left-1 before:top-1.5 before:bottom-1.5 before:w-[1px] before:bg-white/15">
                                {reportResult.authority_recommendation.stepByStepGrievance.map((step, idx) => (
                                  <div key={idx} className="relative text-xs text-slate-300">
                                    <span className="absolute -left-3.5 top-0.5 w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-500 text-slate-300 flex items-center justify-center text-[7px] font-bold">
                                      {idx + 1}
                                    </span>
                                    <p className="pl-3.5 leading-relaxed">{step}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Tabbed Reports Panel */}
                        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col space-y-6">
                          
                          {/* Inner tab lists */}
                          <div className="flex border-b border-slate-100 overflow-x-auto pb-2 shrink-0 gap-1.5 text-xs">
                            <button
                              onClick={() => setReportTab("laws")}
                              className={`px-4 py-2.5 font-bold rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                                reportTab === "laws" ? "bg-slate-100 text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-700"
                              }`}
                              id="inner_tab_laws"
                            >
                              Statutory Citations
                            </button>
                            <button
                              onClick={() => setReportTab("heatmap")}
                              className={`px-4 py-2.5 font-bold rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                                reportTab === "heatmap" ? "bg-slate-100 text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-700"
                              }`}
                              id="inner_tab_heatmap"
                            >
                              Rights Heatmap
                            </button>
                            <button
                              onClick={() => setReportTab("tree")}
                              className={`px-4 py-2.5 font-bold rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                                reportTab === "tree" ? "bg-slate-100 text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-700"
                              }`}
                              id="inner_tab_tree"
                            >
                              Audit Timeline
                            </button>
                            <button
                              onClick={() => setReportTab("simulator")}
                              className={`px-4 py-2.5 font-bold rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                                reportTab === "simulator" ? "bg-slate-100 text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-700"
                              }`}
                              id="inner_tab_simulator"
                            >
                              What-If Simulator
                            </button>
                          </div>

                          {/* Inner tab contents */}
                          <div className="flex-1 min-h-0">
                            {reportTab === "laws" && (
                              <div className="space-y-5" id="statutes_panel">
                                <div>
                                  <h4 className="font-display text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                    <BookOpen className="w-4.5 h-4.5 text-slate-800" /> Applicable Statutes Citation
                                  </h4>
                                  <p className="text-[11px] text-slate-400 mt-1">
                                    Official legal acts, codices, and precedents matching the fact parameters of this scenario.
                                  </p>
                                </div>

                                <div className="space-y-4">
                                  {reportResult.applicable_laws.map((law, idx) => (
                                    <div key={idx} className="p-5 border border-slate-100 rounded-2xl space-y-3 bg-slate-50/50">
                                      <div className="flex justify-between items-start gap-4">
                                        <div className="font-bold text-xs text-slate-900 leading-tight">
                                          {law.statute} • {law.section}
                                        </div>
                                        <span className="text-[9px] font-mono bg-slate-100 border border-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                                          Grounding Source
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-500 font-mono leading-relaxed bg-white p-3.5 border border-slate-100 rounded-xl">
                                        "{law.text}"
                                      </p>
                                      <p className="text-xs text-slate-700 leading-relaxed">
                                        <strong>Specific Application:</strong> {law.explanation}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {reportTab === "heatmap" && (
                              <RightsHeatmap rights={reportResult.rights_heatmap} />
                            )}

                            {reportTab === "tree" && (
                              <ExplainabilityTree nodes={reportResult.explainability_tree} />
                            )}

                            {reportTab === "simulator" && (
                              <WhatIfSimulator
                                originalScenario={currentScenario}
                                originalVerdict={reportResult.verdict}
                                originalScore={reportResult.score}
                                domain={reportResult.domain}
                                vaultDocIds={selectedDocIds}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Sidebar Saved Analyses History */}
                <div className="xl:col-span-1 space-y-6">
                  <AnalysisHistory
                    analyses={analyses}
                    onSelectAnalysis={(a) => {
                      setActiveAnalysis(a);
                      setCurrentScenario(a.scenario);
                      setSelectedDocIds(a.vaultDocIds);
                    }}
                    onDeleteAnalysis={handleDeleteAnalysisSuccess}
                    selectedId={activeAnalysis?.id}
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Legal Vault Manager */}
            {activeTab === "vault" && (
              <VaultManager
                documents={documents}
                onUploadSuccess={handleUploadSuccess}
                onDeleteSuccess={handleDeleteDocSuccess}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}

            {/* Tab 3: Chat Companion */}
            {activeTab === "chat" && (
              <div className="max-w-4xl mx-auto">
                <InteractiveChat
                  documents={documents}
                  currentScenario={currentScenario}
                  vaultDocIds={selectedDocIds}
                  setVaultDocIds={setSelectedDocIds}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
