"use client";

import { Badge, Tooltip, Group, Button, Text } from "@mantine/core";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Send,
  Edit,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { GetOpportunityResponse } from "@/src/lib/opportunitiesAPI";

// Display status type for UI
export type DisplayStatus = 
  | "new" 
  | "in_review" 
  | "approved" 
  | "outreach_ready" 
  | "sent" 
  | "snoozed" 
  | "rejected" 
  | "error";

// Action type that can be taken on an opportunity
export type OpportunityAction = 
  | "review" 
  | "approve" 
  | "reject" 
  | "refine" 
  | "draft_outreach" 
  | "send" 
  | "export" 
  | "view_sent" 
  | "resend" 
  | "unsnooze" 
  | "snooze" 
  | "delete";

// Map backend status to display status
export function mapToDisplayStatus(
  backendStatus: string,
  crm_activated_at?: string | null,
  snoozed?: boolean
): DisplayStatus {
  if (snoozed) return "snoozed";
  if (crm_activated_at) return "sent";

  const statusMap: Record<string, DisplayStatus> = {
    draft: "new",
    pending_review: "in_review",
    approved: "approved",
    activation_requested: "outreach_ready",
    activated: "sent",
    rejected: "rejected",
    needs_more_evidence: "in_review",
    activation_failed: "error",
    activation_partial: "error",
  };

  return statusMap[backendStatus] || "new";
}

// Status configuration
interface StatusConfig {
  label: string;
  color: string;
  icon: React.ReactNode;
  description: string;
}

const STATUS_CONFIGS: Record<DisplayStatus, StatusConfig> = {
  new: {
    label: "New",
    color: "blue",
    icon: <AlertCircle size={14} />,
    description: "Ready for review",
  },
  in_review: {
    label: "In Review",
    color: "orange",
    icon: <Eye size={14} />,
    description: "Under evaluation",
  },
  approved: {
    label: "Approved",
    color: "green",
    icon: <CheckCircle size={14} />,
    description: "Ready to outreach",
  },
  outreach_ready: {
    label: "Outreach Ready",
    color: "cyan",
    icon: <Edit size={14} />,
    description: "Draft prepared",
  },
  sent: {
    label: "Sent",
    color: "teal",
    icon: <Send size={14} />,
    description: "Activated in CRM",
  },
  snoozed: {
    label: "Snoozed",
    color: "gray",
    icon: <Clock size={14} />,
    description: "Paused for later",
  },
  rejected: {
    label: "Rejected",
    color: "red",
    icon: <AlertCircle size={14} />,
    description: "Not a fit",
  },
  error: {
    label: "Error",
    color: "red",
    icon: <AlertCircle size={14} />,
    description: "Action failed",
  },
};

// Actions available per status
const STATUS_ACTIONS: Record<DisplayStatus, OpportunityAction[]> = {
  new: ["review", "snooze", "delete"],
  in_review: ["approve", "reject", "refine", "snooze"],
  approved: ["draft_outreach", "snooze", "reject"],
  outreach_ready: ["send", "export", "snooze"],
  sent: ["view_sent", "resend", "snooze"],
  snoozed: ["unsnooze", "delete"],
  rejected: ["delete"],
  error: ["resend", "delete"],
};

// StatusChip component for displaying status
interface StatusChipProps {
  status: DisplayStatus;
  size?: "sm" | "md" | "lg";
}

export function StatusChip({ status, size = "md" }: StatusChipProps) {
  const config = STATUS_CONFIGS[status];

  return (
    <Tooltip label={config.description} withArrow>
      <Badge
        size={size}
        variant="light"
        color={config.color}
        leftSection={config.icon}
        style={{ cursor: "help" }}
        aria-label={`Status: ${config.label}. ${config.description}`}
      >
        {config.label}
      </Badge>
    </Tooltip>
  );
}

// Get available actions for a status
export function getAvailableActions(status: DisplayStatus): OpportunityAction[] {
  return STATUS_ACTIONS[status] || [];
}

// Get button label and color for an action
interface ActionConfig {
  label: string;
  color: string;
  icon: React.ReactNode;
  variant: "filled" | "light" | "subtle";
}

const ACTION_CONFIGS: Record<OpportunityAction, ActionConfig> = {
  review: {
    label: "Review",
    color: "blue",
    icon: <Eye size={16} />,
    variant: "filled",
  },
  approve: {
    label: "Approve",
    color: "green",
    icon: <CheckCircle size={16} />,
    variant: "filled",
  },
  reject: {
    label: "Reject",
    color: "red",
    icon: <AlertCircle size={16} />,
    variant: "light",
  },
  refine: {
    label: "Request Refinement",
    color: "orange",
    icon: <Edit size={16} />,
    variant: "light",
  },
  draft_outreach: {
    label: "Draft Outreach",
    color: "cyan",
    icon: <Edit size={16} />,
    variant: "filled",
  },
  send: {
    label: "Send",
    color: "teal",
    icon: <Send size={16} />,
    variant: "filled",
  },
  export: {
    label: "Export",
    color: "gray",
    icon: <Send size={16} />,
    variant: "light",
  },
  view_sent: {
    label: "View Sent",
    color: "teal",
    icon: <Eye size={16} />,
    variant: "light",
  },
  resend: {
    label: "Resend",
    color: "orange",
    icon: <RotateCcw size={16} />,
    variant: "light",
  },
  unsnooze: {
    label: "Unsnooze",
    color: "blue",
    icon: <Clock size={16} />,
    variant: "filled",
  },
  snooze: {
    label: "Snooze",
    color: "gray",
    icon: <Clock size={16} />,
    variant: "light",
  },
  delete: {
    label: "Delete",
    color: "red",
    icon: <Trash2 size={16} />,
    variant: "subtle",
  },
};

export function getActionConfig(action: OpportunityAction): ActionConfig {
  return ACTION_CONFIGS[action];
}

// Component to render status-aware action buttons
interface StatusActionButtonProps {
  action: OpportunityAction;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: string;
}

export function StatusActionButton({
  action,
  onClick,
  loading = false,
  disabled = false,
  size = "sm",
}: StatusActionButtonProps) {
  const config = getActionConfig(action);

  return (
    <Tooltip label={config.label}>
      <Button
        size={size}
        variant={config.variant}
        color={config.color}
        leftSection={config.icon}
        onClick={onClick}
        loading={loading}
        disabled={disabled}
        aria-label={config.label}
        aria-busy={loading}
      >
        {config.label}
      </Button>
    </Tooltip>
  );
}
