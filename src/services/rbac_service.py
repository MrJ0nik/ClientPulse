"""Role-Based Access Control Service"""
import logging
from enum import Enum
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class Role(str, Enum):
    """User roles in the system"""
    ADMIN = "admin"
    ACCOUNT_MANAGER = "account_manager"
    OPERATIONS = "operations"
    VIEWER = "viewer"


class Permission(str, Enum):
    """Available permissions"""
    # Account management
    VIEW_ACCOUNTS = "view:accounts"
    MANAGE_ACCOUNTS = "manage:accounts"
    
    # Opportunity management
    VIEW_OPPORTUNITIES = "view:opportunities"
    CREATE_OPPORTUNITIES = "create:opportunities"
    APPROVE_OPPORTUNITIES = "approve:opportunities"
    REJECT_OPPORTUNITIES = "reject:opportunities"
    REFINE_OPPORTUNITIES = "refine:opportunities"
    
    # CRM activation
    ACTIVATE_OPPORTUNITIES = "activate:opportunities"
    VIEW_ACTIVATION_HISTORY = "view:activation_history"
    
    # Audit and admin
    VIEW_AUDIT_LOGS = "view:audit_logs"
    MANAGE_SETTINGS = "manage:settings"
    MANAGE_USERS = "manage:users"


class RBACService:
    """Role-based access control service"""
    
    ROLE_PERMISSIONS: Dict[Role, List[Permission]] = {
        Role.ADMIN: [
            Permission.VIEW_ACCOUNTS,
            Permission.MANAGE_ACCOUNTS,
            Permission.VIEW_OPPORTUNITIES,
            Permission.CREATE_OPPORTUNITIES,
            Permission.APPROVE_OPPORTUNITIES,
            Permission.REJECT_OPPORTUNITIES,
            Permission.REFINE_OPPORTUNITIES,
            Permission.ACTIVATE_OPPORTUNITIES,
            Permission.VIEW_ACTIVATION_HISTORY,
            Permission.VIEW_AUDIT_LOGS,
            Permission.MANAGE_SETTINGS,
            Permission.MANAGE_USERS,
        ],
        Role.ACCOUNT_MANAGER: [
            Permission.VIEW_ACCOUNTS,
            Permission.VIEW_OPPORTUNITIES,
            Permission.CREATE_OPPORTUNITIES,
            Permission.APPROVE_OPPORTUNITIES,
            Permission.REJECT_OPPORTUNITIES,
            Permission.REFINE_OPPORTUNITIES,
            Permission.VIEW_ACTIVATION_HISTORY,
            Permission.VIEW_AUDIT_LOGS,
        ],
        Role.OPERATIONS: [
            Permission.VIEW_ACCOUNTS,
            Permission.VIEW_OPPORTUNITIES,
            Permission.CREATE_OPPORTUNITIES,
            Permission.ACTIVATE_OPPORTUNITIES,
            Permission.VIEW_ACTIVATION_HISTORY,
            Permission.VIEW_AUDIT_LOGS,
        ],
        Role.VIEWER: [
            Permission.VIEW_ACCOUNTS,
            Permission.VIEW_OPPORTUNITIES,
            Permission.VIEW_AUDIT_LOGS,
        ],
    }
    
    @classmethod
    def has_permission(cls, role: Role, permission: Permission) -> bool:
        """Check if role has permission"""
        return permission in cls.ROLE_PERMISSIONS.get(role, [])
    
    @classmethod
    def has_any_permission(cls, role: Role, permissions: List[Permission]) -> bool:
        """Check if role has any of the permissions"""
        role_perms = cls.ROLE_PERMISSIONS.get(role, [])
        return any(p in role_perms for p in permissions)
    
    @classmethod
    def has_all_permissions(cls, role: Role, permissions: List[Permission]) -> bool:
        """Check if role has all permissions"""
        role_perms = cls.ROLE_PERMISSIONS.get(role, [])
        return all(p in role_perms for p in permissions)
    
    @classmethod
    def get_role_permissions(cls, role: Role) -> List[Permission]:
        """Get all permissions for a role"""
        return cls.ROLE_PERMISSIONS.get(role, [])


def get_rbac_service() -> RBACService:
    """Get RBAC service instance"""
    return RBACService()
