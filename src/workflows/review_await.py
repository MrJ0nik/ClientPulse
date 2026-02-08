"""Workflow for awaiting Account Manager review decisions"""
from temporalio import workflow
from datetime import timedelta
from typing import Dict, Any, Optional

with workflow.unsafe.imports_passed_through():
    from ..activities.opportunity_activities import update_signal_status_activity


@workflow.defn
class ReviewAwaitWorkflow:
    """
    Workflow that waits for Account Manager decision on opportunity.
    Supports: approve, reject, refine actions.
    """
    
    def __init__(self) -> None:
        self.decision = None  # Dict like {"action": "approved", "reason": "..."}
    
    @workflow.signal
    async def decision_signal(self, decision: Dict[str, Any]):
        """Receive decision from Account Manager"""
        self.decision = decision
    
    @workflow.run
    async def run(
        self,
        tenant_id: str,
        account_id: str,
        opportunity_id: str,
        signal_id: str,
        timeout_seconds: int = 86400  # 24 hours default
    ) -> Dict[str, Any]:
        """
        Wait for AM decision on opportunity
        
        Args:
            tenant_id: Tenant identifier
            account_id: Account identifier
            opportunity_id: Opportunity being reviewed
            signal_id: Source signal
            timeout_seconds: How long to wait before timeout (default 24 hours)
        """
        try:
            workflow_run_id = workflow.info().workflow_id
            
            # Wait for decision signal (with timeout)
            await workflow.wait_condition(
                lambda: self.decision is not None,
                timeout=timedelta(seconds=timeout_seconds)
            )
            
            if self.decision is None:
                # Timeout occurred
                return {
                    "status": "TIMEOUT",
                    "opportunity_id": opportunity_id,
                    "signal_id": signal_id,
                    "workflow_run_id": workflow_run_id,
                }
            
            decision_action = self.decision.get("action", "unknown").lower()
            decision_reason = self.decision.get("reason", "")
            user_id = self.decision.get("user_id", "unknown")
            
            # Update opportunity status based on decision
            if decision_action == "approve":
                new_status = "approved"
            elif decision_action == "reject":
                new_status = "rejected"
            elif decision_action == "refine":
                new_status = "draft"  # Back to draft for refinement (lowercase)
            else:
                new_status = "pending_review"
            
            # Log the decision
            await workflow.execute_activity(
                update_signal_status_activity,
                tenant_id,
                account_id,
                signal_id,
                f"review_complete_{decision_action}",
                workflow_run_id,
                start_to_close_timeout=timedelta(seconds=30),
            )
            
            return {
                "status": "COMPLETED",
                "opportunity_id": opportunity_id,
                "signal_id": signal_id,
                "decision_action": decision_action,
                "decision_reason": decision_reason,
                "reviewed_by": user_id,
                "new_status": new_status,
                "workflow_run_id": workflow_run_id,
            }
        
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Review await workflow failed: {e}", exc_info=True)
            return {
                "status": "FAILED",
                "error": str(e),
                "opportunity_id": opportunity_id,
                "workflow_run_id": workflow.info().workflow_id,
            }
