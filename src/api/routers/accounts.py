"""Accounts router API endpoints"""
from fastapi import APIRouter, HTTPException
from src.db.read_models import get_account_views_for_am, get_account_view
from src.api.schemas import AccountViewSchema
from src.db.firestore_client import get_firestore_client
from typing import List

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("", response_model=List[AccountViewSchema])
async def get_accounts(tenant_id: str):
    """Get all accounts for tenant"""
    try:
        accounts = get_account_views_for_am(tenant_id)
        return accounts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{account_id}", response_model=AccountViewSchema)
async def get_account(tenant_id: str, account_id: str):
    """Get single account"""
    try:
        account = get_account_view(tenant_id, account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        return account
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
