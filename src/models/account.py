from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class AccountCounters(BaseModel):
    """Account counter metrics"""
    model_config = ConfigDict(from_attributes=True)
    
    signals_count: int = 0
    opportunities_count: int = 0
    activities_count: int = 0


class AccountTrends(BaseModel):
    """Account trend information"""
    model_config = ConfigDict(from_attributes=True)
    
    signals_trend: Optional[float] = None
    opportunities_trend: Optional[float] = None
    conversion_rate: Optional[float] = None


class Account(BaseModel):
    """Account model"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    tenant_id: str
    name: str
    industry: Optional[str] = None
    website: Optional[str] = None
    annual_revenue: Optional[float] = None
    employee_count: Optional[int] = None
    owner_am_id: Optional[str] = None
    owner_am_name: Optional[str] = None
    status: Optional[str] = Field(default="active")
    counters: AccountCounters = Field(default_factory=AccountCounters)
    trends: AccountTrends = Field(default_factory=AccountTrends)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class AccountView(BaseModel):
    """Account view for dashboards"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    tenant_id: str
    name: str
    industry: Optional[str] = None
    signals_count: int = 0
    opportunities_count: int = 0
    pending_signals: int = 0
    pending_opportunities: int = 0
    high_priority_signals: int = 0
    pipeline_value: Optional[float] = None
    counters: AccountCounters = Field(default_factory=AccountCounters)
    trends: AccountTrends = Field(default_factory=AccountTrends)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
