"""Workflow for ingesting signals from various sources"""
from temporalio import workflow
from datetime import timedelta
from typing import Dict, Any, Optional

with workflow.unsafe.imports_passed_through():
    from ..activities.opportunity_activities import (
        update_signal_status_activity,
    )
    from ..workflows.opportunity_discovery import OpportunityDiscoveryWorkflow
    from ..db.firestore_client import get_firestore_client


@workflow.defn
class SignalIngestionWorkflow:
    """Workflow for processing signals from various sources"""
    
    @workflow.run
    async def run(
        self,
        tenant_id: str,
        account_id: str,
        signal_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Ingest signal and create initial opportunity
        
        Args:
            tenant_id: Tenant identifier
            account_id: Account identifier
            signal_data: Dictionary with signal details
                - type: Signal source type (NEWS, SEC_FILING_10K, JOB_POSTING, etc.)
                - url: Source URL
                - search_term: Search term used
        """
        try:
            signal_type = signal_data.get("type", "NEWS")
            url = signal_data.get("url", "")
            search_term = signal_data.get("search_term", "")
            signal_title = signal_data.get("title", f"Signal from {signal_type}")
            signal_description = signal_data.get("description", "")
            signal_id = signal_data.get("signal_id")
            
            # Store signal in tenant-scoped Firestore path
            from datetime import datetime
            db = get_firestore_client()
            signals_path = f"tenants/{tenant_id}/accounts/{account_id}/signals"

            if not signal_id:
                signal_id = f"sig-{workflow.uuid4()[:12]}"
                signal_doc = {
                    "id": signal_id,
                    "tenant_id": tenant_id,
                    "account_id": account_id,
                    "title": signal_title,
                    "source_url": url,
                    "source_type": signal_type,
                    "description": signal_description,
                    "summary": signal_title,
                    "content": signal_description or f"Source: {url}\nSearch term: {search_term}",
                    "workflow_status": "processing",
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat(),
                }
                db.set_document(signals_path, signal_id, signal_doc, merge=True)
            else:
                db.set_document(
                    signals_path,
                    signal_id,
                    {
                        "workflow_status": "processing",
                        "updated_at": datetime.utcnow().isoformat(),
                    },
                    merge=True,
                )
            
            # Update signal status
            await workflow.execute_activity(
                update_signal_status_activity,
                tenant_id,
                account_id,
                signal_id,
                "ingested",
                workflow.info().workflow_id,
                start_to_close_timeout=timedelta(seconds=30),
            )

            # Start opportunity discovery as a child workflow
            discovery_id = f"discovery-{tenant_id}-{account_id}-{workflow.uuid4()[:8]}"
            discovery_result = await workflow.execute_child_workflow(
                OpportunityDiscoveryWorkflow.run,
                tenant_id,
                account_id,
                signal_id,
                id=discovery_id,
                task_queue=workflow.info().task_queue,
            )
            
            return {
                "status": "COMPLETED",
                "signal_id": signal_id,
                "signal_type": signal_type,
                "discovery": discovery_result,
                "workflow_run_id": workflow.info().workflow_id,
            }
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Signal ingestion failed: {e}")
            return {
                "status": "FAILED",
                "error": str(e),
                "workflow_run_id": workflow.info().workflow_id,
            }
