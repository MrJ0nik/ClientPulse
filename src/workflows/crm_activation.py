"""Workflow for activating opportunities in CRM systems"""
from temporalio import workflow
from datetime import timedelta
from typing import Dict, Any
import asyncio

with workflow.unsafe.imports_passed_through():
    from ..activities.crm_activities import (
        create_salesforce_task_activity,
        create_hubspot_task_activity,
        update_opportunity_status_activity,
    )
    from ..activities.opportunity_activities import notify_user_activity
    from ..db.read_models import get_opportunity
    import logging


logger = logging.getLogger(__name__)


@workflow.defn
class CRMActivationWorkflow:
    """Workflow for activating approved opportunities in CRM systems"""
    
    @workflow.run
    async def run(
        self,
        tenant_id: str,
        account_id: str,
        opportunity_id: str,
        crm_systems: list = None,
        user_id: str = "system"
    ) -> Dict[str, Any]:
        """
        Activate opportunity in CRM systems
        
        Args:
            tenant_id: Tenant identifier
            account_id: Account identifier
            opportunity_id: Opportunity to activate
            crm_systems: List of CRM systems to activate in (default: ["salesforce"])
            user_id: User performing activation
        """
        try:
            if crm_systems is None:
                crm_systems = ["salesforce"]
            
            workflow_run_id = workflow.info().workflow_id
            
            # Get opportunity details
            opportunity = get_opportunity(tenant_id, account_id, opportunity_id)
            if not opportunity:
                return {
                    "status": "FAILED",
                    "error": "Opportunity not found",
                    "workflow_run_id": workflow_run_id,
                }
            
            opp_title = opportunity.get("title", "New Opportunity")
            opp_description = opportunity.get("description", "")
            
            # Update opportunity status to pending activation
            status_result = await workflow.execute_activity(
                update_opportunity_status_activity,
                tenant_id,
                account_id,
                opportunity_id,
                "activation_requested",
                "internal",
                {},  # No extra fields for initial request
                workflow_run_id,
                start_to_close_timeout=timedelta(seconds=30),
            )
            
            if not status_result.get("success"):
                return {
                    "status": "FAILED",
                    "error": "Failed to update opportunity status",
                    "workflow_run_id": workflow_run_id,
                }
            
            # Activate in each CRM system
            activation_results = {}
            
            if "salesforce" in crm_systems:
                sf_result = await workflow.execute_activity(
                    create_salesforce_task_activity,
                    tenant_id,
                    account_id,
                    opportunity_id,
                    opp_title,
                    opp_description,
                    workflow_run_id,
                    start_to_close_timeout=timedelta(seconds=60),
                )
                activation_results["salesforce"] = sf_result
            
            if "hubspot" in crm_systems:
                hs_result = await workflow.execute_activity(
                    create_hubspot_task_activity,
                    tenant_id,
                    account_id,
                    opportunity_id,
                    opp_title,
                    opp_description,
                    workflow_run_id,
                    start_to_close_timeout=timedelta(seconds=60),
                )
                activation_results["hubspot"] = hs_result
            
            # Determine final status based on activation results
            all_success = all(r.get("success", False) for r in activation_results.values())
            
            final_status = "activated" if all_success else "activation_partial"
            final_crm_status = "activated" if all_success else "activation_partial"
            
            # Build CRM fields to update
            from datetime import datetime
            crm_fields = {
                "crm_status": final_crm_status,
                "crm_activated_at": datetime.utcnow().isoformat(),
            }
            
            # Store CRM record IDs from successful activations
            crm_records = {}
            for system, result in activation_results.items():
                if result.get("success"):
                    crm_records[system] = {
                        "record_id": result.get("task_id") or result.get("record_id"),
                        "activated_at": datetime.utcnow().isoformat(),
                    }
            
            if crm_records:
                crm_fields["crm_records"] = crm_records
            
            # Update final status with CRM fields
            final_status_result = await workflow.execute_activity(
                update_opportunity_status_activity,
                tenant_id,
                account_id,
                opportunity_id,
                final_status,
                "internal",
                crm_fields,  # ← Pass CRM fields
                workflow_run_id,
                start_to_close_timeout=timedelta(seconds=30),
            )
            
            # Notify user
            await workflow.execute_activity(
                notify_user_activity,
                user_id,
                "Opportunity Activated",
                f"Opportunity {opportunity_id} has been activated in {', '.join(crm_systems)}",
                "success" if all_success else "warning",
                {"opportunity_id": opportunity_id},
                workflow_run_id,
                start_to_close_timeout=timedelta(seconds=30),
            )
            
            return {
                "status": "COMPLETED",
                "opportunity_id": opportunity_id,
                "final_status": final_status,
                "activation_results": activation_results,
                "workflow_run_id": workflow_run_id,
            }
            
        except Exception as e:
            logger.error(f"CRM activation failed: {e}", exc_info=True)
            return {
                "status": "FAILED",
                "error": str(e),
                "workflow_run_id": workflow.info().workflow_id,
            }
