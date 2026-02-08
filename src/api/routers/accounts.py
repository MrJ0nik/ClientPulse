"""Accounts router API endpoints"""
from fastapi import APIRouter, HTTPException, Depends, Body
from temporalio.client import Client
from pydantic import BaseModel
from typing import List, Optional
import uuid

router = APIRouter(prefix="/v1/accounts", tags=["accounts"])


class RunMonitoringRequest(BaseModel):
    account_id: Optional[str] = None
    immediate: bool = True


class RunMonitoringResponse(BaseModel):
    workflow_id: str
    status: str
    message: str


def get_tenant_id():
    return "tenant-demo"


async def get_temporal_client() -> Client:
    """Get Temporal client connection"""
    try:
        return await Client.connect("localhost:7233")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Temporal unavailable: {str(e)}")


@router.post("/monitoring/run", response_model=RunMonitoringResponse)
async def run_account_monitoring(
    request: RunMonitoringRequest = Body(...),
    tenant_id: str = Depends(get_tenant_id),
):
    """Start AccountMonitoringWorkflow for specific account"""
    try:
        # Use provided account_id or default
        account_id = request.account_id if request.account_id else "default-account"
        
        workflow_id = f"account-monitoring-{account_id}-{uuid.uuid4().hex[:8]}"
        
        client = await get_temporal_client()
        
        # Import workflow
        from src.workflows.account_monitoring import AccountMonitoringWorkflow
        
        # Start workflow with required parameters
        handle = await client.start_workflow(
            AccountMonitoringWorkflow.run,
            args=[
                tenant_id,  # tenant_id
                account_id,  # account_id
                "TechCorp Industries",  # company_name (mock)
                "",  # query (optional)
                3  # top_n
            ],
            id=workflow_id,
            task_queue="clientpulse-task-queue",
        )
        
        return RunMonitoringResponse(
            workflow_id=workflow_id,
            status="started",
            message=f"Account monitoring started for {account_id}"
        )
        
    except Exception as e:
        print(f"Monitoring error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start monitoring: {str(e)}"
        )
