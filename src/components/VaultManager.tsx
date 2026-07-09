import React, { useState, useRef } from "react";
import { FolderGit, Upload, FileText, AlertTriangle, ShieldCheck, Trash2, Eye, X, FilePlus } from "lucide-react";
import { VaultDocument } from "../types";

// Standard legal templates for easy testing
const PRESET_TEMPLATES = [
  {
    name: "Standard Residential Lease (10m Deposit).txt",
    type: "Rental Agreement",
    size: 2840,
    content: `RESIDENTIAL LEASE AGREEMENT
This agreement is entered into between Landlord Rajesh Sharma and Tenant Amit Kumar.
TERMS AND CONDITIONS:
1. RENTAL VALUE: The tenant agrees to pay a monthly rent of INR 20,000.
2. SECURITY DEPOSIT: The tenant shall pay a non-refundable security deposit of INR 2,00,000 (Ten Months Rent) prior to occupying the flat.
3. EVICTION CLAUSE: The Landlord reserves the absolute right to evict the tenant at 24 hours notice without providing any specific written grounds or justification if there is any disagreement.
4. SUBLETTING: The tenant is strictly prohibited from subletting any portion of the premises without written consent.`
  },
  {
    name: "Corporate Executive Employment Contract.txt",
    type: "Workplace Agreement",
    size: 3420,
    content: `EMPLOYMENT CONTRACT
This contract of employment is made between TechNexus Ltd and Employee Priya Patel.
TERMS AND CONDITIONS:
1. WORKING HOURS: Employee shall work 9 AM to 8 PM Monday through Saturday. Overtime pay is not applicable as this is a salaried executive role.
2. JOB TERMINATION: The company reserves the right to terminate this contract immediately at any time with zero days of notice and without paying any retrenchment compensation or salary in lieu of notice.
3. MATERNITY PROTECTION: In the event of pregnancy, the employee's maternity leaves are capped at 4 weeks, and the company reserves the right to terminate employment if service continuity is compromised.`
  },
  {
    name: "Defective Electronics Store Bill.txt",
    type: "Consumer Agreement",
    size: 1530,
    content: `ELECTRONICS PURCHASE INVOICE - GALAXY ELECTRONICS
Purchased: Smart LED TV (Model GL-992) for INR 45,000.
WARRANTY & REFUND CONDITIONS:
1. NO REFUNDS: Under no circumstances will refunds or cash returns be processed. All sales are final.
2. DEFECT CLAUSE: If the product is found to be defective or dead on arrival (DOA), the customer must deal with the global manufacturer directly. Galaxy Electronics bears no liability for defective units.
3. REDRESSAL BLOCK: The customer agrees not to initiate any consumer commission or arbitration filing regarding product quality.`
  }
];

