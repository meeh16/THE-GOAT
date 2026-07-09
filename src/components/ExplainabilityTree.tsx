import React, { useState } from "react";
import { CheckCircle2, AlertCircle, HelpCircle, ChevronDown, ChevronRight, Scale, BookOpen } from "lucide-react";
import { LogicNode } from "../types";

interface ExplainabilityTreeProps {
  nodes: LogicNode[];
}

export default function ExplainabilityTree({ nodes }: ExplainabilityTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({
    0: true, // Expand first step by default
  });

  const toggleNode = (idx: number) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  if (!nodes || nodes.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
        <Scale className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-xs">No reasoning tree computed yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" id="explainability_tree_container">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h4 className="font-display text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <Scale className="w-4.5 h-4.5 text-slate-800" /> Explainability Tree (Audit Trail)
          </h4>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Step-by-step evaluation timeline and procedural verification steps computed by Sahur AI.
          </p>
        </div>
      </div>

      <div className="relative pl-4 space-y-5 before:content-[''] before:absolute before:left-6.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-gray-100">
        {nodes.map((node, idx) => {
          const isExpanded = !!expandedNodes[idx];
          const hasDetails = node.description || node.legalBasis;

          return (
            <div key={idx} className="relative group" id={`tree_node_${idx}`}>
              {/* Left timeline status bullet */}
              <span className="absolute -left-1.5 top-0.5 z-10 bg-white p-0.5 rounded-full transition-transform group-hover:scale-110">
                {node.status === "pass" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-50" />
                ) : node.status === "fail" ? (
                  <AlertCircle className="w-5 h-5 text-red-500 fill-red-50" />
                ) : (
                  <HelpCircle className="w-5 h-5 text-amber-500 fill-amber-50" />
                )}
              </span>

              {/* Node container */}
              <div className="pl-6.5">
                <div
                  onClick={() => hasDetails && toggleNode(idx)}
                  className={`p-3.5 border rounded-xl transition-all select-none ${
                    hasDetails ? "cursor-pointer" : ""
                  } ${
                    isExpanded
                      ? "bg-slate-50 border-slate-300 shadow-xs"
                      : "bg-white border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                      Step {idx + 1}: {node.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-sm font-bold ${
                          node.status === "pass"
                            ? "bg-green-100 text-green-700"
                            : node.status === "fail"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {node.status === "pass" ? "Passed" : node.status === "fail" ? "Failed" : "Incomplete"}
                      </span>
                      {hasDetails && (
                        <span>
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail box */}
                  {isExpanded && hasDetails && (
                    <div className="mt-3 text-xs text-gray-600 space-y-2 border-t border-gray-100/50 pt-2.5">
                      <p className="leading-relaxed">{node.description}</p>
                      {node.legalBasis && (
                        <div className="flex items-center gap-1.5 text-[10.5px] bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-100 font-mono">
                          <BookOpen className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                          <span>
                            <strong>Grounding Source:</strong> {node.legalBasis}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
