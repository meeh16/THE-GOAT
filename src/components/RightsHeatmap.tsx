import React, { useState } from "react";
import { Shield, ShieldAlert, ShieldAlert as CompromisedShield, AlertCircle, Sparkles, Scale } from "lucide-react";
import { RightImpact } from "../types";

interface RightsHeatmapProps {
  rights: RightImpact[];
}

export default function RightsHeatmap({ rights }: RightsHeatmapProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!rights || rights.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
        <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-xs">No rights mapping computed yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" id="rights_heatmap_container">
      <div>
        <h4 className="font-display text-sm font-bold text-gray-800 flex items-center gap-1.5">
          <Shield className="w-4.5 h-4.5 text-slate-800" /> Constitutional & Statutory Rights Heatmap
        </h4>
        <p className="text-[11px] text-gray-400 mt-0.5">
          Dynamic map highlighting which citizen rights are secure, threatened, or actively violated under Indian Constitutional and civil jurisprudence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {rights.map((right, idx) => (
          <div
            key={idx}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className={`p-4 border rounded-2xl transition-all duration-300 relative overflow-hidden ${
              right.status === "violated"
                ? "border-red-200 bg-red-50/5 hover:bg-red-50/10 shadow-xs"
                : right.status === "compromised"
                ? "border-amber-200 bg-amber-50/5 hover:bg-amber-50/10 shadow-xs"
                : "border-green-200 bg-green-50/5 hover:bg-green-50/10 shadow-xs"
            }`}
            id={`right_card_${idx}`}
          >
            {/* Background glowing gradient when hovered */}
            {hoveredIdx === idx && (
              <div
                className={`absolute -right-10 -bottom-10 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none transition-all ${
                  right.status === "violated"
                    ? "bg-red-500"
                    : right.status === "compromised"
                    ? "bg-amber-500"
                    : "bg-green-500"
                }`}
              />
            )}

            <div className="flex justify-between items-start mb-2.5">
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="mt-0.5 shrink-0">
                  {right.status === "violated" ? (
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                  ) : right.status === "compromised" ? (
                    <CompromisedShield className="w-5 h-5 text-amber-600" />
                  ) : (
                    <Shield className="w-5 h-5 text-green-600 fill-green-50/30" />
                  )}
                </span>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-gray-900 truncate">{right.rightName}</h5>
                  <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-gray-100 text-gray-500 inline-block mt-1">
                    {right.constitutionalRef}
                  </span>
                </div>
              </div>

              <span
                className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded ${
                  right.status === "violated"
                    ? "bg-red-100 text-red-800"
                    : right.status === "compromised"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {right.status}
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed pt-1 border-t border-gray-100/50">
              {right.description}
            </p>
          </div>
        ))}
      </div>

      {/* Summary Stat */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 border border-gray-100 p-3.5 rounded-xl text-xs">
        <div className="flex items-center gap-1.5 text-gray-500">
          <Scale className="w-4 h-4 text-gray-400" />
          <span>Status Aggregator:</span>
        </div>
        <div className="flex gap-4 font-bold font-mono">
          <span className="text-green-600 flex items-center gap-1">
            🟢 Secure ({rights.filter((r) => r.status === "secure").length})
          </span>
          <span className="text-amber-600 flex items-center gap-1">
            🟡 Compromised ({rights.filter((r) => r.status === "compromised").length})
          </span>
          <span className="text-red-600 flex items-center gap-1">
            🔴 Violated ({rights.filter((r) => r.status === "violated").length})
          </span>
        </div>
      </div>
    </div>
  );
}
