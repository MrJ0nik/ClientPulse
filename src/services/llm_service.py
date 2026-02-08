"""LLM Services"""
import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
import asyncio
import anthropic

from ..config import settings

logger = logging.getLogger(__name__)


@dataclass
class AnthropicConfig:
    """Anthropic configuration"""
    api_key: str
    model: str = "claude-3-5-sonnet-20241022"
    max_tokens: int = 2000
    temperature: float = 0.7


class AnthropicLLMService:
    """Anthropic Claude LLM Service"""

    def __init__(self, config: Optional[AnthropicConfig] = None):
        self.config = config or AnthropicConfig(api_key=settings.anthropic_api_key)
        self.client = anthropic.Anthropic(api_key=self.config.api_key)

    async def extract_entities(self, text: str) -> Dict[str, Any]:
        """Extract entities from text"""
        try:
            prompt = f"""Extract entities (names, organizations, locations) from this text:

{text}

Return JSON with: {{
    "entities": [{{"name": "...", "type": "..."}}, ...],
    "themes": ["theme1", "theme2"],
    "summary": "..."
}}"""

            message = await asyncio.to_thread(
                self.client.messages.create,
                model=self.config.model,
                max_tokens=1000,
                temperature=0.3,
                messages=[{"role": "user", "content": prompt}],
            )
            
            import json
            result_text = message.content[0].text
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0]
            result = json.loads(result_text.strip())
            return result
        except Exception as e:
            logger.error(f"Entity extraction error: {e}")
            return {"entities": [], "themes": [], "summary": ""}

    async def generate_narrative(self, title: str, evidence: List[Dict[str, Any]], company: Optional[str] = None) -> Dict[str, Any]:
        """Generate opportunity narrative"""
        try:
            evidence_text = "\n".join([f"- [{e.get('source', 'Unknown')}] {e.get('text', '')}" for e in evidence])
            
            prompt = f"""Generate a compelling business narrative for this opportunity:

Title: {title}
Company: {company or "N/A"}

Evidence:
{evidence_text}

Return JSON with: {{
    "title": "...",
    "narrative": "...",
    "key_points": ["point1", "point2"],
    "action_items": ["action1", "action2"]
}}"""

            message = await asyncio.to_thread(
                self.client.messages.create,
                model=self.config.model,
                max_tokens=1500,
                temperature=0.7,
                messages=[{"role": "user", "content": prompt}],
            )
            
            import json
            result_text = message.content[0].text
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0]
            result = json.loads(result_text.strip())
            return result
        except Exception as e:
            logger.error(f"Narrative generation error: {e}")
            return {"title": title, "narrative": "", "key_points": [], "action_items": []}

    async def classify_signal(self, signal: Dict[str, Any]) -> Dict[str, Any]:
        """Classify signal and extract themes using Claude"""
        try:
            prompt = f"""Classify this business signal:

{signal.get('text', '')}

Return JSON with: {{
    "themes": ["theme1", "theme2"],
    "entities": ["entity1", "entity2"],
    "summary": "...",
    "sentiment": "positive/negative/neutral",
    "confidence": 0.0-1.0
}}"""

            message = await asyncio.to_thread(
                self.client.messages.create,
                model=self.config.model,
                max_tokens=800,
                temperature=0.3,
                messages=[{"role": "user", "content": prompt}],
            )
            
            import json
            result_text = message.content[0].text
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0]
            result = json.loads(result_text.strip())
            return result
        except Exception as e:
            logger.error(f"Signal classification error: {e}")
            return {"themes": [], "entities": [], "summary": "", "sentiment": "neutral", "confidence": 0.0}

    async def score_opportunity(self, opportunity: Dict[str, Any]) -> Dict[str, Any]:
        """Score opportunity with LLM-enhanced analysis"""
        try:
            prompt = f"""Score this business opportunity:

Title: {opportunity.get('title', '')}
Description: {opportunity.get('description', '')}

Return JSON with: {{
    "score": 0-100,
    "score_breakdown": {{
        "impact": 0-100,
        "urgency": 0-100,
        "fit": 0-100,
        "access": 0-100,
        "feasibility": 0-100
    }},
    "reasoning": "..."
}}"""

            message = await asyncio.to_thread(
                self.client.messages.create,
                model=self.config.model,
                max_tokens=1000,
                temperature=0.5,
                messages=[{"role": "user", "content": prompt}],
            )
            
            import json
            result_text = message.content[0].text
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0]
            result = json.loads(result_text.strip())
            return result
        except Exception as e:
            logger.error(f"Opportunity scoring error: {e}")
            return {
                "score": 50.0,
                "score_breakdown": {"impact": 50, "urgency": 50, "fit": 50, "access": 50, "feasibility": 50},
                "reasoning": ""
            }


def create_llm_service(provider: str = "anthropic"):
    """Factory function for LLM service"""
    if provider.lower() == "anthropic":
        config = AnthropicConfig(api_key=settings.anthropic_api_key, model=settings.anthropic_model)
        return AnthropicLLMService(config)
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")
