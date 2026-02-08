"""Audit service for logging operations"""
from datetime import datetime
from typing import Dict, Any, Optional, Union
from src.db.firestore_client import get_firestore_client
import logging

logger = logging.getLogger(__name__)


class AuditService:
    """Service for recording audit logs"""
    
    def __init__(self):
        self.db = get_firestore_client()
    
    async def log(
        self,
        action: Union[str, object],
        user_id: str,
        entity_type: str,
        entity_id: str,
        reason: Optional[str] = None,
        new_value: Optional[Dict[str, Any]] = None,
        account_id: Optional[str] = None,
    ) -> bool:
        """Log an audit event"""
        try:
            # Handle Enum or string
            action_value = action.value if hasattr(action, 'value') else str(action)
            
            audit_entry = {
                "action": action_value,
                "user_id": user_id,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "account_id": account_id or "unknown",
                "reason": reason or "",
                "new_value": new_value or {},
                "timestamp": datetime.utcnow(),
            }
            
            # Store in Firestore
            self.db.db.collection("auditLogs").add(audit_entry)
            
            logger.info(f"Audit log: {action_value} on {entity_type}/{entity_id} by {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error logging audit: {e}")
            return False


def get_audit_service() -> AuditService:
    """Get audit service instance"""
    return AuditService()
