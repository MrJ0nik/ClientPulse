// types/workspace.types.ts

export interface WorkspaceData {
  companyName: string;
  companyUrl: string;
}

export interface WorkspaceResponse {
  success: boolean;
  workspaceId?: string;
  error?: string;
}

export interface ValidationErrors {
  name?: string;
  url?: string;
  general?: string;
}

export interface CreateWorkspaceModalProps {
  onClose?: () => void;
}

export type WorkspaceStep = 1 | 2;

export interface WorkspaceSetupState {
  step: WorkspaceStep;
  companyName: string;
  companyUrl: string;
  errors: ValidationErrors;
  isProcessing: boolean;
  aiProgress: number;
  aiStatus: string;
}
