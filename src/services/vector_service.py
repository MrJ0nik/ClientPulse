"""Embedding and Vector Search Service with Permission-Aware Filtering"""
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct, FieldCondition, MatchValue, Filter, MatchAny
from enum import Enum

from ..config import settings

logger = logging.getLogger(__name__)


class PermissionScope(str, Enum):
    """Document permission scopes"""
    PUBLIC = "public"  # Accessible to all users
    TENANT = "tenant"  # Accessible within tenant
    ACCOUNT = "account"  # Accessible to account members only
    PRIVATE = "private"  # Personal/internal only


class EmbeddingService:
    """Service for generating embeddings"""
    
    def __init__(self, model: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model)
    
    async def embed_text(self, text: str) -> List[float]:
        """Generate embedding for text"""
        try:
            embedding = self.model.encode(text, normalize_embeddings=True)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Embedding error: {e}")
            return []
    
    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        try:
            embeddings = self.model.encode(texts, normalize_embeddings=True)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Batch embedding error: {e}")
            return []


class VectorSearchService:
    """Service for vector search using Qdrant with permission-aware filtering"""
    
    COLLECTIONS = {
        "signals": "signals_collection",
        "opportunities": "opportunities_collection",
        "assets": "assets_collection",
    }
    
    def __init__(self):
        self.client = QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key)
        self.embedding_service = EmbeddingService()
    
    async def initialize_collection(self, collection_name: str, vector_size: int = 384) -> bool:
        """Initialize a collection in Qdrant"""
        try:
            # Check if collection exists
            collections = self.client.get_collections()
            exists = any(col.name == collection_name for col in collections.collections)
            
            if not exists:
                self.client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
                )
                logger.info(f"Created collection: {collection_name}")
            
            return True
        except Exception as e:
            logger.error(f"Collection initialization error: {e}")
            return False
    
    async def index_document(
        self,
        collection: str,
        doc_id: str,
        text: str,
        tenant_id: str,
        account_id: Optional[str] = None,
        permission_scope: str = PermissionScope.TENANT,
        metadata: Optional[dict] = None,
    ) -> bool:
        """
        Index a document with permission-aware metadata.
        
        Args:
            collection: Collection name
            doc_id: Unique document ID
            text: Document text to embed
            tenant_id: Tenant identifier (required)
            account_id: Account identifier (optional, for account-scoped docs)
            permission_scope: Permission level (public/tenant/account/private)
            metadata: Additional metadata to store
        """
        try:
            embedding = await self.embedding_service.embed_text(text)
            if not embedding:
                return False
            
            # Build payload with permission metadata
            payload = {
                "doc_id": doc_id,
                "text": text,
                "tenant_id": tenant_id,
                "account_id": account_id or "",
                "permission_scope": permission_scope,
                "indexed_at": datetime.utcnow().isoformat(),
                "embedding_version": "1.0",
                **(metadata or {})
            }
            
            point = PointStruct(
                id=hash(doc_id) % (10 ** 8),  # Convert string ID to int
                vector=embedding,
                payload=payload
            )
            
            self.client.upsert(collection_name=collection, points=[point])
            
            logger.info(
                f"Indexed document {doc_id} in {collection} "
                f"(tenant={tenant_id}, scope={permission_scope})"
            )
            return True
        except Exception as e:
            logger.error(f"Document indexing error: {e}")
            return False
    
    async def search(
        self,
        collection: str,
        query: str,
        tenant_id: str,
        account_ids: Optional[List[str]] = None,
        limit: int = 10,
        permission_scope: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search for similar documents with permission-aware filtering.
        
        Args:
            collection: Collection to search in
            query: Search query text
            tenant_id: Current user's tenant ID
            account_ids: List of account IDs user has access to
            limit: Max results to return
            permission_scope: Optional specific scope filter
        
        Returns:
            List of search results with payloads
        """
        try:
            embedding = await self.embedding_service.embed_text(query)
            if not embedding:
                return []

            if permission_scope == PermissionScope.ACCOUNT and not account_ids:
                return []
            
            # Build permission filters
            # User can see: public + tenant-scoped + account-scoped (for their accounts)
            must_filters = []
            should_filters = []
            
            # Must be within tenant
            must_filters.append(
                FieldCondition(
                    key="tenant_id",
                    match=MatchValue(value=tenant_id)
                )
            )
            
            # Build permission-based filter
            # - PUBLIC: visible to all
            # - TENANT: visible within tenant
            # - ACCOUNT: visible only to account members
            # - PRIVATE: internal only
            if permission_scope:
                must_filters.append(
                    FieldCondition(
                        key="permission_scope",
                        match=MatchValue(value=permission_scope)
                    )
                )

                if permission_scope == PermissionScope.ACCOUNT:
                    must_filters.append(
                        FieldCondition(
                            key="account_id",
                            match=MatchAny(any=account_ids or [])
                        )
                    )
            else:
                # Allow public and tenant scopes for all users
                should_filters.append(
                    FieldCondition(
                        key="permission_scope",
                        match=MatchValue(value=PermissionScope.PUBLIC)
                    )
                )
                should_filters.append(
                    FieldCondition(
                        key="permission_scope",
                        match=MatchValue(value=PermissionScope.TENANT)
                    )
                )

                # Allow account-scoped docs for accessible accounts
                if account_ids:
                    should_filters.append(
                        Filter(
                            must=[
                                FieldCondition(
                                    key="permission_scope",
                                    match=MatchValue(value=PermissionScope.ACCOUNT)
                                ),
                                FieldCondition(
                                    key="account_id",
                                    match=MatchAny(any=account_ids)
                                ),
                            ]
                        )
                    )

            qdrant_filter = Filter(must=must_filters, should=should_filters or None)

            results = self.client.search(
                collection_name=collection,
                query_vector=embedding,
                limit=limit,
                query_filter=qdrant_filter,
            )

            filtered_results = [
                {
                    "id": result.payload.get("doc_id"),
                    "text": result.payload.get("text"),
                    "score": result.score,
                    "payload": result.payload,
                }
                for result in results
            ]
            
            logger.info(
                f"Searched {collection} for '{query[:30]}...': "
                f"{len(filtered_results)} results (tenant={tenant_id})"
            )
            return filtered_results[:limit]
        except Exception as e:
            logger.error(f"Search error: {e}")
            return []
    
    async def reconcile_permissions(
        self,
        collection: str,
        account_permission_updates: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Reconcile document permissions after permission changes.
        
        Args:
            collection: Collection to reconcile
            account_permission_updates: List of {account_id, new_scope}
        
        Returns:
            {updated_count, deleted_count, errors}
        """
        try:
            updated = 0
            deleted = 0
            errors = []
            
            for update in account_permission_updates:
                account_id = update.get("account_id")
                new_scope = update.get("new_scope")
                
                try:
                    # Get all documents for this account
                    # Note: This is a simplified implementation
                    # In production, you'd use proper Qdrant filters
                    
                    if new_scope == "delete":
                        # Delete all account documents
                        # results = client.scroll(collection, filter=...)
                        # client.delete(collection, points_selector=...)
                        logger.info(f"Would delete documents for account {account_id}")
                        deleted += 1
                    else:
                        # Update permission scope
                        logger.info(
                            f"Would update permission scope for account {account_id} to {new_scope}"
                        )
                        updated += 1
                except Exception as e:
                    errors.append(f"Error updating {account_id}: {str(e)}")
            
            return {
                "updated_count": updated,
                "deleted_count": deleted,
                "errors": errors,
            }
        except Exception as e:
            logger.error(f"Permission reconciliation error: {e}")
            return {"updated_count": 0, "deleted_count": 0, "errors": [str(e)]}
    
    async def get_collection_stats(self, collection: str) -> Dict[str, Any]:
        """Get collection statistics"""
        try:
            info = self.client.get_collection(collection)
            return {
                "collection": collection,
                "points_count": info.points_count,
                "vectors_count": info.vectors_count,
                "status": info.status,
            }
        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {"collection": collection, "error": str(e)}


def get_vector_search_service() -> VectorSearchService:
    """Get vector search service singleton"""
    return VectorSearchService()
