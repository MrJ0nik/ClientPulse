"""Temporal activities for opportunity operations"""
from datetime import datetime
from typing import List, Dict, Any, Optional
from temporalio import activity
from src.db.firestore_client import get_firestore_client
from src.db.read_models import get_signal, get_account_view
from src.services.vector_service import get_vector_search_service
from src.services.llm_service import create_llm_service
from src.services.scoring_service import get_scoring_service
import asyncio
import logging

logger = logging.getLogger(__name__)


@activity.defn
async def create_opportunity_activity(
    tenant_id: str,
    account_id: str,
    signal_id: str,
    card: Optional[Dict[str, Any]] = None,
    workflow_run_id: Optional[str] = None
) -> Dict[str, Any]:
    """Create opportunity from signal with LLM-generated card data"""
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
        
        # Base opportunity document
        opportunity_doc = {
            "account_id": account_id,
            "tenant_id": tenant_id,
            "account_name": account_name,
            "status": "draft",  # Initial status (standardized lowercase)
            "opportunity_type": "new_business",
            "signal_id": signal_id,
            "signal_ids": [signal_id],
            "source_url": signal.get("source_url"),
            "assigned_to": None,
            "crm_status": None,
            "crm_activated_at": None,
            "workflow_run_id": workflow_run_id,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "version": 1,
        }
        
        # Merge card data if provided (LLM-generated content)
        if card:
            opportunity_doc.update({
                "title": card.get("title", f"Opportunity: {signal.get('title', 'Generated')}"),
                "summary": card.get("summary", ""),
                "what_happened": card.get("what_happened", ""),
                "why_it_matters": card.get("why_it_matters", ""),
                "suggested_offer": card.get("suggested_offer", ""),
                "theme": card.get("theme", "opportunity"),
                "pains": card.get("pains", []),
                "offers": card.get("offers", []),
                "next_steps": card.get("next_steps", []),
                "stakeholder_hints": card.get("stakeholder_hints", []),
                "score": card.get("score", 50),
                "score_breakdown": card.get("score_breakdown", {}),
                "confidence_score": card.get("score", 50) / 100.0,  # Normalize to 0-1
                "evidence_refs": card.get("evidence_refs", []),
                "asset_refs": card.get("asset_refs", []),
                "draft_outreach": card.get("draft_outreach", {}),
                "proof": card.get("proof", ""),
            })
        else:
            # Fallback if no card provided
            opportunity_doc.update({
                "title": f"Opportunity: {signal.get('title', 'Generated Opportunity')}",
                "summary": signal.get("description", ""),
                "status": "pending",
                "score": 50,
                "score_breakdown": {
                    "impact": 50,
                    "urgency": 50,
                    "fit": 50,
                    "access": 50,
                    "feasibility": 50,
                },
                "confidence_score": 0.5,
                "next_steps": [
                    "Review opportunity details",
                    "Assess fit with account strategy",
                    "Prepare pitch deck"
                ],
            })
        
        # Save to Firestore
        opp_ref = db.db.collection(
            f"tenants/{tenant_id}/accounts/{account_id}/opportunities"
        ).add(opportunity_doc)
        
        opp_id = opp_ref[1].id if isinstance(opp_ref, tuple) else opp_ref.id
        opportunity_doc["id"] = opp_id
        
        logger.info(f"Created opportunity {opp_id} from signal {signal_id} with score {opportunity_doc.get('score', 'N/A')}")
        
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


@activity.defn
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

@activity.defn

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


@activity.defn
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


@activity.defn
async def generate_card_activity(
    tenant_id: str,
    account_id: str,
    account_name: str,
    signal_id: str,
    signal_title: str,
    signal_summary: str,
    assets: List[Dict[str, Any]],
    source_type: str = "news",
    workflow_run_id: Optional[str] = None
) -> Dict[str, Any]:
    """Generate opportunity card using LLM with feedback loop scoring"""
    try:
        llm_service = create_llm_service()
        scoring_service = get_scoring_service()
        
        # Extract themes from signal summary
        entities_result = await llm_service.extract_entities(signal_summary)
        themes = entities_result.get("themes", [])
        primary_theme = themes[0] if themes else "opportunity"
        
        # Build evidence from assets
        evidence_text = "\n".join([
            f"- {asset.get('text', 'Unknown asset')}"
            for asset in assets[:5]  # Use top 5 assets
        ])
        
        if not evidence_text:
            evidence_text = "No prior assets found, new opportunity area"
        
        # Generate narrative
        narrative_result = await llm_service.generate_narrative(
            title=signal_title,
            evidence=evidence_text,
            company=account_name
        )
        
        # Get base score from LLM scoring (before feedback loop)
        score_result = await llm_service.score_opportunity({
            "title": signal_title,
            "description": signal_summary,
        })
        
        base_score_breakdown = score_result.get("score_breakdown", {
            "impact": 65,
            "urgency": 60,
            "fit": 65,
            "access": 55,
            "feasibility": 70,
        })
        
        # Apply feedback loop and decay factors
        scored = await scoring_service.score_with_feedback(
            tenant_id=tenant_id,
            account_id=account_id,
            theme=primary_theme,
            source_type=source_type,
            base_score_breakdown=base_score_breakdown,
            cross_source_count=1,
        )
        
        final_score = scored.get("score", 65.0)
        final_breakdown = scored.get("score_breakdown", base_score_breakdown)
        feedback_penalty = scored.get("feedback_penalty", 0.0)
        
        logger.info(
            f"Generated card for {signal_id}: "
            f"base={base_score_breakdown.get('fit', 65):.0f}, "
            f"final={final_score:.1f}, "
            f"feedback_penalty={feedback_penalty:.2f}"
        )
        
        return {
            "success": True,
            "card": {
                "title": signal_title,
                "summary": signal_summary,
                "what_happened": narrative_result.get("narrative", ""),
                "why_it_matters": narrative_result.get("key_points", []),
                "suggested_offer": narrative_result.get("action_items", []),
                "score": final_score,
                "score_breakdown": final_breakdown,
                "themes": themes,
                "assets_used": len(assets),
                "feedback_penalty": feedback_penalty,
                "source_type": source_type,
            },
            "signal_id": signal_id,
            "workflow_run_id": workflow_run_id
        }
    except Exception as e:
        logger.error(f"Error generating card: {e}")
        return {
            "success": False,
            "error": str(e),
            "signal_id": signal_id,
            "workflow_run_id": workflow_run_id
        }

