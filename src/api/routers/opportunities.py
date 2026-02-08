"""Opportunity card routes"""

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Body
from typing import Optional
from datetime import datetime
from temporalio.client import Client
from pydantic import BaseModel
from src.db.firestore_client import FirestoreClient
from src.services.scoring_service import get_scoring_service
from src.audit.audit_service import get_audit_service
import asyncio

router = APIRouter(prefix="/v1/opportunities", tags=["opportunities"])


# Schemas
class ApproveRequest(BaseModel):
    comment: Optional[str] = None


class RejectRequest(BaseModel):
    reason: str
    comment: Optional[str] = None


class RefineRequest(BaseModel):
    feedback: str
    refinements: Optional[dict] = None


# Mock authentication - replace with real auth
def get_current_user():
    return {"id": "user-123", "email": "am@company.com"}


def get_tenant_id():
    return "tenant-demo"


async def get_temporal_client() -> Client:
    """Get Temporal client connection"""
    try:
        return await Client.connect("localhost:7233")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Temporal unavailable: {str(e)}")


def get_firestore():
    return FirestoreClient()


@router.get("")
async def list_opportunities(
    account_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    tenant_id: str = Depends(get_tenant_id),
    db: FirestoreClient = Depends(get_firestore),
):
    """List opportunities for tenant - from Firestore or mock data"""
    
    # Mock opportunities with LLM-generated content
    mock_opportunities = [
        {
            "id": "opp-001",
            "account_id": "acc-techcorp",
            "signal_id": "sig-001",
            "status": "draft",
            "review_workflow_id": "review-await-opp-001",
            "score": 85.5,
            "score_breakdown": {"impact": 90, "urgency": 80, "fit": 85, "access": 75, "feasibility": 88},
            "theme": "Strategic Partnership Expansion",
            "pains": ["Market entry complexity", "Regulatory compliance"],
            "offers": ["Local market expertise", "Established partnerships"],
            "next_steps": ["Schedule introductory call", "Prepare market analysis deck", "Draft partnership proposal"],
            "what_happened": "TechCorp announced a $50M Series C funding round led by Sequoia Capital",
            "why_it_matters": "Strong financial backing and clear intent to expand globally",
            "suggested_offer": "Go-to-market partnership leveraging established presence in 15 European countries",
            "proof": "LinkedIn job postings and TechCrunch Disrupt Berlin attendance",
            "evidence_refs": [
                {
                    "id": "ref-001",
                    "signal_id": "sig-001",
                    "title": "TechCorp Series C Funding Announcement",
                    "domain": "techcrunch.com",
                    "url": "https://techcrunch.com/2024/01/15/techcorp-series-c/",
                    "source_type": "news",
                    "snippet": "TechCorp raises $50M in Series C funding led by Sequoia Capital. The round brings the company's total valuation to $250M.",
                    "relevance_score": 0.92
                },
                {
                    "id": "ref-002",
                    "signal_id": "sig-001",
                    "title": "Key Insights: Why They're Expanding Global Operations",
                    "domain": "linkedin.com",
                    "url": "https://linkedin.com/pulse/techcorp-expansion-strategy",
                    "source_type": "article",
                    "snippet": "Strategic partnerships and geographic expansion are critical to our growth strategy. We're targeting European markets.",
                    "relevance_score": 0.88
                }
            ],
            "asset_refs": [],
            "stakeholder_hints": ["Sarah Chen (CFO)", "Michael Rodriguez (VP BizDev)"],
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": "opp-002",
            "account_id": "acc-dataflow",
            "signal_id": "sig-002",
            "status": "draft",
            "review_workflow_id": "review-await-opp-002",
            "score": 72.0,
            "score_breakdown": {"impact": 75, "urgency": 70, "fit": 80, "access": 65, "feasibility": 70},
            "theme": "Product Integration Opportunity",
            "pains": ["Data pipeline scalability", "Real-time processing"],
            "offers": ["Cloud-native infrastructure", "ML-powered optimization"],
            "next_steps": ["Research tech stack", "Identify mutual connections", "Prepare ROI calculator"],
            "what_happened": "DataFlow Inc posted 5 senior engineering roles",
            "why_it_matters": "Major technical transformation underway",
            "suggested_offer": "Real-time platform reduces costs by 40%",
            "proof": "Engineering blog and CEO tweets",
            "evidence_refs": [
                {
                    "id": "ref-003",
                    "signal_id": "sig-002",
                    "title": "DataFlow Hiring 5 Senior Engineering Positions",
                    "domain": "linkedin.com",
                    "url": "https://linkedin.com/jobs/view/dataflow-engineering-roles",
                    "source_type": "site",
                    "snippet": "DataFlow Inc is hiring 5 senior engineers for their cloud infrastructure team. Competitive salary and remote-first options.",
                    "relevance_score": 0.85
                },
                {
                    "id": "ref-004",
                    "signal_id": "sig-002",
                    "title": "DataFlow Engineering Blog - Q1 2024 Roadmap",
                    "domain": "dataflow.io",
                    "url": "https://blog.dataflow.io/2024-q1-roadmap",
                    "source_type": "article",
                    "snippet": "Our Q1 2024 engineering roadmap focuses on real-time processing, scalability, and ML integration.",
                    "relevance_score": 0.80
                }
            ],
            "asset_refs": [],
            "stakeholder_hints": ["Alex Kumar (CTO)"],
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": "opp-003",
            "account_id": "acc-retailgiant",
            "signal_id": "sig-003",
            "status": "approved",
            "review_workflow_id": "review-await-opp-003",
            "score": 78.5,
            "score_breakdown": {"impact": 85, "urgency": 75, "fit": 78, "access": 70, "feasibility": 82},
            "theme": "Digital Transformation Initiative",
            "pains": ["Legacy POS systems", "Omnichannel fragmentation"],
            "offers": ["Unified commerce platform", "AI-powered inventory"],
            "next_steps": ["Analyze earnings call", "Build comparison", "Draft executive summary"],
            "what_happened": "RetailGiant allocating $120M for digital transformation",
            "why_it_matters": "Committed budget with executive sponsorship",
            "suggested_offer": "Unified commerce platform with 25% conversion improvement",
            "proof": "CFO statement and LinkedIn activity",
            "evidence_refs": [
                {
                    "id": "ref-005",
                    "signal_id": "sig-003",
                    "title": "RetailGiant Q4 Earnings Call Transcript",
                    "domain": "retailgiant.com",
                    "url": "https://investor.retailgiant.com/earnings/q4-2023-transcript.pdf",
                    "source_type": "pdf",
                    "snippet": "We are allocating $120M for digital transformation initiatives in 2024. This includes new POS systems, omnichannel integration.",
                    "relevance_score": 0.90
                },
                {
                    "id": "ref-006",
                    "signal_id": "sig-003",
                    "title": "RetailGiant Digital Transformation Initiative Press Release",
                    "domain": "businesswire.com",
                    "url": "https://www.businesswire.com/news/home/retail-giant-digital-transformation",
                    "source_type": "news",
                    "snippet": "RetailGiant announces $120M investment in digital modernization to enhance customer experience across 2,000+ locations.",
                    "relevance_score": 0.87
                }
            ],
            "asset_refs": [],
            "stakeholder_hints": ["Jennifer Walsh (CFO)", "David Kim (IT Director)"],
            "created_at": datetime.utcnow().isoformat()
        }
    ]
    
    # Try to fetch from Firestore if available
    if db.available:
        try:
            collection_path = f"tenants/{tenant_id}/accounts"
            accounts = db.get_documents(collection_path)
            
            all_opportunities = []
            
            # Get opportunities from each account
            for account in accounts:
                acc_id = account.get("id", account.get("account_id"))
                opps_path = f"{collection_path}/{acc_id}/opportunities"
                
                filters = []
                if status:
                    filters.append(("status", "==", status))
                
                opps = db.get_documents(opps_path, filters=filters if filters else None)
                all_opportunities.extend(opps)
            
            # If we got results from Firestore, use them
            if all_opportunities:
                # Sort by created_at descending
                all_opportunities.sort(
                    key=lambda x: x.get("created_at", ""), 
                    reverse=True
                )
                
                # Apply pagination
                paginated = all_opportunities[offset:offset + limit]
                
                return {
                    "opportunities": paginated,
                    "total": len(all_opportunities),
                    "limit": limit,
                    "offset": offset,
                    "source": "firestore"
                }
        except Exception as e:
            print(f"Firestore query failed: {e}, falling back to mock data")
    
    # Return mock data as fallback
    return {
        "opportunities": mock_opportunities[offset:offset + limit],
        "total": len(mock_opportunities),
        "limit": limit,
        "offset": offset,
        "source": "mock"
    }


