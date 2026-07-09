import React, { useState } from "react";
import { Terminal, RefreshCw, ArrowRight, ShieldCheck, AlertTriangle, Play, HelpCircle } from "lucide-react";
import { SimulatorResult } from "../types";

// Helpful quick-simulation prompt suggestions based on domain
const SUGGESTIONS: Record<string, string[]> = {
  tenancy: [
    "What if the landlord provided 15 days written notice before eviction?",
    "What if the security deposit in the agreement was only 2 months rent?",
    "What if there was no written agreement, but rent is paid monthly via bank transfer?"
  ],
  workplace: [
    "What if the company paid 1 month average salary in lieu of retrenchment notice?",
    "What if the employment duration was less than 3 months instead of 1 year?",
    "What if my contract had a standard 30-day notice clause for termination?"
  ],
  policing: [
    "What if the police officer issued a formal Notice of Appearance under Section 35(3) first?",
    "What if a female arrest was done at 2 PM by a female constable?",
    "What if the arrest was witnessed by my neighbor and a formal arrest memo was signed?"
  ],
  consumer: [
    "What if the store invoice explicitly stated a 1-year product replacement warranty?",
    "What if I refused the product on delivery instead of opening and finding the defect later?",
    "What if the merchant agreed to inspect and issue store credit?"
  ]
};

interface WhatIfSimulatorProps {
  originalScenario: string;
  originalVerdict: string;
  originalScore: number;
  domain: string;
  vaultDocIds: string[];
}

export default function WhatIfSimulator({
  originalScenario,
  originalVerdict,
  originalScore,
  domain,
  vaultDocIds,
}: WhatIfSimulatorProps) {
  const [alteredFacts, setAlteredFacts] = useState("");
  const [result, setResult] = useState<SimulatorResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runSimulation = async (factsText: string) => {
    if (!factsText || factsText.trim().length < 5) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: originalScenario,
          alteredFacts: factsText,
          vaultDocIds,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        alert(data.error || "Failed to run simulation.");
      }
    } catch (e) {
      console.error(e);
      alert("Error contacting legal simulation engine.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = (preset: string) => {
    setAlteredFacts(preset);
    runSimulation(preset);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSimulation(alteredFacts);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm space-y-6" id="simulator_container">
      <div>
        <h4 className="font-display text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <Terminal className="w-4.5 h-4.5 text-indigo-600" /> "What If?" Legal Simulator Cockpit
        </h4>
        <p className="text-[11px] text-gray-400 mt-0.5">
          Tweak factual parameters (e.g. notice period length, presence of memos, written terms) and re-simulate outcomes instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulator controls */}
        <div className="lg:col-span-1 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Hypothetical Facts or Action Shifts
              </label>
              <textarea
                rows={4}
                value={alteredFacts}
                onChange={(e) => setAlteredFacts(e.target.value)}
                placeholder="Describe altered details (e.g., 'What if the landlord had given me a 1-month written notice prior to eviction?')"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !alteredFacts}
              className="w-full bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-gray-400 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Simulating Shifts...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Run Legal Simulation
                </>
              )}
            </button>
          </form>

          {/* Preset Suggestions based on active domain */}
          {SUGGESTIONS[domain] && (
            <div className="border-t border-gray-100 pt-4">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Suggested Scenario Alterations
              </span>
              <div className="space-y-1.5">
                {SUGGESTIONS[domain].map((suggest, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetClick(suggest)}
                    className="w-full text-left p-2.5 bg-gray-50 border border-gray-100 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/10 text-[11px] text-gray-600 font-medium transition-all"
                  >
                    "{suggest}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Simulator Results */}
        <div className="lg:col-span-2">
          {result ? (
            <div className="border border-indigo-100 bg-indigo-50/5 rounded-2xl p-5 space-y-5" id="simulator_result_panel">
              <div className="flex justify-between items-center border-b border-indigo-100 pb-3">
                <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                  Simulation Outcome Analysis
                </span>
                <span className="text-[10px] font-mono bg-white border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded font-bold">
                  Active Sandbox Mode
                </span>
              </div>

              {/* Side-by-side shift indicator */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-white border border-gray-100 rounded-xl space-y-1">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase block">Before Shift</span>
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        originalVerdict === "compliant"
                          ? "bg-green-500"
                          : originalVerdict === "needs_review"
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="text-xs uppercase font-bold text-gray-800">{originalVerdict}</span>
                  </div>
                  <div className="text-lg font-display font-bold text-gray-700 mt-2 font-mono">{originalScore}%</div>
                  <span className="text-[10px] text-gray-400">Compliance Score</span>
                </div>

                <div className="p-4 bg-white border border-indigo-100 rounded-xl space-y-1 relative">
                  <div className="absolute top-1 right-2">
                    <ArrowRight className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-400 uppercase block">Simulated Outcome</span>
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        result.simulatedVerdict === "compliant"
                          ? "bg-green-500"
                          : result.simulatedVerdict === "needs_review"
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="text-xs uppercase font-bold text-gray-800">{result.simulatedVerdict}</span>
                  </div>
                  <div className="text-lg font-display font-bold text-indigo-600 mt-2 font-mono">
                    {result.simulatedScore}%
                  </div>
                  <span className="text-[10px] text-indigo-400">Compliance Score</span>
                </div>
              </div>

              {/* Score Shift explanation */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Statutory Shift Mechanics
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed font-sans">{result.shiftExplanation}</p>
                </div>

                <div className="space-y-1 pt-2 border-t border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Constitutional Safeguards Shift
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed font-sans">{result.rightsImpactDifference}</p>
                </div>

                <div className="space-y-1 pt-2 border-t border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Grievance Authority Recommendation
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed font-sans">{result.recommendationShift}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-400 h-full flex flex-col justify-center items-center">
              <Terminal className="w-10 h-10 mb-2 opacity-50 text-gray-400" />
              <h4 className="font-display text-sm font-semibold text-gray-700">Simulator Display Panel</h4>
              <p className="text-xs mt-1 max-w-sm mx-auto">
                Tweak details or select one of the suggested alterations to observe the dynamic shift in statutory safety ratings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
