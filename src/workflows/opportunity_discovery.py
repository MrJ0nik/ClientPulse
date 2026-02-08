"""Workflow for discovering opportunities from signals"""
from temporalio import workflow
from datetime import timedelta, datetime
from typing import Dict, Any

with workflow.unsafe.imports_passed_through():
    from ..activities.opportunity_activities import (
        retrieve_assets_activity,
        generate_card_activity,
        create_opportunity_activity,
        update_signal_status_activity,
        generate_outreach_variants_activity,
    )
    from ..db.read_models import get_signal, get_account_view
    import logging


logger = logging.getLogger(__name__)


@workflow.defn
class OpportunityDiscoveryWorkflow:
    """Workflow for discovering and scoring opportunities"""
    
    @workflow.run
    async def run(
        self,
        tenant_id: str,
        account_id: str,
        signal_id: str
    ) -> Dict[str, Any]:
        """
        Discover opportunity from signal using LLM
        
        Args:
            tenant_id: Tenant identifier
            account_id: Account identifier
            signal_id: Signal to analyze
        """
        try:
            workflow_run_id = workflow.info().workflow_id
            
            # Get signal details
            signal = get_signal(tenant_id, account_id, signal_id)
            if not signal:
                return {
                    "status": "FAILED",
                    "error": "Signal not found",
                    "workflow_run_id": workflow_run_id,
                }
            
            # Get account details
            account = get_account_view(tenant_id, account_id)
            if not account:
                return {
                    "status": "FAILED",
                    "error": "Account not found",
                    "workflow_run_id": workflow_run_id,
                }
            
            signal_title = signal.get("summary", "New Signal")
            signal_summary = signal.get("content", "")
            signal_source_type = signal.get("source_type", "news")
            account_name = account.get("name", "Unknown")
            
            # Step 1: Retrieve relevant assets
            themes = signal.get("themes", [])
            if not themes:
                themes = ["market", "growth", "technology", "competitive"]
            
            assets_result = await workflow.execute_activity(
                retrieve_assets_activity,
                tenant_id,
                account_id,
                signal_id,
                themes,
                10,
                workflow_run_id,
                start_to_close_timeout=timedelta(seconds=60),
            )
            
            assets = assets_result.get("assets", []) if assets_result.get("success") else []
            
            # Step 2: Generate opportunity card using LLM
            card_result = await workflow.execute_activity(
                generate_card_activity,
                tenant_id,
                account_id,
                account_name,
                signal_id,
                signal_title,
                signal_summary,
                assets,
                signal_source_type,
                workflow_run_id,
                start_to_close_timeout=timedelta(seconds=90),
            )
            
            if not card_result.get("success"):
                return {
                    "status": "FAILED",
                    "error": card_result.get("error", "Card generation failed"),
                    "workflow_run_id": workflow_run_id,
                }
            
            card = card_result.get("card", {})
            
            # Step 3: Create opportunity record with LLM-generated card
            opp_result = await workflow.execute_activity(
                create_opportunity_activity,
                tenant_id,
                account_id,
                signal_id,
                card,  # ← Pass the card data
                workflow_run_id,
                start_to_close_timeout=timedelta(seconds=60),
            )
            
            if not opp_result.get("success"):
                return {
                    "status": "FAILED",
                    "error": opp_result.get("error", "Opportunity creation failed"),
                    "workflow_run_id": workflow_run_id,
                }
            
            opportunity_id = opp_result.get("opportunity_id", "")
            
            # Step 4: Generate outreach variants
            stakeholder_hints = card.get("stakeholder_hints", [])
            variants_result = await workflow.execute_activity(
                generate_outreach_variants_activity,
                tenant_id,
                account_id,
                opportunity_id,
                signal_title,
                signal_summary,
                account_name,
                stakeholder_hints,
                workflow_run_id,
                start_to_close_timeout=timedelta(seconds=60),
            )
            
            variants = variants_result.get("variants", []) if variants_result.get("success") else []
            if variants:
                card["draft_outreach"] = {
                    "variants": variants,
                    "generated_at": datetime.utcnow().isoformat(),
                }
            
            # Step 5: Update signal status
            await workflow.execute_activity(
                update_signal_status_activity,
                tenant_id,
                account_id,
                signal_id,
                "processed",
                workflow_run_id,
                start_to_close_timeout=timedelta(seconds=30),
            )
            
            return {
                "status": "COMPLETED",
                "signal_id": signal_id,
                "opportunity_id": opportunity_id,
                "card": card,
                "workflow_run_id": workflow_run_id,
            }
            
        except Exception as e:
            logger.error(f"Opportunity discovery failed: {e}", exc_info=True)
            return {
                "status": "FAILED",
                "error": str(e),
                "workflow_run_id": workflow.info().workflow_id,
            }