@router.get("/{opportunity_id}")
async def get_opportunity(
    opportunity_id: str = Path(..., description="Opportunity ID"),
    tenant_id: str = Depends(get_tenant_id),
    db: FirestoreClient = Depends(get_firestore),
):
    """Get opportunity card details from Firestore or mock data"""
    
    # Try to fetch from Firestore if available
    if db.available:
        try:
            # Query all accounts to find the opportunity
            collection_path = f"tenants/{tenant_id}/accounts"
            accounts = db.get_documents(collection_path)
            
            for account in accounts:
                acc_id = account.get("id", account.get("account_id"))
                opps_path = f"{collection_path}/{acc_id}/opportunities"
                opps = db.get_documents(opps_path, filters=[("id", "==", opportunity_id)])
                
                if opps and len(opps) > 0:
                    opportunity = opps[0]
                    opportunity["account_id"] = acc_id
                    return opportunity
        except Exception as e:
            print(f"Firestore error: {e}, falling back to mock")
    
    # Return mock data as fallback
    return {
        "id": opportunity_id,
        "account_id": "account-1",
        "account_name": "Sample Company",
        "status": "pending_review",
        "review_workflow_id": f"review-await-{opportunity_id}",
        "score": 75.0,
        "score_breakdown": {
            "impact": 80,
            "urgency": 70,
            "fit": 75,
            "access": 60,
            "feasibility": 85,
            "confidence": 75,
            "feedback_factor": 70,
        },
        "theme": "expansion",
        "summary": "Opportunity for market expansion",
        "what_happened": "Company announced new market entry",
        "why_it_matters": "Strategic expansion opportunity",
        "suggested_offer": "Partnership proposal",
        "proof": "Market analysis shows demand",
        "next_steps": ["Schedule meeting", "Prepare proposal"],
        "pains": ["Market entry complexity"],
        "offers": ["Market expertise", "Local partnerships"],
        "evidence_refs": [],
        "asset_refs": [],
        "stakeholder_hints": [],
        "draft_outreach": {},
        "signal_id": None,
        "workflow_state": "completed",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "version": 1,
        "source": "mock"
    }


