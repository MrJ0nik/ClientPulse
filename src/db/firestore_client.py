"""Firestore client for database operations"""
import os
import json
from typing import Optional, List, Dict, Any
from google.cloud import firestore
from google.oauth2 import service_account

class FirestoreClient:
    """Firestore database client"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self.db = None
        self.available = False
        
        try:
            # Load credentials from environment or file
            creds_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "clientpulse-d2383-firebase-adminsdk-fbsvc-0b1189726e.json")
            
            if os.path.exists(creds_path):
                credentials = service_account.Credentials.from_service_account_file(creds_path)
                self.db = firestore.Client(credentials=credentials, project="clientpulse-d2383")
                self.available = True
                print(f"✓ Firestore initialized with credentials from {creds_path}")
            else:
                # Try default credentials for deployed environments
                self.db = firestore.Client(project="clientpulse-d2383")
                self.available = True
                print("✓ Firestore initialized with default credentials")
        except Exception as e:
            print(f"⚠ Firestore unavailable: {e} - will use mock data")
            self.available = False
            self.db = None
        
        self._initialized = True
    
    def get_document(self, collection: str, document_id: str) -> Optional[Dict[str, Any]]:
        """Get a single document"""
        if not self.available or not self.db:
            return None
            
        try:
            doc = self.db.collection(collection).document(document_id).get()
            if doc.exists:
                return {**doc.to_dict(), "id": doc.id}
            return None
        except Exception as e:
            print(f"Error getting document: {e}")
            return None
    
    def get_documents(self, collection: str, filters: Optional[List[tuple]] = None) -> List[Dict[str, Any]]:
        """Get multiple documents from collection"""
        if not self.available or not self.db:
            return []
            
        try:
            query = self.db.collection(collection)
            
            if filters:
                for field, operator, value in filters:
                    query = query.where(field, operator, value)
            
            docs = query.stream()
            return [{**doc.to_dict(), "id": doc.id} for doc in docs]
        except Exception as e:
            print(f"Error getting documents: {e}")
            return []
    
    def set_document(self, collection: str, document_id: str, data: Dict[str, Any], merge: bool = True) -> bool:
        """Create or update a document"""
        try:
            self.db.collection(collection).document(document_id).set(data, merge=merge)
            return True
        except Exception as e:
            print(f"Error setting document: {e}")
            return False
    
    def delete_document(self, collection: str, document_id: str) -> bool:
        """Delete a document"""
        try:
            self.db.collection(collection).document(document_id).delete()
            return True
        except Exception as e:
            print(f"Error deleting document: {e}")
            return False
    
    def batch_write(self, operations: List[tuple]) -> bool:
        """Execute batch write operations"""
        try:
            batch = self.db.batch()
            
            for op_type, collection, doc_id, data in operations:
                doc_ref = self.db.collection(collection).document(doc_id)
                if op_type == "set":
                    batch.set(doc_ref, data, merge=True)
                elif op_type == "delete":
                    batch.delete(doc_ref)
            
            batch.commit()
            return True
        except Exception as e:
            print(f"Error in batch write: {e}")
            return False


def get_firestore_client() -> FirestoreClient:
    """Get Firestore client singleton"""
    return FirestoreClient()


class FirestoreClientExtended(FirestoreClient):
    """Extended Firestore client with model-specific operations"""
    
    async def create_account(self, account) -> str:
        """Create account"""
        from ..models import Account
        data = account.model_dump(exclude_none=True)
        account_id = account.id or self.db.collection("accounts").document().id
        self.set_document("accounts", account_id, {**data, "id": account_id})
        return account_id
    
    async def get_account(self, tenant_id: str, account_id: str):
        """Get account"""
        from ..models import Account
        data = self.get_document("accounts", account_id)
        if data and data.get("tenant_id") == tenant_id:
            return Account(**data)
        return None
    
    async def create_signal(self, signal) -> str:
        """Create signal"""
        from ..models import Signal
        data = signal.model_dump(exclude_none=True, mode='json')
        signal_id = signal.id or self.db.collection("signals").document().id
        self.set_document("signals", signal_id, {**data, "id": signal_id})
        return signal_id
    
    async def get_signal(self, tenant_id: str, account_id: str, signal_id: str):
        """Get signal"""
        from ..models import Signal
        data = self.get_document("signals", signal_id)
        if data and data.get("tenant_id") == tenant_id:
            return Signal(**data)
        return None
    
    async def create_opportunity(self, opportunity) -> str:
        """Create opportunity"""
        from ..models import Opportunity
        data = opportunity.model_dump(exclude_none=True, mode='json')
        opp_id = opportunity.id or self.db.collection("opportunities").document().id
        self.set_document("opportunities", opp_id, {**data, "id": opp_id})
        return opp_id
    
    async def get_opportunity(self, tenant_id: str, account_id: str, opportunity_id: str):
        """Get opportunity"""
        from ..models import Opportunity
        data = self.get_document("opportunities", opportunity_id)
        if data and data.get("tenant_id") == tenant_id:
            return Opportunity(**data)
        return None
    
    async def update_opportunity_status(self, tenant_id: str, account_id: str, opportunity_id: str, status: str, version: int) -> bool:
        """Update opportunity status"""
        doc = self.get_document("opportunities", opportunity_id)
        if doc and doc.get("version") == version:
            self.set_document("opportunities", opportunity_id, {
                "status": status,
                "version": version + 1,
                "updated_at": firestore.SERVER_TIMESTAMP
            })
            return True
        return False
