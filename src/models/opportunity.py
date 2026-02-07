from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class OpportunityStatus(str, Enum):
    """Opportunity status"""
    PENDING = "pending"
    QUALIFIED = "qualified"
    ACTIVATED = "activated"
    WON = "won"
    LOST = "lost"


class OpportunityType(str, Enum):
    """Type of opportunity"""
    EXPANSION = "expansion"
    NEW_BUSINESS = "new_business"
    RETENTION = "retention"
    UPSELL = "upsell"
    CROSS_SELL = "cross_sell"


class Opportunity(BaseModel):
    """Opportunity model"""
    model_config = ConfigDict(from_attributes=True)
    
    id: Optional[str] = None
    account_id: str
    tenant_id: str
    account_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    status: OpportunityStatus = Field(default=OpportunityStatus.PENDING)
    opportunity_type: OpportunityType = Field(default=OpportunityType.NEW_BUSINESS)
    estimated_value: Optional[float] = None
    currency: Optional[str] = Field(default="USD")
    probability: Optional[float] = Field(default=0.5)
    signal_ids: List[str] = Field(default_factory=list)
    source_signals: List[Dict[str, Any]] = Field(default_factory=list)
    source_url: Optional[str] = None
    confidence_score: Optional[float] = None
    next_steps: List[str] = Field(default_factory=list)
    assigned_to: Optional[str] = None
    crm_status: Optional[str] = None
    crm_activated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class OpportunityCreate(BaseModel):
    """Schema for creating a new opportunity"""
    account_id: str
    tenant_id: str
    title: str
    description: Optional[str] = None
    opportunity_type: OpportunityType = Field(default=OpportunityType.NEW_BUSINESS)
    estimated_value: Optional[float] = None
    probability: Optional[float] = Field(default=0.5)
    signal_ids: List[str] = Field(default_factory=list)
    source_url: Optional[str] = None
    confidence_score: Optional[float] = None
    next_steps: List[str] = Field(default_factory=list)
