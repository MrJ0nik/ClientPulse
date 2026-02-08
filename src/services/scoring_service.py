"""Scoring Service with Feedback Loop & Decay Factor"""
import logging
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from src.db.firestore_client import get_firestore_client
import math

logger = logging.getLogger(__name__)


class RejectionHistory:
    """Model for storing rejection history"""
    
    def __init__(self, account_id: str, theme: str, rejected_at: datetime):
        self.account_id = account_id
        self.theme = theme
        self.rejected_at = rejected_at


class ScoringService:
    """Service for opportunity scoring with feedback loop and decay factor"""
    
    # Source reliability weights
    SOURCE_RELIABILITY = {
        "sec_filing_10k": 0.95,
        "sec_filing_8k": 0.93,
        "earnings_call": 0.90,
        "press_release": 0.85,
        "news": 0.70,
        "job_posting": 0.75,
        "insider_trade": 0.88,
        "patent_filing": 0.80,
        "m_a": 0.92,
        "social_media": 0.50,
        "internal_crm": 1.0,
        "internal_project": 0.95,
    }
    
    # Decay parameters
    DECAY_HALF_LIFE = 30  # days
    MAX_REJECTION_WEIGHT = 0.3  # Max 30% penalty
    
    def __init__(self):
        self.db = get_firestore_client()
    
    async def get_rejection_history(
        self,
        tenant_id: str,
        account_id: str,
        theme: str,
    ) -> List[Dict[str, Any]]:
        """Get rejection history for (account_id, theme) pair"""
        try:
            if not self.db.available:
                return []
            
            rejections = self.db.get_documents(
                f"tenants/{tenant_id}/rejectionHistory",
                filters=[
                    ("account_id", "==", account_id),
                    ("theme", "==", theme),
                ]
            )
            return rejections
        except Exception as e:
            logger.error(f"Error fetching rejection history: {e}")
            return []
    
    async def record_rejection(
        self,
        tenant_id: str,
        account_id: str,
        opportunity_id: str,
        theme: str,
        reason: str,
        user_id: str,
    ) -> bool:
        """Record an opportunity rejection"""
        try:
            if not self.db.available:
                return False
            
            rejection_entry = {
                "account_id": account_id,
                "opportunity_id": opportunity_id,
                "theme": theme,
                "reason": reason,
                "user_id": user_id,
                "rejected_at": datetime.utcnow(),
                "timestamp": datetime.utcnow(),
            }
            
            # Store in Firestore
            self.db.db.collection(
                f"tenants/{tenant_id}/rejectionHistory"
            ).add(rejection_entry)
            
            logger.info(
                f"Recorded rejection: account={account_id}, "
                f"theme={theme}, reason={reason}"
            )
            return True
        except Exception as e:
            logger.error(f"Error recording rejection: {e}")
            return False
    
    def calculate_decay_factor(self, days_since_rejection: int) -> float:
        """
        Calculate decay factor (0.0-1.0) based on days since rejection.
        Starts at 1.0 (full penalty) and decays over 30 days.
        
        Formula: decay = 0.5 ^ (days / half_life)
        """
        if days_since_rejection < 0:
            return 0.0  # Future date, no decay
        
        # Exponential decay: 0.5^(days/30)
        decay = 0.5 ** (days_since_rejection / self.DECAY_HALF_LIFE)
        
        # After 30 days, penalty is 50% of original
        # After 60 days, penalty is 25% of original
        # After 90 days, penalty is negligible
        return max(0.0, min(1.0, decay))
    
    async def calculate_feedback_penalty(
        self,
        tenant_id: str,
        account_id: str,
        theme: str,
    ) -> float:
        """
        Calculate cumulative feedback penalty for (account_id, theme).
        Returns penalty factor (0.0-MAX_REJECTION_WEIGHT).
        """
        try:
            rejections = await self.get_rejection_history(
                tenant_id, account_id, theme
            )
            
            if not rejections:
                return 0.0  # No rejections, no penalty
            
            now = datetime.utcnow()
            total_penalty = 0.0
            
            # Sum penalties from all rejections (with decay)
            for rejection in rejections:
                rejected_at = rejection.get("rejected_at")
                if isinstance(rejected_at, str):
                    rejected_at = datetime.fromisoformat(rejected_at)
                
                days_since = (now - rejected_at).days
                decay = self.calculate_decay_factor(days_since)
                
                # Weight each rejection by its decay factor
                # First rejection: full weight, subsequent: cumulative with decay
                rejection_weight = decay * (1.0 / max(len(rejections), 1))
                total_penalty += rejection_weight
            
            # Cap total penalty at MAX_REJECTION_WEIGHT (30%)
            return min(total_penalty, self.MAX_REJECTION_WEIGHT)
        except Exception as e:
            logger.error(f"Error calculating feedback penalty: {e}")
            return 0.0
    
    async def apply_feedback_penalty(
        self,
        score_breakdown: Dict[str, float],
        feedback_penalty: float,
    ) -> Dict[str, float]:
        """
        Apply feedback penalty to score breakdown.
        Penalty primarily affects Fit and Access factors (customer alignment).
        """
        if feedback_penalty <= 0:
            return score_breakdown
        
        adjusted = score_breakdown.copy()
        
        # Penalize Fit and Access most heavily (customer alignment)
        adjusted["fit"] = max(
            0,
            adjusted.get("fit", 50) * (1.0 - feedback_penalty * 0.8)
        )
        adjusted["access"] = max(
            0,
            adjusted.get("access", 50) * (1.0 - feedback_penalty * 0.6)
        )
        
        # Slightly penalize confidence (lower reliability for pattern match)
        adjusted["confidence"] = max(
            0,
            adjusted.get("confidence", 70) * (1.0 - feedback_penalty * 0.3)
        )
        
        logger.info(
            f"Applied feedback penalty {feedback_penalty:.2f}: "
            f"fit {score_breakdown.get('fit'):.0f} → {adjusted['fit']:.0f}, "
            f"access {score_breakdown.get('access'):.0f} → {adjusted['access']:.0f}"
        )
        
        return adjusted
    
    def get_source_reliability_weight(self, source_type: str) -> float:
        """Get reliability weight for source type"""
        return self.SOURCE_RELIABILITY.get(source_type, 0.60)
    
    async def apply_source_reliability(
        self,
        score_breakdown: Dict[str, float],
        source_type: str,
        cross_source_count: int = 1,
    ) -> Dict[str, float]:
        """
        Apply source reliability weight to confidence factor.
        If multiple sources confirm, boost confidence.
        """
        adjusted = score_breakdown.copy()
        
        base_reliability = self.get_source_reliability_weight(source_type)
        
        # Cross-source confirmation boost
        # 2 sources: +15%, 3+ sources: +25%
        cross_source_boost = {
            1: 1.0,
            2: 1.15,
            3: 1.25,
        }.get(min(cross_source_count, 3), 1.25)
        
        confidence = score_breakdown.get("confidence", 70)
        adjusted["confidence"] = min(
            100,
            confidence * base_reliability * cross_source_boost
        )
        
        logger.info(
            f"Applied source reliability ({source_type}={base_reliability:.2f}, "
            f"cross_source={cross_source_count}): "
            f"confidence {confidence:.0f} → {adjusted['confidence']:.0f}"
        )
        
        return adjusted
    
    async def calculate_final_score(
        self,
        score_breakdown: Dict[str, float],
    ) -> float:
        """
        Calculate final opportunity score from breakdown.
        Weighted average: Impact(25%) + Urgency(20%) + Fit(25%) + Access(15%) + Feasibility(15%)
        """
        weights = {
            "impact": 0.25,
            "urgency": 0.20,
            "fit": 0.25,
            "access": 0.15,
            "feasibility": 0.15,
        }
        
        final_score = 0.0
        for factor, weight in weights.items():
            value = score_breakdown.get(factor, 50)
            final_score += value * weight
        
        return round(final_score, 1)
    
    async def score_with_feedback(
        self,
        tenant_id: str,
        account_id: str,
        theme: str,
        source_type: str,
        base_score_breakdown: Dict[str, float],
        cross_source_count: int = 1,
    ) -> Dict[str, Any]:
        """
        Calculate final score with feedback loop and reliability adjustments.
        
        Returns:
            {
                "score": float,
                "score_breakdown": dict,
                "feedback_penalty": float,
                "source_reliability_boost": float,
            }
        """
        try:
            # Step 1: Apply source reliability
            adjusted = await self.apply_source_reliability(
                base_score_breakdown,
                source_type,
                cross_source_count,
            )
            
            # Step 2: Calculate and apply feedback penalty
            feedback_penalty = await self.calculate_feedback_penalty(
                tenant_id,
                account_id,
                theme,
            )
            
            adjusted = await self.apply_feedback_penalty(
                adjusted,
                feedback_penalty,
            )
            
            # Step 3: Calculate final score
            final_score = await self.calculate_final_score(adjusted)
            
            return {
                "score": final_score,
                "score_breakdown": adjusted,
                "feedback_penalty": feedback_penalty,
                "source_reliability": self.get_source_reliability_weight(source_type),
                "cross_source_count": cross_source_count,
            }
        except Exception as e:
            logger.error(f"Error in score_with_feedback: {e}")
            # Return base score on error
            score = await self.calculate_final_score(base_score_breakdown)
            return {
                "score": score,
                "score_breakdown": base_score_breakdown,
                "feedback_penalty": 0.0,
                "error": str(e),
            }


def get_scoring_service() -> ScoringService:
    """Get scoring service singleton"""
    return ScoringService()