interface VaultManagerProps {
  documents: VaultDocument[];
  onUploadSuccess: (doc: VaultDocument) => void;
  onDeleteSuccess: (id: string) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export default function VaultManager({
  documents,
  onUploadSuccess,
  onDeleteSuccess,
  isLoading,
  setIsLoading,
}: VaultManagerProps) {
  const [selectedDoc, setSelectedDoc] = useState<VaultDocument | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [customText, setCustomText] = useState("");
  const [customName, setCustomName] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadAPI = async (name: string, type: string, content: string, size: number) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/vault/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, content, size }),
      });
      const data = await response.json();
      if (response.ok) {
        onUploadSuccess(data);
        setCustomText("");
        setCustomName("");
        setShowManualInput(false);
      } else {
        alert(data.error || "Failed to analyze document.");
      }
    } catch (e) {
      console.error(e);
      alert("Error uploading document to server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetSelect = (preset: typeof PRESET_TEMPLATES[0]) => {
    handleUploadAPI(preset.name, preset.type, preset.content, preset.size);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customText) return;
    handleUploadAPI(
      customName.endsWith(".txt") ? customName : `${customName}.txt`,
      "Custom Agreement",
      customText,
      customText.length
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleUploadAPI(file.name, file.type || "Text Document", text || "", file.size);
    };
    reader.readAsText(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleUploadAPI(file.name, file.type || "Uploaded File", text || "", file.size);
    };
    reader.readAsText(file);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document from your vault?")) return;
    try {
      const res = await fetch(`/api/vault/${id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleteSuccess(id);
        if (selectedDoc?.id === id) {
          setSelectedDoc(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6" id="vault_container">
      {/* Vault Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="font-display text-lg font-bold text-slate-800 mb-2">Upload Document to Vault</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Upload tenancy agreements, employment contracts, notices, or bills. Sahur AI will scan for non-compliant clauses under Indian law.
            </p>

            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragging ? "border-indigo-500 bg-indigo-50/50" : "border-gray-200 hover:border-gray-300"
              }`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: "pointer" }}
              id="drop_zone"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt,.md,.json,.csv,.doc,.docx"
                className="hidden"
              />
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">Drag and drop file here, or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">Supports text files, contracts, and letters (.txt, .md, .docx)</p>
            </div>

            <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
              <span>🔒 Encrypted local sandbox storage</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowManualInput(!showManualInput);
                }}
                className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                id="btn_manual_input"
              >
                <FilePlus className="w-3.5 h-3.5" /> Or copy-paste contract text
              </button>
            </div>

            {/* Manual text paste input */}
            {showManualInput && (
              <form onSubmit={handleManualSubmit} className="mt-4 border-t border-gray-100 pt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Document Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MyRentalAgreement"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Agreement Text Clauses</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Paste the lease terms or clauses here..."
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowManualInput(false)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                  >
                    Extract Clauses
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Preset templates panel */}
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <h4 className="font-display text-sm font-black text-slate-800 mb-1 flex items-center gap-1.5">
              <FolderGit className="w-4 h-4 text-slate-600" /> Presets for Evaluation
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Click a template to auto-load an agreement loaded with illegal/unfair terms and watch the parser flag them.
            </p>

            <div className="space-y-2.5">
              {PRESET_TEMPLATES.map((preset, idx) => (
                <button
                  key={idx}
                  disabled={isLoading}
                  onClick={() => handlePresetSelect(preset)}
                  className="w-full text-left p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-xs transition-all disabled:opacity-50"
                  id={`preset_${idx}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-slate-800 truncate">{preset.name}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {preset.type.split(" ")[0]}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 font-mono">
                    {preset.content}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vault List and Clause Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vault List */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-[2rem] p-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300">
          <h4 className="font-display text-sm font-bold text-slate-800 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <span>My Secure Legal Vault</span>
            <span className="text-xs font-mono bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-bold">
              {documents.length}
            </span>
          </h4>

          {documents.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Your legal vault is empty.</p>
              <p className="text-[11px] mt-1">Upload files or select a preset to begin.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {documents.map((doc) => {
                const issues = doc.extractedData?.clauses.filter((c) => c.legalStanding !== "lawful").length || 0;
                const rating = doc.extractedData?.overallVerdict;

                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`p-3.5 border rounded-xl cursor-pointer transition-all ${
                      selectedDoc?.id === doc.id
                        ? "border-indigo-600 bg-indigo-50/20"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                    id={`vault_doc_${doc.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{doc.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                            {doc.type} • {(doc.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(doc.id, e)}
                        className="text-gray-400 hover:text-red-500 p-0.5 rounded-md hover:bg-gray-50 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3 text-[10px]">
                      {rating === "good_to_go" ? (
                        <span className="text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Fully Lawful
                        </span>
                      ) : rating === "review_needed" ? (
                        <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Review Advised ({issues})
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Non-Compliant ({issues})
                        </span>
                      )}
                      <span className="text-gray-400 font-mono">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Clause Viewer */}
        <div className="lg:col-span-2">
          {selectedDoc ? (
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm space-y-6" id="clause_viewer_panel">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-gray-900">{selectedDoc.name}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                      {selectedDoc.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono mt-1">
                    Uploaded: {new Date(selectedDoc.uploadedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Overall rating banner */}
              <div
                className={`p-4 rounded-xl flex items-start gap-3 ${
                  selectedDoc.extractedData?.overallVerdict === "good_to_go"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : selectedDoc.extractedData?.overallVerdict === "review_needed"
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                <div className="p-1 bg-white rounded-lg shadow-xs mt-0.5">
                  {selectedDoc.extractedData?.overallVerdict === "good_to_go" ? (
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold">
                    {selectedDoc.extractedData?.overallVerdict === "good_to_go"
                      ? "Statutory Compliance: Compliant"
                      : selectedDoc.extractedData?.overallVerdict === "review_needed"
                      ? "Statutory Compliance: Suspicious / Unfair Clauses Detected"
                      : "Statutory Compliance: Illegal / Violating Terms Present"}
                  </h4>
                  <p className="text-xs opacity-90 mt-1">
                    {selectedDoc.extractedData?.overallVerdict === "good_to_go"
                      ? "This contract conforms to typical statutory limits under relevant Indian codes. No illegal provisions were discovered."
                      : selectedDoc.extractedData?.overallVerdict === "review_needed"
                      ? "This agreement contains unbalanced, high-risk clauses that may favor the counterparty unreasonably. Check details below."
                      : "Critical Alert: One or more clauses directly violate mandatory statutory limits of Indian statutes (e.g. Tenancy security deposit laws, unfair termination limits)."}
                  </p>
                </div>
              </div>

              {/* Extracted Clauses Detail */}
              <div className="space-y-4">
                <h4 className="font-display text-sm font-bold text-gray-800">Scanned Agreement Clauses ({selectedDoc.extractedData?.clauses.length || 0})</h4>
                <div className="space-y-3">
                  {selectedDoc.extractedData?.clauses.map((clause, idx) => (
                    <div
                      key={idx}
                      className={`p-4 border rounded-xl space-y-2.5 transition-all ${
                        clause.legalStanding === "unlawful"
                          ? "border-red-200 bg-red-50/10"
                          : clause.legalStanding === "suspicious"
                          ? "border-amber-200 bg-amber-50/10"
                          : "border-gray-100 bg-gray-50/10"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              clause.legalStanding === "unlawful"
                                ? "bg-red-500"
                                : clause.legalStanding === "suspicious"
                                ? "bg-amber-500"
                                : "bg-green-500"
                            }`}
                          />
                          {clause.topic}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-sm ${
                            clause.legalStanding === "unlawful"
                              ? "bg-red-100 text-red-700"
                              : clause.legalStanding === "suspicious"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {clause.legalStanding}
                        </span>
                      </div>

                      <div className="p-3 bg-white/70 border border-gray-100 rounded-lg text-xs font-mono text-gray-600 line-clamp-3">
                        "{clause.text}"
                      </div>

                      <div className="text-xs text-gray-600">
                        <strong className="text-gray-900 font-medium">Compliance Review:</strong> {clause.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doc Excerpt */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-display text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Original Document Text</h4>
                <div className="p-4 bg-gray-50 rounded-xl text-xs font-mono text-gray-500 max-h-[150px] overflow-y-auto whitespace-pre-wrap">
                  {selectedDoc.content}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-400 h-full flex flex-col justify-center items-center">
              <Eye className="w-10 h-10 mb-2 opacity-50 text-gray-400" />
              <h4 className="font-display text-sm font-semibold text-gray-700">Contract Intelligence Viewer</h4>
              <p className="text-xs mt-1 max-w-sm mx-auto">
                Select any agreement from your secure vault list to view parsed statutory violations, clause risks, and safety scores.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
