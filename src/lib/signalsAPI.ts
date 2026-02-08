import api from "./axios";

export interface CreateSignalRequest {
  account_id: string;
  title: string;
  source_url: string;
  source_type?: string;
  description?: string;
}

export interface CreateSignalResponse {
  signal_id: string;
  workflow_id: string;
  status: string;
  message: string;
}

export interface Signal {
  id: string;
  account_id: string;
  title: string;
  source_url: string;
  source_type: string;
  description: string;
  created_at: string;
  status?: string;
}

export interface SignalsListResponse {
  signals: Signal[];
  total: number;
  limit: number;
  offset: number;
}

export const signalsAPI = {
  async create(request: CreateSignalRequest): Promise<CreateSignalResponse> {
    const response = await api.post("/api/v1/signals", request);
    return response.data;
  },

  async list(limit: number = 10, offset: number = 0): Promise<SignalsListResponse> {
    const response = await api.get("/api/v1/signals", {
      params: { limit, offset },
    });
    return response.data;
  },
};
