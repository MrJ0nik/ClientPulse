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
            
        # Load credentials from environment or file
        creds_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "clientpulse-d2383-firebase-adminsdk-fbsvc-0b1189726e.json")
        
        if os.path.exists(creds_path):
            credentials = service_account.Credentials.from_service_account_file(creds_path)
            self.db = firestore.Client(credentials=credentials, project="clientpulse-d2383")
        else:
            # Use default credentials for deployed environments
            self.db = firestore.Client(project="clientpulse-d2383")
        
        self._initialized = True
    
    def get_document(self, collection: str, document_id: str) -> Optional[Dict[str, Any]]:
        """Get a single document"""
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
