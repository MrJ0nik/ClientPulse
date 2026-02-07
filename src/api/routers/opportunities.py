"""Opportunities router API endpoints"""
from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import List, Optional
from src.db.read_models import get_opportunities_for_account, get_opportunity
from src.db.firestore_client import get_firestore_client
from src.api.schemas import OpportunitySchema
from src.models import OpportunityCreate

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


@router.get("", response_model=List[OpportunitySchema])
async def list_opportunities(tenant_id: str, account_id: str):
    """Get all opportunities for an account"""
    try:
        opportunities = get_opportunities_for_account(tenant_id, account_id)
        return opportunities
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{opportunity_id}", response_model=OpportunitySchema)
async def get_opportunity_detail(tenant_id: str, account_id: str, opportunity_id: str):
    """Get a single opportunity"""
    try:
        opportunity = get_opportunity(tenant_id, account_id, opportunity_id)
        if not opportunity:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        
        # Enrich with account data
        db = get_firestore_client()
        account_doc = db.db.collection(f"tenants/{tenant_id}/accounts").document(account_id).get()
        if account_doc.exists:
            account_data = account_doc.to_dict()
            opportunity["account_name"] = account_data.get("name", "Unknown")
        
        return opportunity
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=OpportunitySchema)
async def create_opportunity(tenant_id: str, account_id: str, opp_data: OpportunityCreate):
    """Create a new opportunity"""
    try:
        db = get_firestore_client()
        
        # Get account name
        account_doc = db.db.collection(f"tenants/{tenant_id}/accounts").document(account_id).get()
        account_name = "Unknown"
        if account_doc.exists:
            account_name = account_doc.to_dict().get("name", "Unknown")
        
        # Create opportunity document
        opp_doc = {
            "account_id": account_id,
            "tenant_id": tenant_id,
            "account_name": account_name,
            "title": opp_data.title,
            "description": opp_data.description,
            "status": opp_data.status.value if hasattr(opp_data.status, 'value') else "pending",
            "opportunity_type": opp_data.opportunity_type.value if hasattr(opp_data.opportunity_type, 'value') else "new_business",
            "estimated_value": opp_data.estimated_value,
            "currency": opp_data.currency or "USD",
            "probability": opp_data.probability or 0.5,
            "signal_ids": opp_data.signal_ids,
            "source_signals": opp_data.source_signals or [],
            "source_url": opp_data.source_url,
            "confidence_score": opp_data.confidence_score,
            "next_steps": opp_data.next_steps or [],
            "assigned_to": opp_data.assigned_to,
            "crm_status": None,
            "crm_activated_at": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        # Save to Firestore
        opp_ref = db.db.collection(f"tenants/{tenant_id}/accounts/{account_id}/opportunities").add(opp_doc)
        opp_id = opp_ref[1].id if isinstance(opp_ref, tuple) else opp_ref.id
        
        opp_doc["id"] = opp_id
        
        return opp_doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{opportunity_id}", response_model=OpportunitySchema)
async def update_opportunity(tenant_id: str, account_id: str, opportunity_id: str, opp_data: OpportunityCreate):
    """Update an opportunity"""
    try:
        db = get_firestore_client()
        
        update_data = {
            "title": opp_data.title,
            "description": opp_data.description,
            "opportunity_type": opp_data.opportunity_type.value if hasattr(opp_data.opportunity_type, 'value') else "new_business",
            "estimated_value": opp_data.estimated_value,
            "probability": opp_data.probability or 0.5,
            "signal_ids": opp_data.signal_ids,
            "source_url": opp_data.source_url,
            "confidence_score": opp_data.confidence_score,
            "next_steps": opp_data.next_steps or [],
            "assigned_to": opp_data.assigned_to,
            "updated_at": datetime.utcnow(),
        }
        
        db.db.collection(f"tenants/{tenant_id}/accounts/{account_id}/opportunities").document(opportunity_id).update(update_data)
        
        opportunity = get_opportunity(tenant_id, account_id, opportunity_id)
        if not opportunity:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        
        return opportunity
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{opportunity_id}/activate-crm")
async def activate_opportunity_in_crm(tenant_id: str, account_id: str, opportunity_id: str, crm_system: str):
    """Activate opportunity in CRM system"""
    try:
        db = get_firestore_client()
        
        # Update opportunity with CRM activation
        update_data = {
            "crm_status": "activated",
            "crm_activated_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        db.db.collection(f"tenants/{tenant_id}/accounts/{account_id}/opportunities").document(opportunity_id).update(update_data)
        
        # TODO: Trigger CRMActivationWorkflow via Temporal
        
        opportunity = get_opportunity(tenant_id, account_id, opportunity_id)
        if not opportunity:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        
        return {
            "success": True,
            "opportunity": opportunity,
            "crm_system": crm_system,
            "message": f"Opportunity activated in {crm_system}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