@activity.defn
async def retrieve_assets_activity(
    tenant_id: str,
    account_id: str,
    signal_id: str,
    themes: List[str],
    limit: int = 10,
    workflow_run_id: Optional[str] = None
) -> Dict[str, Any]:
    """Retrieve permission-aware relevant assets from vector store"""
    try:
        vector_service = get_vector_search_service()
        
        # Initialize collections
        await vector_service.initialize_collection("assets")
        
        assets = []
        
        # Search for assets with theme filtering + permission scoping
        for theme in themes:
            # Permission-aware search: only get assets visible to this tenant/account
            results = await vector_service.search(
                collection="assets",
                query=theme,
                tenant_id=tenant_id,
                account_ids=[account_id],  # Can access this account's assets
                limit=limit,
                permission_scope=None,  # Include all accessible scopes
            )
            assets.extend(results)
        
        # Deduplicate by doc_id
        seen = set()
        unique_assets = []
        for asset in assets:
            if asset.get("id") not in seen:
                seen.add(asset.get("id"))
                unique_assets.append(asset)
        
        logger.info(
            f"Retrieved {len(unique_assets)} permission-aware assets "
            f"for signal {signal_id} (tenant={tenant_id}, account={account_id})"
        )
        
        return {
            "success": True,
            "assets": unique_assets[:limit],
            "asset_count": len(unique_assets),
            "signal_id": signal_id,
            "workflow_run_id": workflow_run_id
        }
    except Exception as e:
        logger.error(f"Error retrieving assets: {e}")
        return {
            "success": True,  # Don't fail workflow on asset retrieval error
            "assets": [],
            "asset_count": 0,
            "error": str(e),
            "workflow_run_id": workflow_run_id
        }

@activity.defn
async def generate_outreach_variants_activity(
    tenant_id: str,
    account_id: str,
    opportunity_id: str,
    opportunity_title: str,
    opportunity_summary: str,
    account_name: str,
    stakeholder_hints: Optional[List[str]] = None,
    workflow_run_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate multiple outreach variants (email, call, LinkedIn) using LLM.
    
    Returns:
        {
            "success": bool,
            "variants": [
                {
                    "channel": "email" | "call" | "linkedin",
                    "subject": str,
                    "body": str,
                    "tone": str,
                    "call_to_action": str,
                }
            ],
        }
    """
    try:
        llm_service = create_llm_service()
        
        stakeholders_text = (
            f"Key stakeholders: {', '.join(stakeholder_hints)}" 
            if stakeholder_hints else ""
        )
        
        prompt = f"""Generate 3 outreach variants for this opportunity. 
For each variant, choose a different channel and tone.

Opportunity: {opportunity_title}
Summary: {opportunity_summary}
Company: {account_name}
{stakeholders_text}

Return JSON with:
{{
    "variants": [
        {{
            "channel": "email" | "call" | "linkedin",
            "tone": "professional" | "casual" | "urgent",
            "subject": "...",
            "body": "...",
            "duration_minutes": 5-15,
            "call_to_action": "..."
        }},
        ...
    ]
}}"""

        message = await asyncio.to_thread(
            llm_service.client.messages.create,
            model=llm_service.config.model,
            max_tokens=1500,
            temperature=0.6,
            messages=[{"role": "user", "content": prompt}],
        )
        
        import json
        result_text = message.content[0].text
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0]
        result = json.loads(result_text.strip())
        
        variants = result.get("variants", [])
        
        logger.info(
            f"Generated {len(variants)} outreach variants "
            f"for opportunity {opportunity_id} (channels: "
            f"{', '.join([v.get('channel', 'unknown') for v in variants])})"
        )
        
        return {
            "success": True,
            "variants": variants,
            "variant_count": len(variants),
            "opportunity_id": opportunity_id,
            "workflow_run_id": workflow_run_id
        }
    except Exception as e:
        logger.error(f"Error generating outreach variants: {e}")
        return {
            "success": False,
            "error": str(e),
            "variants": [],
            "variant_count": 0,
            "opportunity_id": opportunity_id,
            "workflow_run_id": workflow_run_id
        }