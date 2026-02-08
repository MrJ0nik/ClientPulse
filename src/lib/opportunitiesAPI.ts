import api from "./axios";

export interface ScoreBreakdown {
  impact: number;
  urgency: number;
  fit: number;
  access: number;
  feasibility: number;
  confidence?: number;
  feedback_factor?: number;
}

export interface EvidenceRef {
  id?: string;
  signal_id?: string;
  chunk_id?: string; // Deprecated: kept for backwards compatibility
  title?: string;
  domain?: string;
  url?: string;
  source_type?: string; // article, pdf, site, news, research, filing, etc.
  snippet?: string;
  excerpt?: string;
  relevance_score?: number;
}

export interface GetOpportunityResponse {
  id: string;
  account_id: string;
  signal_id: string;
  status: string;
  review_workflow_id?: string;
  score: number;
  score_breakdown: ScoreBreakdown;
  theme: string;
  pains: string[];
  offers: string[];
  next_steps: string[];
  what_happened: string;
  why_it_matters: string;
  suggested_offer: string;
  proof: string;
  evidence_refs: EvidenceRef[];
  asset_refs: any[];
  stakeholder_hints: string[];
  draft_outreach?: any;
  summary?: string;
  crm_activated_at?: string;
  crm_status?: string;
}

export interface ListOpportunitiesResponse {
  opportunities: GetOpportunityResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApproveOpportunityResponse {
  status: string;
  opportunity_id: string;
  workflow_id: string;
  message: string;
}

export interface RejectOpportunityRequest {
  reason: string;
  comment?: string;
}

export interface RejectOpportunityResponse {
  status: string;
  opportunity_id: string;
  workflow_id: string;
  message: string;
}

export interface RefineOpportunityRequest {
  feedback: string;
  refinements?: Record<string, any>;
}

export interface RefineOpportunityResponse {
  status: string;
  opportunity_id: string;
  workflow_id: string;
  message: string;
}

export interface NeedsMoreEvidenceRequest {
  question: string;
  context?: string;
}

export interface NeedsMoreEvidenceResponse {
  status: string;
  opportunity_id: string;
  new_evidence: EvidenceRef[];
  message: string;
}

export const opportunitiesAPI = {
  async list(limit: number = 10, offset: number = 0): Promise<ListOpportunitiesResponse> {
    const response = await api.get("/api/v1/opportunities", {
      params: { limit, offset },
    });
    return response.data;
  },

  async get(opportunityId: string): Promise<GetOpportunityResponse> {
    const response = await api.get(`/api/v1/opportunities/${opportunityId}`);
    return response.data;
  },

  async approve(opportunityId: string, comment?: string): Promise<ApproveOpportunityResponse> {
    const response = await api.post(
      `/api/v1/opportunities/${opportunityId}/approve`,
      { comment }
    );
    return response.data;
  },

  async reject(opportunityId: string, request: RejectOpportunityRequest): Promise<RejectOpportunityResponse> {
    const response = await api.post(
      `/api/v1/opportunities/${opportunityId}/reject`,
      request
    );
    return response.data;
  },

  async refine(
    opportunityId: string,
    request: RefineOpportunityRequest
  ): Promise<RefineOpportunityResponse> {
    const response = await api.post(
      `/api/v1/opportunities/${opportunityId}/refine`,
      request
    );
    return response.data;
  },

  async needsMoreEvidence(
    opportunityId: string,
    request: NeedsMoreEvidenceRequest
  ): Promise<NeedsMoreEvidenceResponse> {
    const response = await api.post(
      `/api/v1/opportunities/${opportunityId}/needs-more-evidence`,
      request
    );
    return response.data;
  },

  async history(opportunityId: string) {
    const response = await api.get(
      `/api/v1/opportunities/${opportunityId}/history`
    );
    return response.data;
  },
};
