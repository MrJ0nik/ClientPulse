"""Workflow for monitoring accounts for new signals"""
from temporalio import workflow
from datetime import timedelta
from typing import List, Dict, Any

with workflow.unsafe.imports_passed_through():
    from ..activities.monitoring_activities import news_search_activity
    from ..workflows.signal_ingestion import SignalIngestionWorkflow


@workflow.defn
class AccountMonitoringWorkflow:
    """
    Workflow that monitors accounts for new signals and
    automatically initiates discovery workflows for each signal
    """
    
    @workflow.run
    async def run(
        self,
        tenant_id: str,
        account_id: str,
        company_name: str,
        query: str = "",
        top_n: int = 3
    ) -> Dict[str, Any]:
        """
        Monitor account for new signals
        
        Args:
            tenant_id: Tenant identifier
            account_id: Account identifier
            company_name: Company name to monitor
            query: Search query (optional)
            top_n: Number of results to retrieve
        """
        try:
            workflow_run_id = workflow.info().workflow_id
            
            # Search for relevant news/signals
            urls: List[str] = await workflow.execute_activity(
                news_search_activity,
                {"company": company_name, "query": query, "top_n": top_n},
                start_to_close_timeout=timedelta(seconds=30),
            )
            
            results: List[Dict[str, Any]] = []
            
            # For each URL, ingest signal and discover opportunity
            for url in urls:
                # Generate unique workflow IDs using workflow.uuid4()
                signal_ingestion_id = f"ingestion-{tenant_id}-{account_id}-{workflow.uuid4()[:8]}"
                
                # Ingest signal
                ingestion = await workflow.execute_child_workflow(
                    SignalIngestionWorkflow.run,
                    tenant_id,
                    account_id,
                    {
                        "type": "NEWS",
                        "url": url,
                        "search_term": company_name,
                    },
                    id=signal_ingestion_id,
                    task_queue=workflow.info().task_queue,
                )

                results.append({
                    "url": url,
                    "ingestion": ingestion,
                })
            
            return {
                "status": "COMPLETED",
                "tenant_id": tenant_id,
                "account_id": account_id,
                "company_name": company_name,
                "urls_processed": len(urls),
                "urls": urls,
                "results": results,
                "workflow_run_id": workflow_run_id,
            }
        
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Account monitoring failed: {e}", exc_info=True)
            return {
                "status": "FAILED",
                "error": str(e),
                "workflow_run_id": workflow.info().workflow_id,
            }
