"""Opportunity-related activities with LLM integration"""

import logging
from datetime import datetime
from temporalio import activity
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)


@activity.defn
async def classify_signal_with_llm_activity(
    tenant_id: str,
    account_id: str,
    signal_id: str,
    signal_text: Optional[str] = None,
) -> dict:
    """Classify signal and extract themes using LLM"""
    try:
        # Mock implementation - returns basic classification
        return {
            "themes": ["expansion", "partnership"],
            "entities": ["Company A", "Company B"],
            "summary": "Signal about business opportunity",
            "sentiment": "positive",
            "confidence": 0.85,
        }
    except Exception as e:
        logger.error(f"Signal classification activity failed: {str(e)}", exc_info=True)
        raise


@activity.defn
async def retrieve_evidence_refs_activity(
    tenant_id: str,
    account_id: str,
    signal_id: str,
    themes: list,
    summary: str = "",
    limit: int = 5,
) -> list:
    """
    Pull top chunks for this signal from Qdrant and format as EvidenceRef dicts.
    Returns list of dicts: {signal_id, chunk_id, snippet, relevance_score}
    """
    try:
        # Mock implementation
        evidence_refs = [
            {
                "signal_id": signal_id,
                "chunk_id": f"chunk-{i}",
                "snippet": f"Evidence snippet {i}",
                "excerpt": f"Evidence excerpt {i}",
                "relevance_score": 0.8 - (i * 0.1),
            }
            for i in range(limit)
        ]
        logger.info(f"Retrieved {len(evidence_refs)} evidence refs for signal {signal_id}")
        return evidence_refs
    except Exception as e:
        logger.error(f"Failed to retrieve evidence refs: {str(e)}", exc_info=True)
        return []


@activity.defn
async def retrieve_relevant_assets_activity(
    tenant_id: str, account_id: str, themes: list
) -> list:
    """Retrieve relevant assets using semantic search"""
    try:
        # Mock implementation
        return []
    except Exception as e:
        logger.error(f"Failed to retrieve assets: {str(e)}")
        return []


@activity.defn
async def match_playbook_activity(tenant_id: str, classification: dict) -> dict:
    """Match playbook based on classification"""
    try:
        # Mock implementation
        return {
            "playbook": None,
            "match_score": 0.0,
        }
    except Exception as e:
        logger.error(f"Failed to match playbook: {str(e)}")
        return {"playbook": None, "match_score": 0.0}


@activity.defn
async def generate_card_activity(
    tenant_id: str,
    account_id: str,
    signal_id: str,
    classification: dict,
    assets: list,
    playbook_match: dict,
    evidence: Optional[List[Dict[str, Any]]] = None,
) -> dict:
    """Generate opportunity card with LLM-generated narrative"""
    try:
        # Mock implementation - returns structured card
        card = {
            "signal_id": signal_id,
            "account_id": account_id,
            "status": "draft",
            "score": 75.0,
            "score_breakdown": {
                "impact": 80,
                "urgency": 70,
                "fit": 75,
                "access": 60,
                "feasibility": 85,
            },
            "theme": classification.get("themes", ["opportunity"])[0] if classification.get("themes") else "opportunity",
            "pains": ["Market entry complexity"],
            "offers": ["Market expertise", "Local partnerships"],
            "next_steps": [
                "Schedule stakeholder meeting",
                "Prepare market analysis",
                "Define partnership terms",
            ],
            "summary": "Opportunity for strategic expansion",
            "what_happened": "Company announced expansion plans into new market",
            "why_it_matters": "Strategic opportunity aligned with growth objectives",
            "suggested_offer": "Proposed partnership for market entry",
            "proof": "Market data shows strong demand",
            "evidence_refs": evidence or [],
            "asset_refs": [],
            "stakeholder_hints": ["CEO", "VP BizDev"],
            "draft_outreach": {},
        }
        return card
    except Exception as e:
        logger.error(f"Card generation failed: {str(e)}", exc_info=True)
        raise


@activity.defn
async def score_opportunity_activity(
    tenant_id: str, account_id: str, card_data: dict, source_types: list = None
) -> dict:
    """Score opportunity with LLM-enhanced scoring engine"""
    try:
        # Mock scoring
        score = 75.0
        return {
            "score": score,
            "score_breakdown": {
                "impact": 80,
                "urgency": 70,
                "fit": 75,
                "access": 60,
                "feasibility": 85,
                "confidence": 75,
                "feedback_factor": 70,
            },
        }
    except Exception as e:
        logger.error(f"Failed to score opportunity: {str(e)}")
        raise


@activity.defn
async def write_opportunity_activity(
    tenant_id: str, account_id: str, card_data: dict, step_key: str
) -> str:
    """Write opportunity to Firestore"""
    try:
        # Mock write - return generated ID
        opp_id = f"opp-{step_key}"
        logger.info(f"Wrote opportunity {opp_id}")
        return opp_id
    except Exception as e:
        logger.error(f"Failed to write opportunity: {str(e)}")
        raise


@activity.defn
async def update_read_models_activity(
    tenant_id: str,
    account_id: str,
    opp_id: str,
    card_data: dict,
    am_id: str = None,
) -> dict:
    """Update read models (AM inbox, account view) and log audit event"""
    try:
        logger.info(f"Updated read models for opportunity {opp_id}")
        return {"status": "updated", "am_id": am_id or "system"}
    except Exception as e:
        logger.error(f"Failed to update read models: {str(e)}")
        raise