@router.post("/{opportunity_id}/approve")
async def approve_opportunity(
    opportunity_id: str = Path(..., description="Opportunity ID"),
    request: ApproveRequest = Body(default=ApproveRequest()),
    tenant_id: str = Depends(get_tenant_id),
    current_user: dict = Depends(get_current_user),
):
    """Approve opportunity - sends signal to ReviewAwaitWorkflow"""
    try:
        # Get opportunity to find workflow_id
        # In real app: fetch from Firestore
        review_workflow_id = f"review-await-{opportunity_id}"
        
        # Connect to Temporal and send signal
        client = await get_temporal_client()
        
        handle = client.get_workflow_handle(review_workflow_id)
        
        # Send decision signal with approve action
        await handle.signal(
            "decision_signal",
            {
                "action": "approve",
                "reason": request.comment or "Approved",
                "user_id": current_user["id"],
                "timestamp": datetime.utcnow().isoformat(),
            }
        )
        
        return {
            "status": "approved",
            "opportunity_id": opportunity_id,
            "workflow_id": review_workflow_id,
            "message": "Approval signal sent successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to approve opportunity: {str(e)}"
        )


@router.post("/{opportunity_id}/reject")
async def reject_opportunity(
    opportunity_id: str = Path(..., description="Opportunity ID"),
    request: RejectRequest = Body(...),
    tenant_id: str = Depends(get_tenant_id),
    current_user: dict = Depends(get_current_user),
    db: FirestoreClient = Depends(get_firestore),
):
    """Reject opportunity - sends signal to ReviewAwaitWorkflow and records feedback"""
    try:
        review_workflow_id = f"review-await-{opportunity_id}"
        
        # Fetch opportunity to get theme and account_id
        account_id = None
        theme = None
        
        if db.available:
            try:
                collection_path = f"tenants/{tenant_id}/accounts"
                accounts = db.get_documents(collection_path)
                
                for account in accounts:
                    acc_id = account.get("id", account.get("account_id"))
                    opps_path = f"{collection_path}/{acc_id}/opportunities"
                    opps = db.get_documents(opps_path, filters=[("id", "==", opportunity_id)])
                    
                    if opps and len(opps) > 0:
                        opportunity = opps[0]
                        account_id = acc_id
                        theme = opportunity.get("theme", "unknown")
                        break
            except Exception as e:
                print(f"Error fetching opportunity for rejection tracking: {e}")
        
        # Record rejection in feedback loop (async, non-blocking)
        if account_id and theme:
            async def record_rejection_async():
                try:
                    scoring_service = get_scoring_service()
                    await scoring_service.record_rejection(
                        tenant_id=tenant_id,
                        account_id=account_id,
                        opportunity_id=opportunity_id,
                        theme=theme,
                        reason=request.reason,
                        user_id=current_user["id"],
                    )
                except Exception as e:
                    print(f"Error recording rejection feedback: {e}")
            
            # Fire and forget
            asyncio.create_task(record_rejection_async())
        
        # Send decision signal with reject action
        client = await get_temporal_client()
        handle = client.get_workflow_handle(review_workflow_id)
        
        await handle.signal(
            "decision_signal",
            {
                "action": "reject",
                "reason": request.reason,
                "user_id": current_user["id"],
                "timestamp": datetime.utcnow().isoformat(),
            }
        )
        
        return {
            "status": "rejected",
            "opportunity_id": opportunity_id,
            "workflow_id": review_workflow_id,
            "message": "Rejection signal sent successfully",
            "feedback_recorded": account_id is not None,
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reject opportunity: {str(e)}"
        )


