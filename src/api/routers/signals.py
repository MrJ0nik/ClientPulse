"""Signals router API endpoints"""
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Query
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from temporalio.client import Client
from src.db.firestore_client import FirestoreClient
import asyncio
import uuid

router = APIRouter(prefix="/v1/signals", tags=["signals"])


# Schemas
class CreateSignalRequest(BaseModel):
    account_id: str
    title: str
    source_url: str
    source_type: str = "NEWS"
    description: Optional[str] = None


class CreateSignalResponse(BaseModel):
    signal_id: str
    workflow_id: str
    status: str
    message: str


class Signal(BaseModel):
    id: str
    account_id: str
    title: str
    source_url: str
    source_type: str
    description: Optional[str] = None
    created_at: str
    status: Optional[str] = "processed"


# Mock auth
def get_tenant_id():
    return "tenant-demo"


def get_firestore():
    return FirestoreClient()


async def get_temporal_client() -> Client:
    """Get Temporal client connection"""
    try:
        return await Client.connect("localhost:7233")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Temporal connection failed: {str(e)}")


@router.get("", response_model=dict)
async def list_signals(
    account_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    tenant_id: str = Depends(get_tenant_id),
    db: FirestoreClient = Depends(get_firestore),
):
    """List signals from Firestore or mock data"""
    
    # Mock signals
    mock_signals = [
        {
            "id": "sig-001",
            "account_id": "acc-techcorp",
            "title": "TechCorp Series C Funding",
            "source_url": "https://techcrunch.com/2024/01/15/techcorp-series-c/",
            "source_type": "NEWS",
            "description": "TechCorp announced $50M Series C funding round",
            "created_at": datetime.utcnow().isoformat(),
            "status": "processed"
        },
        {
            "id": "sig-002",
            "account_id": "acc-dataflow",
            "title": "DataFlow Inc Hiring Spree",
            "source_url": "https://linkedin.com/company/dataflow-inc",
            "source_type": "NEWS",
            "description": "DataFlow posted 5 senior engineering positions",
            "created_at": datetime.utcnow().isoformat(),
            "status": "processed"
        },
    ]
    
    # Try to fetch from Firestore if available
    if db.available:
        try:
            all_signals = []
            
            # Get signals for specific account or all accounts
            if account_id:
                # Get signals for specific account
                signals_path = f"tenants/{tenant_id}/accounts/{account_id}/signals"
                print(f"📡 Querying signals from: {signals_path}")
                signals = db.get_documents(signals_path)
                print(f"   Found {len(signals)} signals")
                all_signals.extend(signals)
            else:
                # Default to acc-techcorp if no account specified
                account_id = "acc-techcorp"
                signals_path = f"tenants/{tenant_id}/accounts/{account_id}/signals"
                print(f"📡 Querying signals from: {signals_path}")
                signals = db.get_documents(signals_path)
                print(f"   Found {len(signals)} signals")
                all_signals.extend(signals)
            
            # If we got results from Firestore, use them
            if all_signals:
                # Sort by created_at descending
                all_signals.sort(
                    key=lambda x: x.get("created_at", ""),
                    reverse=True
                )
                
                # Apply pagination
                paginated = all_signals[offset:offset + limit]
                
                print(f"✓ Returning {len(paginated)} signals from Firestore")
                return {
                    "signals": paginated,
                    "total": len(all_signals),
                    "limit": limit,
                    "offset": offset,
                    "source": "firestore"
                }
            else:
                print(f"⚠ No signals found in Firestore, using mock data")
        except Exception as e:
            print(f"❌ Firestore query failed: {e}, falling back to mock data")
    
    # Return mock data as fallback
    return {
        "signals": mock_signals[offset:offset + limit],
        "total": len(mock_signals),
        "limit": limit,
        "offset": offset,
        "source": "mock"
    }



@router.post("", response_model=CreateSignalResponse)
async def create_signal(
    request: CreateSignalRequest,
    tenant_id: str = Depends(get_tenant_id),
    db: FirestoreClient = Depends(get_firestore),
):
    """Create a new signal and trigger SignalIngestionWorkflow"""
    try:
        # Generate IDs
        signal_id = f"sig-{uuid.uuid4().hex[:12]}"
        workflow_id = f"signal-ingestion-{signal_id}"
        
        # Save signal to Firestore immediately
        if db.available:
            try:
                signal_doc = {
                    "id": signal_id,
                    "account_id": request.account_id,
                    "title": request.title,
                    "source_url": request.source_url,
                    "source_type": request.source_type,
                    "description": request.description or "",
                    "created_at": datetime.utcnow().isoformat(),
                    "status": "processing",
                    "workflow_status": "processing",
                    "workflow_id": workflow_id,
                }
                
                signals_path = f"tenants/{tenant_id}/accounts/{request.account_id}/signals"
                db.set_document(signals_path, signal_id, signal_doc)
                print(f"✓ Signal saved to Firestore: {signals_path}/{signal_id}")
            except Exception as e:
                print(f"Warning: Failed to save signal to Firestore: {e}")
        
        # Connect to Temporal and start workflow
        try:
            client = await get_temporal_client()
            
            # Import workflow
            from src.workflows.signal_ingestion import SignalIngestionWorkflow
            
            # Prepare signal data
            signal_data = {
                "type": request.source_type,
                "url": request.source_url,
                "title": request.title,
                "search_term": request.description or "",
                "description": request.description or "",
                "signal_id": signal_id,
            }
            
            # Start workflow
            handle = await client.start_workflow(
                SignalIngestionWorkflow.run,
                args=[tenant_id, request.account_id, signal_data],
                id=workflow_id,
                task_queue="clientpulse-task-queue",
            )
            
            return CreateSignalResponse(
                signal_id=signal_id,
                workflow_id=workflow_id,
                status="workflow_started",
                message=f"Signal ingestion workflow started successfully"
            )
            
        except Exception as temporal_error:
            # If Temporal fails, still return success but note the issue
            return CreateSignalResponse(
                signal_id=signal_id,
                workflow_id=workflow_id,
                status="workflow_failed",
                message=f"Signal created but workflow failed: {str(temporal_error)}"
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create signal: {str(e)}")
