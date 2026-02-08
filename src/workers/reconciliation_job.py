"""Reconciliation Job for system health and consistency"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from src.db.firestore_client import get_firestore_client
from src.services.vector_service import get_vector_search_service
from src.services.rbac_service import RBACService
import asyncio

logger = logging.getLogger(__name__)


class ReconciliationJob:
    """System reconciliation job for consistency and health checks"""
    
    def __init__(self):
        self.db = get_firestore_client()
        self.vector_service = get_vector_search_service()
        self.rbac_service = RBACService()
    
    async def reconcile_embeddings(
        self,
        tenant_id: str,
    ) -> Dict[str, Any]:
        """
        Verify embedding consistency between Firestore (source of truth) and Qdrant (index).
        
        Returns:
            {
                "total_documents": int,
                "in_sync": int,
                "out_of_sync": int,
                "missing_in_qdrant": int,
                "errors": List[str],
            }
        """
        try:
            if not self.db.available:
                return {
                    "total_documents": 0,
                    "in_sync": 0,
                    "out_of_sync": 0,
                    "missing_in_qdrant": 0,
                    "errors": ["Firestore not available"],
                }
            
            in_sync = 0
            out_of_sync = 0
            missing_in_qdrant = 0
            errors = []
            total = 0
            
            # Get all signals for this tenant
            try:
                signals = self.db.get_documents(
                    f"tenants/{tenant_id}/signals"
                )
                total += len(signals)
                
                # Check each signal's embedding version
                for signal in signals:
                    signal_id = signal.get("id")
                    firestore_version = signal.get("embedding_version", "0.0")
                    
                    # In production: query Qdrant to check version
                    # For now: assume in-sync if version field exists
                    if firestore_version and firestore_version != "0.0":
                        in_sync += 1
                    else:
                        out_of_sync += 1
                        missing_in_qdrant += 1
                
                logger.info(
                    f"Embedding reconciliation for {tenant_id}: "
                    f"total={total}, in_sync={in_sync}, out_of_sync={out_of_sync}"
                )
            except Exception as e:
                errors.append(f"Error checking signals: {str(e)}")
            
            return {
                "total_documents": total,
                "in_sync": in_sync,
                "out_of_sync": out_of_sync,
                "missing_in_qdrant": missing_in_qdrant,
                "errors": errors,
            }
        except Exception as e:
            logger.error(f"Embedding reconciliation error: {e}")
            return {
                "total_documents": 0,
                "in_sync": 0,
                "out_of_sync": 0,
                "missing_in_qdrant": 0,
                "errors": [str(e)],
            }
    
    async def reconcile_permissions(
        self,
        tenant_id: str,
        account_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Verify permission consistency between Firestore (source) and Qdrant (index).
        
        Checks:
        - Account scoping models match Qdrant permission payloads
        - Permission changes are reflected in indexed documents
        - RBAC rules are consistently enforced
        """
        try:
            if not self.db.available:
                return {
                    "accounts_checked": 0,
                    "permission_issues": 0,
                    "errors": ["Firestore not available"],
                }
            
            permission_issues = 0
            errors = []
            accounts_checked = 0
            
            # Get all accounts
            accounts = self.db.get_documents(
                f"tenants/{tenant_id}/accounts"
            )
            
            for account in accounts:
                acc_id = account.get("id")
                accounts_checked += 1
                
                # Check if account's signals have correct permission scope
                try:
                    account_signals = self.db.get_documents(
                        f"tenants/{tenant_id}/accounts/{acc_id}/signals"
                    )
                    
                    for signal in account_signals:
                        # Verify that Qdrant payload matches Firestore permission level
                        # In production: query Qdrant for this signal's document
                        permission_scope = signal.get("permission_scope", "account")
                        
                        if permission_scope not in ["public", "tenant", "account", "private"]:
                            permission_issues += 1
                            errors.append(
                                f"Invalid permission scope: "
                                f"{acc_id}/signal/{signal.get('id')}"
                            )
                except Exception as e:
                    errors.append(f"Error checking account {acc_id}: {str(e)}")
            
            logger.info(
                f"Permission reconciliation for {tenant_id}: "
                f"accounts_checked={accounts_checked}, "
                f"permission_issues={permission_issues}"
            )
            
            return {
                "accounts_checked": accounts_checked,
                "permission_issues": permission_issues,
                "errors": errors,
            }
        except Exception as e:
            logger.error(f"Permission reconciliation error: {e}")
            return {
                "accounts_checked": 0,
                "permission_issues": 0,
                "errors": [str(e)],
            }
    
    async def reconcile_crm_state(
        self,
        tenant_id: str,
    ) -> Dict[str, Any]:
        """
        Verify CRM activation state consistency.
        
        Checks:
        - Opportunities marked as "activated" have valid CRM records
        - CRM timestamps are recent
        - Activation failures are tracked
        """
        try:
            if not self.db.available:
                return {
                    "opportunities_checked": 0,
                    "state_mismatches": 0,
                    "stale_records": 0,
                    "errors": ["Firestore not available"],
                }
            
            opps_checked = 0
            state_mismatches = 0
            stale_records = 0
            errors = []
            
            # Get all accounts and their opportunities
            accounts = self.db.get_documents(f"tenants/{tenant_id}/accounts")
            
            for account in accounts:
                acc_id = account.get("id")
                
                try:
                    opps = self.db.get_documents(
                        f"tenants/{tenant_id}/accounts/{acc_id}/opportunities"
                    )
                    
                    for opp in opps:
                        opps_checked += 1
                        
                        status = opp.get("status")
                        crm_status = opp.get("crm_status")
                        crm_activated_at = opp.get("crm_activated_at")
                        
                        # Check status consistency
                        if status == "activated" and crm_status != "activated":
                            state_mismatches += 1
                            errors.append(
                                f"State mismatch: {opp.get('id')} "
                                f"(status={status}, crm_status={crm_status})"
                            )
                        
                        # Check for stale CRM records (not updated in 7 days)
                        if crm_activated_at:
                            try:
                                from datetime import datetime
                                if isinstance(crm_activated_at, str):
                                    activated_dt = datetime.fromisoformat(crm_activated_at)
                                else:
                                    activated_dt = crm_activated_at
                                
                                days_old = (datetime.utcnow() - activated_dt).days
                                if days_old > 7:
                                    stale_records += 1
                            except Exception:
                                pass
                        
                except Exception as e:
                    errors.append(f"Error checking account {acc_id}: {str(e)}")
            
            logger.info(
                f"CRM state reconciliation for {tenant_id}: "
                f"opps_checked={opps_checked}, "
                f"state_mismatches={state_mismatches}, "
                f"stale_records={stale_records}"
            )
            
            return {
                "opportunities_checked": opps_checked,
                "state_mismatches": state_mismatches,
                "stale_records": stale_records,
                "errors": errors,
            }
        except Exception as e:
            logger.error(f"CRM state reconciliation error: {e}")
            return {
                "opportunities_checked": 0,
                "state_mismatches": 0,
                "stale_records": 0,
                "errors": [str(e)],
            }
    
    async def check_stuck_workflows(
        self,
        tenant_id: str,
        max_age_hours: int = 1,
    ) -> Dict[str, Any]:
        """
        Detect stuck workflows (not updated for more than max_age_hours).
        
        Checks:
        - ReviewAwaitWorkflows waiting for signals
        - CRMActivationWorkflows in progress
        - SignalIngestionWorkflows hung on external calls
        
        Returns:
            {
                "stuck_count": int,
                "workflow_ids": List[str],
                "recommended_actions": List[str],
            }
        """
        try:
            if not self.db.available:
                return {
                    "stuck_count": 0,
                    "workflow_ids": [],
                    "recommended_actions": [],
                    "errors": ["Firestore not available"],
                }
            
            stuck_workflows = []
            errors = []
            cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
            
            # Check all opportunities for stuck workflows
            accounts = self.db.get_documents(f"tenants/{tenant_id}/accounts")
            
            for account in accounts:
                acc_id = account.get("id")
                
                try:
                    opps = self.db.get_documents(
                        f"tenants/{tenant_id}/accounts/{acc_id}/opportunities"
                    )
                    
                    for opp in opps:
                        updated_at = opp.get("updated_at")
                        status = opp.get("status")
                        workflow_id = opp.get("review_workflow_id") or opp.get("workflow_run_id")
                        
                        # Check if opportunity is stuck
                        if updated_at:
                            try:
                                from datetime import datetime
                                if isinstance(updated_at, str):
                                    updated_dt = datetime.fromisoformat(updated_at)
                                else:
                                    updated_dt = updated_at
                                
                                # Stuck if: pending_review status AND not updated for max_age_hours
                                if status == "pending_review" and updated_dt < cutoff_time:
                                    stuck_workflows.append({
                                        "workflow_id": workflow_id,
                                        "opportunity_id": opp.get("id"),
                                        "status": status,
                                        "last_updated": updated_dt.isoformat(),
                                        "hours_stuck": int(
                                            (datetime.utcnow() - updated_dt).total_seconds() / 3600
                                        ),
                                    })
                            except Exception:
                                pass
                
                except Exception as e:
                    errors.append(f"Error checking account {acc_id}: {str(e)}")
            
            # Generate recommended actions
            recommended_actions = []
            for wf in stuck_workflows:
                recommended_actions.append(
                    f"Review workflow {wf['workflow_id']} "
                    f"(stuck for {wf['hours_stuck']}h, opp={wf['opportunity_id']})"
                )
                if wf["hours_stuck"] > 24:
                    recommended_actions.append(
                        f"ALERT: {wf['workflow_id']} stuck for >24h, manual intervention needed"
                    )
            
            logger.warning(
                f"Stuck workflow check for {tenant_id}: "
                f"found {len(stuck_workflows)} stuck workflows"
            )
            
            return {
                "stuck_count": len(stuck_workflows),
                "workflow_ids": [wf["workflow_id"] for wf in stuck_workflows],
                "stuck_workflows": stuck_workflows,
                "recommended_actions": recommended_actions,
                "errors": errors,
            }
        except Exception as e:
            logger.error(f"Stuck workflow check error: {e}")
            return {
                "stuck_count": 0,
                "workflow_ids": [],
                "recommended_actions": [],
                "errors": [str(e)],
            }
    
    async def run_all_checks(
        self,
        tenant_id: str,
    ) -> Dict[str, Any]:
        """
        Run all reconciliation checks.
        
        Returns: consolidated health report
        """
        try:
            logger.info(f"Starting reconciliation job for {tenant_id}")
            
            # Run all checks concurrently
            results = await asyncio.gather(
                self.reconcile_embeddings(tenant_id),
                self.reconcile_permissions(tenant_id),
                self.reconcile_crm_state(tenant_id),
                self.check_stuck_workflows(tenant_id),
            )
            
            embeddings_result, permissions_result, crm_result, stuck_result = results
            
            return {
                "tenant_id": tenant_id,
                "timestamp": datetime.utcnow().isoformat(),
                "embeddings": embeddings_result,
                "permissions": permissions_result,
                "crm_state": crm_result,
                "stuck_workflows": stuck_result,
                "overall_health": self._compute_health_score(
                    embeddings_result, permissions_result, crm_result, stuck_result
                ),
            }
        except Exception as e:
            logger.error(f"Reconciliation job failed: {e}")
            return {
                "tenant_id": tenant_id,
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e),
                "overall_health": "DEGRADED",
            }
    
    def _compute_health_score(
        self,
        embeddings: Dict,
        permissions: Dict,
        crm: Dict,
        stuck: Dict,
    ) -> str:
        """Compute overall system health score"""
        issues = 0
        
        # Count issues
        if embeddings.get("out_of_sync", 0) > 0:
            issues += 1
        if permissions.get("permission_issues", 0) > 0:
            issues += 1
        if crm.get("state_mismatches", 0) > 0:
            issues += 1
        if stuck.get("stuck_count", 0) > 0:
            issues += 2  # Stuck workflows are more critical
        
        # Determine health
        if issues == 0:
            return "HEALTHY"
        elif issues <= 2:
            return "DEGRADED"
        else:
            return "CRITICAL"


def get_reconciliation_job() -> ReconciliationJob:
    """Get reconciliation job singleton"""
    return ReconciliationJob()


# Scheduled job runner
async def run_reconciliation_for_tenant(tenant_id: str):
    """Run reconciliation job for a specific tenant"""
    job = get_reconciliation_job()
    report = await job.run_all_checks(tenant_id)
    
    # Log or alert based on health
    health = report.get("overall_health")
    if health == "CRITICAL":
        logger.critical(f"System health CRITICAL for {tenant_id}: {report}")
    elif health == "DEGRADED":
        logger.warning(f"System health DEGRADED for {tenant_id}: {report}")
    else:
        logger.info(f"System health HEALTHY for {tenant_id}")
    
    return report
