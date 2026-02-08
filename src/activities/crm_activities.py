"""Temporal activities for CRM operations"""
from typing import Dict, Any, Optional
from datetime import datetime
from temporalio import activity
from src.models.account import Account
from src.audit.audit_service import AuditService
import logging

logger = logging.getLogger(__name__)

# Mock CRM clients (will be replaced with real implementations)
class SalesforceClient:
    """Mock Salesforce client"""
    async def create_task(self, account_id: str, task_data: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"Salesforce: Creating task for account {account_id}")
        return {"success": True, "task_id": f"sf-{account_id}-{datetime.utcnow().timestamp()}"}
    
    async def update_opportunity(self, opportunity_data: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"Salesforce: Updating opportunity")
        return {"success": True, "updated": True}


class HubSpotClient:
    """Mock HubSpot client"""
    async def create_note(self, deal_id: str, note: str) -> Dict[str, Any]:
        logger.info(f"HubSpot: Creating note for deal {deal_id}")
        return {"success": True, "note_id": f"hs-{deal_id}-{datetime.utcnow().timestamp()}"}
    
    async def update_deal(self, deal_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"HubSpot: Updating deal {deal_id}")
        return {"success": True, "updated": True}


# Global clients (initialized on first use)
_salesforce_client = None
_hubspot_client = None
_audit_service = None


def get_salesforce_client() -> SalesforceClient:
    """Get Salesforce client instance"""
    global _salesforce_client
    if _salesforce_client is None:
        _salesforce_client = SalesforceClient()
    return _salesforce_client


def get_hubspot_client() -> HubSpotClient:
    """Get HubSpot client instance"""
    global _hubspot_client
    if _hubspot_client is None:
        _hubspot_client = HubSpotClient()
    return _hubspot_client


def get_audit_service() -> AuditService:
    """Get audit service instance"""
    global _audit_service
    if _audit_service is None:
        _audit_service = AuditService()
    return _audit_service


@activity.defn
async def create_salesforce_task_activity(
    tenant_id: str,
    account_id: str,
    opportunity_id: str,
    title: str,
    description: str,
    workflow_run_id: Optional[str] = None
) -> Dict[str, Any]:
    """Create Salesforce task for opportunity"""
    try:
        client = get_salesforce_client()
        audit = get_audit_service()
        
        task_data = {
            "subject": title,
            "description": description,
            "opportunity_id": opportunity_id,
            "account_id": account_id,
            "type": "Task",
            "status": "Not Started",
        }
        
        result = await client.create_task(account_id, task_data)
        
        # Log audit
        await audit.log(
            action="ACTIVATE_SALESFORCE",
            user_id="system",
            entity_type="opportunity",
            entity_id=opportunity_id,
            reason="CRM activation",
            new_value={"task_id": result.get("task_id")},
            account_id=account_id,
        )
        
        return {
            "success": True,
            "task_id": result.get("task_id"),
            "crm_system": "salesforce",
            "opportunity_id": opportunity_id,
            "workflow_run_id": workflow_run_id,
        }
    except Exception as e:
        logger.error(f"Error creating Salesforce task: {e}")
        return {
            "success": False,
            "error": str(e),
            "opportunity_id": opportunity_id,
            "workflow_run_id": workflow_run_id,
        }

@activity.defn

async def create_hubspot_task_activity(
    tenant_id: str,
    account_id: str,
    opportunity_id: str,
    title: str,
    description: str,
    workflow_run_id: Optional[str] = None
) -> Dict[str, Any]:
    """Create HubSpot task for opportunity"""
    try:
        client = get_hubspot_client()
        audit = get_audit_service()
        
        deal_id = f"hubspot-{opportunity_id}"
        note = f"{title}\n\n{description}"
        
        result = await client.create_note(deal_id, note)
        
        # Log audit
        await audit.log(
            action="ACTIVATE_HUBSPOT",
            user_id="system",
            entity_type="opportunity",
            entity_id=opportunity_id,
            reason="CRM activation",
            new_value={"note_id": result.get("note_id")},
            account_id=account_id,
        )
        
        return {
            "success": True,
            "note_id": result.get("note_id"),
            "crm_system": "hubspot",
            "opportunity_id": opportunity_id,
            "workflow_run_id": workflow_run_id,
        }
    except Exception as e:
        logger.error(f"Error creating HubSpot task: {e}")
        return {
            "success": False,
            "error": str(e),
            "opportunity_id": opportunity_id,
            "workflow_run_id": workflow_run_id,
        }


@activity.defn
async def update_opportunity_status_activity(
    tenant_id: str,
    account_id: str,
    opportunity_id: str,
    new_status: str,
    crm_system: str = "salesforce",
    extra_fields: Optional[Dict[str, Any]] = None,
    workflow_run_id: Optional[str] = None
) -> Dict[str, Any]:
    """Update opportunity status and CRM fields in Firestore"""
    try:
        from src.db.firestore_client import FirestoreClientExtended
        from src.models.opportunity import Opportunity
        from datetime import datetime
        
        db = FirestoreClientExtended()
        audit = get_audit_service()
        
        # Build update payload
        update_data = {
            "status": new_status,
            "updated_at": datetime.utcnow().isoformat(),
            # version management would go here
        }
        
        # Merge extra fields (CRM-specific: crm_status, crm_activated_at, crm_record_id, etc.)
        if extra_fields:
            update_data.update(extra_fields)
        
        # Update Firestore directly
        opp_path = f"tenants/{tenant_id}/accounts/{account_id}/opportunities/{opportunity_id}"
        
        # Direct document update
        try:
            db.db.document(opp_path).update(update_data)
            success = True
        except Exception as e:
            logger.error(f"Failed to update opportunity document: {e}")
            success = False
        
        if success:
            # Log audit with all updated fields
            await audit.log(
                action="UPDATE_STATUS",
                user_id="system",
                entity_type="opportunity",
                entity_id=opportunity_id,
                reason=f"CRM activation - {crm_system}",
                new_value=update_data,
                account_id=account_id,
            )
        
        return {
            "success": success,
            "opportunity_id": opportunity_id,
            "new_status": new_status,
            "updated_fields": extra_fields or {},
            "crm_system": crm_system,
            "workflow_run_id": workflow_run_id,
        }
    except Exception as e:
        logger.error(f"Error updating opportunity status: {e}")
        return {
            "success": False,
            "error": str(e),
            "opportunity_id": opportunity_id,
            "workflow_run_id": workflow_run_id,
        }
