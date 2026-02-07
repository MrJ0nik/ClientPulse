"""Read models for database queries"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from src.db.firestore_client import get_firestore_client
from src.models import SignalSourceType, OpportunityStatus


def get_account_views_for_am(tenant_id: str, am_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get account views for an account manager"""
    try:
        db = get_firestore_client()
        
        # Read accounts from 'accounts' collection  
        query = db.db.collection(f"tenants/{tenant_id}/accounts")
        docs = query.stream()
        
        accounts = []
        for doc in docs:
            data = doc.to_dict()
            
            # Get signals count
            signals_count = len(db.db.collection(f"tenants/{tenant_id}/accounts/{doc.id}/signals").stream())
            
            # Get opportunities count
            opportunities_count = len(db.db.collection(f"tenants/{tenant_id}/accounts/{doc.id}/opportunities").stream())
            
            # Calculate pending statuses
            pending_signals = 0
            pending_opportunities = 0
            high_priority = 0
            pipeline_value = 0.0
            
            # Count signals by status
            for signal_doc in db.db.collection(f"tenants/{tenant_id}/accounts/{doc.id}/signals").stream():
                signal_data = signal_doc.to_dict()
                if signal_data.get("workflow_status") == "pending":
                    pending_signals += 1
                if signal_data.get("priority") == "high" or signal_data.get("priority") == "critical":
                    high_priority += 1
            
            # Sum opportunity values
            for opp_doc in db.db.collection(f"tenants/{tenant_id}/accounts/{doc.id}/opportunities").stream():
                opp_data = opp_doc.to_dict()
                if opp_data.get("status") == "pending":
                    pending_opportunities += 1
                if opp_data.get("estimated_value"):
                    pipeline_value += opp_data.get("estimated_value", 0)
            
            account_view = {
                "id": doc.id,
                "tenant_id": tenant_id,
                "name": data.get("name", "Unknown"),
                "industry": data.get("industry"),
                "signals_count": signals_count,
                "opportunities_count": opportunities_count,
                "pending_signals": pending_signals,
                "pending_opportunities": pending_opportunities,
                "high_priority_signals": high_priority,
                "pipeline_value": pipeline_value,
                "counters": {
                    "signals_count": signals_count,
                    "opportunities_count": opportunities_count,
                    "activities_count": 0
                },
                "trends": {
                    "signals_trend": None,
                    "opportunities_trend": None,
                    "conversion_rate": None
                },
                "created_at": data.get("created_at"),
                "updated_at": data.get("updated_at")
            }
            accounts.append(account_view)
        
        return accounts
    except Exception as e:
        print(f"Error getting account views for AM: {e}")
        return []


def get_account_view(tenant_id: str, account_id: str) -> Optional[Dict[str, Any]]:
    """Get a single account view"""
    try:
        db = get_firestore_client()
        
        # Get account document
        account_doc = db.db.collection(f"tenants/{tenant_id}/accounts").document(account_id).get()
        
        if not account_doc.exists:
            return None
        
        data = account_doc.to_dict()
        
        # Get signals count
        signals_count = len(db.db.collection(f"tenants/{tenant_id}/accounts/{account_id}/signals").stream())
        
        # Get opportunities count
        opportunities_count = len(db.db.collection(f"tenants/{tenant_id}/accounts/{account_id}/opportunities").stream())
        
        # Calculate pending statuses
        pending_signals = 0
        pending_opportunities = 0
        high_priority = 0
        pipeline_value = 0.0
        
        # Count signals by status
        for signal_doc in db.db.collection(f"tenants/{tenant_id}/accounts/{account_id}/signals").stream():
            signal_data = signal_doc.to_dict()
            if signal_data.get("workflow_status") == "pending":
                pending_signals += 1
            if signal_data.get("priority") == "high" or signal_data.get("priority") == "critical":
                high_priority += 1
        
        # Sum opportunity values
        for opp_doc in db.db.collection(f"tenants/{tenant_id}/accounts/{account_id}/opportunities").stream():
            opp_data = opp_doc.to_dict()
            if opp_data.get("status") == "pending":
                pending_opportunities += 1
            if opp_data.get("estimated_value"):
                pipeline_value += opp_data.get("estimated_value", 0)
        
        account_view = {
            "id": account_id,
            "tenant_id": tenant_id,
            "name": data.get("name", "Unknown"),
            "industry": data.get("industry"),
            "signals_count": signals_count,
            "opportunities_count": opportunities_count,
            "pending_signals": pending_signals,
            "pending_opportunities": pending_opportunities,
            "high_priority_signals": high_priority,
            "pipeline_value": pipeline_value,
            "counters": {
                "signals_count": signals_count,
                "opportunities_count": opportunities_count,
                "activities_count": 0
            },
            "trends": {
                "signals_trend": None,
                "opportunities_trend": None,
                "conversion_rate": None
            },
            "created_at": data.get("created_at"),
            "updated_at": data.get("updated_at")
        }
        
        return account_view
    except Exception as e:
        print(f"Error getting account view: {e}")
        return None


def get_signals_for_account(tenant_id: str, account_id: str) -> List[Dict[str, Any]]:
    """Get all signals for an account"""
    try:
        db = get_firestore_client()
        
        docs = db.db.collection(f"tenants/{tenant_id}/accounts/{account_id}/signals").stream()
        signals = []
        
        for doc in docs:
            data = doc.to_dict()
            signal = {**data, "id": doc.id}
            signals.append(signal)
        
        return signals
    except Exception as e:
        print(f"Error getting signals: {e}")
        return []


def get_opportunities_for_account(tenant_id: str, account_id: str) -> List[Dict[str, Any]]:
    """Get all opportunities for an account"""
    try:
        db = get_firestore_client()
        
        docs = db.db.collection(f"tenants/{tenant_id}/accounts/{account_id}/opportunities").stream()
        opportunities = []
        
        for doc in docs:
            data = doc.to_dict()
            opportunity = {**data, "id": doc.id}
            opportunities.append(opportunity)
        
        return opportunities
    except Exception as e:
        print(f"Error getting opportunities: {e}")
        return []


def get_signal(tenant_id: str, account_id: str, signal_id: str) -> Optional[Dict[str, Any]]:
    """Get a single signal"""
    try:
        db = get_firestore_client()
        
        doc = db.db.collection(f"tenants/{tenant_id}/accounts/{account_id}/signals").document(signal_id).get()
        
        if doc.exists:
            data = doc.to_dict()
            return {**data, "id": doc.id}
        
        return None
    except Exception as e:
        print(f"Error getting signal: {e}")
        return None


def get_opportunity(tenant_id: str, account_id: str, opportunity_id: str) -> Optional[Dict[str, Any]]:
    """Get a single opportunity"""
    try:
        db = get_firestore_client()
        
        doc = db.db.collection(f"tenants/{tenant_id}/accounts/{account_id}/opportunities").document(opportunity_id).get()
        
        if doc.exists:
            data = doc.to_dict()
            return {**data, "id": doc.id}
        
        return None
    except Exception as e:
        print(f"Error getting opportunity: {e}")
        return None
