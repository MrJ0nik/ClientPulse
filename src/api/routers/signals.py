"""Signals router API endpoints"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from datetime import datetime
from typing import List
from src.db.read_models import get_signals_for_account, get_signal
from src.db.firestore_client import get_firestore_client
from src.api.schemas import SignalSchema
from src.models import SignalCreate

router = APIRouter(prefix="/signals", tags=["signals"])


@router.get("", response_model=List[SignalSchema])
async def list_signals(tenant_id: str, account_id: str):
    """Get all signals for an account"""
    try:
        signals = get_signals_for_account(tenant_id, account_id)
        return signals
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{signal_id}", response_model=SignalSchema)
async def get_signal_detail(tenant_id: str, account_id: str, signal_id: str):
    """Get a single signal"""
    try:
        signal = get_signal(tenant_id, account_id, signal_id)
        if not signal:
            raise HTTPException(status_code=404, detail="Signal not found")
        return signal
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=SignalSchema)
async def create_signal(tenant_id: str, account_id: str, signal_data: SignalCreate, background_tasks: BackgroundTasks):
    """Create a new signal and trigger workflow"""
    try:
        db = get_firestore_client()
        
        # Create signal document
        signal_doc = {
            "account_id": account_id,
            "tenant_id": tenant_id,
            "title": signal_data.title,
            "description": signal_data.description,
            "source_type": signal_data.source_type.value if hasattr(signal_data.source_type, 'value') else str(signal_data.source_type).lower(),
            "priority": signal_data.priority.value if hasattr(signal_data.priority, 'value') else str(signal_data.priority),
            "source_url": signal_data.source_url,
            "entities": signal_data.entities,
            "keywords": signal_data.keywords,
            "workflow_status": "pending",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        # Save to Firestore
        signal_ref = db.db.collection(f"tenants/{tenant_id}/accounts/{account_id}/signals").add(signal_doc)
        signal_id = signal_ref[1].id if isinstance(signal_ref, tuple) else signal_ref.id
        
        signal_doc["id"] = signal_id
        
        # TODO: Trigger SignalIngestionWorkflow via Temporal
        # For now, just return the created signal
        
        return signal_doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{signal_id}", response_model=SignalSchema)
async def update_signal(tenant_id: str, account_id: str, signal_id: str, signal_data: SignalCreate):
    """Update a signal"""
    try:
        db = get_firestore_client()
        
        update_data = {
            "title": signal_data.title,
            "description": signal_data.description,
            "source_type": signal_data.source_type.value if hasattr(signal_data.source_type, 'value') else str(signal_data.source_type).lower(),
            "priority": signal_data.priority.value if hasattr(signal_data.priority, 'value') else str(signal_data.priority),
            "source_url": signal_data.source_url,
            "entities": signal_data.entities,
            "keywords": signal_data.keywords,
            "updated_at": datetime.utcnow(),
        }
        
        db.db.collection(f"tenants/{tenant_id}/accounts/{account_id}/signals").document(signal_id).update(update_data)
        
        signal = get_signal(tenant_id, account_id, signal_id)
        if not signal:
            raise HTTPException(status_code=404, detail="Signal not found")
        
        return signal
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
