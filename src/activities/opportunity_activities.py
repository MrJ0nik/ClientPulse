"""Temporal activities for opportunity operations"""
from datetime import datetime
from typing import List, Dict, Any, Optional
from src.db.firestore_client import get_firestore_client
from src.db.read_models import get_signal, get_account_view
import logging

logger = logging.getLogger(__name__)


async def create_opportunity_activity(
    tenant_id: str,
    account_id: str,
    signal_id: str,
    workflow_run_id: str
) -> Dict[str, Any]:
    """Create opportunity from signal"""
    try:
        db = get_firestore_client()
        
        # Fetch the signal
        signal = get_signal(tenant_id, account_id, signal_id)
        if not signal:
            logger.error(f"Signal {signal_id} not found")
            return {
                "success": False,
                "error": "Signal not found",
                "workflow_run_id": workflow_run_id
            }
        
        # Get account info
        account = get_account_view(tenant_id, account_id)
        account_name = account.get("name", "Unknown") if account else "Unknown"
        
        # Create opportunity
        opportunity_doc = {
            "account_id": account_id,
            "tenant_id": tenant_id,
            "account_name": account_name,
            "title": f"Opportunity: {signal.get('title', 'Generated Opportunity')}",
            "description": f"Generated from signal: {signal.get('description', '')}",
            "status": "pending",
            "opportunity_type": "new_business",
            "estimated_value": 50000.0,  # Default value
            "currency": "USD",
            "probability": 0.5,
            "signal_ids": [signal_id],
            "source_signals": [signal],
            "source_url": signal.get("source_url"),
            "confidence_score": 0.75,
            "next_steps": [
                "Review opportunity details",
                "Assess fit with account strategy",
                "Prepare pitch deck"
            ],
            "assigned_to": None,
            "crm_status": None,
            "crm_activated_at": None,
            "workflow_run_id": workflow_run_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        # Save to Firestore
        opp_ref = db.db.collection(
            f"tenants/{tenant_id}/accounts/{account_id}/opportunities"
        ).add(opportunity_doc)
        
        opp_id = opp_ref[1].id if isinstance(opp_ref, tuple) else opp_ref.id
        opportunity_doc["id"] = opp_id
        
        logger.info(f"Created opportunity {opp_id} from signal {signal_id}")
        
        return {
            "success": True,
            "opportunity_id": opp_id,
            "opportunity": opportunity_doc,
            "workflow_run_id": workflow_run_id
        }
    except Exception as e:
        logger.error(f"Error creating opportunity: {e}")
        return {
            "success": False,
            "error": str(e),
            "workflow_run_id": workflow_run_id
        }


async def activate_opportunity_crm_activity(
    tenant_id: str,
    account_id: str,
    opportunity_id: str,
    crm_system: str,
    crm_user_id: Optional[str] = None,
    workflow_run_id: Optional[str] = None
) -> Dict[str, Any]:
    """Activate opportunity in CRM system"""
    try:
        db = get_firestore_client()
        
        # Update opportunity status
        update_data = {
            "crm_status": "activated",
            "crm_activated_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        db.db.collection(
            f"tenants/{tenant_id}/accounts/{account_id}/opportunities"
        ).document(opportunity_id).update(update_data)
        
        logger.info(f"Activated opportunity {opportunity_id} in {crm_system}")
        
        return {
            "success": True,
            "opportunity_id": opportunity_id,
            "crm_system": crm_system,
            "crm_user_id": crm_user_id,
            "message": f"Opportunity activated in {crm_system}",
            "workflow_run_id": workflow_run_id
        }
    except Exception as e:
        logger.error(f"Error activating opportunity in CRM: {e}")
        return {
            "success": False,
            "error": str(e),
            "workflow_run_id": workflow_run_id
        }


async def update_signal_status_activity(
    tenant_id: str,
    account_id: str,
    signal_id: str,
    new_status: str,
    workflow_run_id: Optional[str] = None
) -> Dict[str, Any]:
    """Update signal workflow status"""
    try:
        db = get_firestore_client()
        
        update_data = {
            "workflow_status": new_status,
            "updated_at": datetime.utcnow(),
        }
        
        db.db.collection(
            f"tenants/{tenant_id}/accounts/{account_id}/signals"
        ).document(signal_id).update(update_data)
        
        logger.info(f"Updated signal {signal_id} status to {new_status}")
        
        return {
            "success": True,
            "signal_id": signal_id,
            "new_status": new_status,
            "workflow_run_id": workflow_run_id
        }
    except Exception as e:
        logger.error(f"Error updating signal status: {e}")
        return {
            "success": False,
            "error": str(e),
            "workflow_run_id": workflow_run_id
        }


async def notify_user_activity(
    user_id: str,
    title: str,
    message: str,
    notification_type: str = "info",
    data: Optional[Dict[str, Any]] = None,
    workflow_run_id: Optional[str] = None
) -> Dict[str, Any]:
    """Send notification to user"""
    try:
        # TODO: Implement notification system (email, Slack, etc.)
        logger.info(f"Notification for user {user_id}: {title} - {message}")
        
        return {
            "success": True,
            "user_id": user_id,
            "notification_type": notification_type,
            "message": message,
            "workflow_run_id": workflow_run_id
        }
    except Exception as e:
        logger.error(f"Error sending notification: {e}")
        return {
            "success": False,
            "error": str(e),
            "workflow_run_id": workflow_run_id
        }