@router.post("/{opportunity_id}/refine")
async def refine_opportunity(
    opportunity_id: str = Path(..., description="Opportunity ID"),
    request: RefineRequest = Body(...),
    tenant_id: str = Depends(get_tenant_id),
    current_user: dict = Depends(get_current_user),
):
    """Request refinement of opportunity card - sends signal to ReviewAwaitWorkflow"""
    try:
        review_workflow_id = f"review-await-{opportunity_id}"
        
        client = await get_temporal_client()
        handle = client.get_workflow_handle(review_workflow_id)
        
        # Send decision signal with refine action
        await handle.signal(
            "decision_signal",
            {
                "action": "refine",
                "reason": request.feedback,
                "user_id": current_user["id"],
                "timestamp": datetime.utcnow().isoformat(),
            }
        )
        
        return {
            "status": "refinement_requested",
            "opportunity_id": opportunity_id,
            "workflow_id": review_workflow_id,
            "message": "Refinement request signal sent successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to request refinement: {str(e)}"
        )
    return {"status": "refine_requested", "opportunity_id": opportunity_id}


@router.post("/{opportunity_id}/needs-more-evidence")
async def needs_more_evidence(
    opportunity_id: str = Path(...),
    tenant_id: str = Depends(get_tenant_id),
):
    """Mark opportunity as needing more evidence"""
    return {
        "status": "needs_more_evidence",
        "opportunity_id": opportunity_id,
        "message": "We'll fetch more evidence for this opportunity"
    }


@router.get("/{opportunity_id}/history")
async def get_opportunity_history(
    opportunity_id: str = Path(...),
    tenant_id: str = Depends(get_tenant_id),
):
    """Get opportunity history (audit trail)"""
    return {
        "opportunity_id": opportunity_id,
        "history": [],
    }

