import React from "react";
import { History, Calendar, Trash2, ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";
import { SavedAnalysis } from "../types";

interface AnalysisHistoryProps {
  analyses: SavedAnalysis[];
  onSelectAnalysis: (analysis: SavedAnalysis) => void;
  onDeleteAnalysis: (id: string) => void;
  selectedId?: string;
}

export default function AnalysisHistory({
  analyses,
  onSelectAnalysis,
  onDeleteAnalysis,
  selectedId,
}: AnalysisHistoryProps) {
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this analysis from your history?")) {
      onDeleteAnalysis(id);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300" id="history_container">
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
        <h4 className="font-display text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <History className="w-4.5 h-4.5 text-slate-800" /> Evaluation Archives
        </h4>
        <span className="text-xs font-mono bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full font-bold">
          {analyses.length}
        </span>
      </div>

      {analyses.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No saved analyses found.</p>
          <p className="text-[11px] mt-1">Submit your legal scenario on the dashboard to start saving history.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
          {analyses.map((analysis) => {
            const isSelected = selectedId === analysis.id;
            const res = analysis.result;

            return (
              <div
                key={analysis.id}
                onClick={() => onSelectAnalysis(analysis)}
                className={`p-3.5 border rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? "border-slate-800 bg-slate-100/50 shadow-xs"
                    : "border-slate-100 hover:border-slate-200"
                }`}
                id={`history_item_${analysis.id}`}
              >
                <div className="flex justify-between items-start mb-1 gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {analysis.scenario.slice(0, 50)}...
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {res.domain}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(analysis.id, e)}
                    className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-2.5 text-[10px]">
                  {res.verdict === "compliant" ? (
                    <span className="text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Compliant ({res.score}%)
                    </span>
                  ) : res.verdict === "needs_review" ? (
                    <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Review ({res.score}%)
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Violation ({res.score}%)
                    </span>
                  )}

                  <span className="text-slate-800 hover:underline flex items-center gap-0.5 font-bold">
                    View <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
