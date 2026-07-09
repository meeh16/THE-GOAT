export interface Clause {
  topic: string;
  text: string;
  legalStanding: "lawful" | "unlawful" | "suspicious";
  explanation: string;
}

export interface ExtractedData {
  documentName: string;
  documentType: string;
  overallVerdict: "good_to_go" | "review_needed" | "critical_issues";
  clauses: Clause[];
}

export interface VaultDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  content: string;
  extractedData?: ExtractedData;
}

export interface RightImpact {
  rightName: string;
  status: "secure" | "compromised" | "violated";
  description: string;
  constitutionalRef: string;
}

export interface LogicNode {
  label: string;
  status: "pass" | "info" | "fail";
  description: string;
  legalBasis: string;
}

export interface ApplicableLaw {
  statute: string;
  section: string;
  text: string;
  explanation: string;
}

export interface AuthorityRecommendation {
  name: string;
  description: string;
  stepByStepGrievance: string[];
}

export interface AnalysisResult {
  domain: "tenancy" | "workplace" | "policing" | "consumer";
  confidence: number;
  missing_info: string[];
  verdict: "compliant" | "needs_review" | "violation";
  score: number;
  summary: string;
  rights_heatmap: RightImpact[];
  explainability_tree: LogicNode[];
  applicable_laws: ApplicableLaw[];
  evidence_checklist: string[];
  authority_recommendation: AuthorityRecommendation;
}

export interface SavedAnalysis {
  id: string;
  createdAt: string;
  scenario: string;
  vaultDocIds: string[];
  clarifyingAnswers: { question: string; answer: string }[];
  result: AnalysisResult;
}

export interface SimulatorResult {
  initialVerdict: string;
  simulatedVerdict: string;
  initialScore: number;
  simulatedScore: number;
  shiftExplanation: string;
  rightsImpactDifference: string;
  recommendationShift: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
