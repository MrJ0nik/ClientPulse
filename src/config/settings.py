"""Application settings"""
from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from .env"""
    
    # Google Cloud / Firestore
    google_cloud_project: str = "clientpulse-d2383"
    google_application_credentials: Optional[str] = None
    
    # Temporal
    temporal_host: str = "localhost:7233"
    temporal_namespace: str = "default"
    
    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: Optional[str] = None
    
    # OpenAI (embeddings)
    openai_api_key: Optional[str] = None
    
    # Anthropic (LLM)
    anthropic_api_key: Optional[str] = None
    anthropic_model: str = "claude-3-5-sonnet-20241022"
    llm_provider: str = "anthropic"
    
    # Salesforce
    salesforce_instance_url: Optional[str] = None
    salesforce_client_id: Optional[str] = None
    salesforce_client_secret: Optional[str] = None
    salesforce_username: Optional[str] = None
    salesforce_password: Optional[str] = None
    
    # HubSpot
    hubspot_api_key: Optional[str] = None
    
    # Application
    environment: str = "development"
    log_level: str = "INFO"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # Security
    jwt_secret: str = "dev-secret-change-in-production"
    encryption_key: str = "dev-encryption-key-32-characters"
    
    # Features
    enable_reconciliation_job: bool = False
    enable_audit_logging: bool = True
    enable_crm_sync: bool = False
    
    # CRM Configuration
    default_crm_system: str = "salesforce"
    crm_activation_retries: int = 3
    crm_activation_timeout_minutes: int = 5
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields from .env


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Module-level instance
settings = get_settings()

