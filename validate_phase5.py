#!/usr/bin/env python3
"""Validation script for ClientPulse Phase 5 Build"""

import sys
import traceback

def test_imports():
    """Test all critical imports"""
    
    tests = [
        ("Config", lambda: __import__('src.config.settings')),
        ("Models", lambda: __import__('src.models.signal')),
        ("Firestore", lambda: __import__('src.db.firestore_client')),
        ("Vector Service", lambda: __import__('src.services.vector_service')),
        ("LLM Service", lambda: __import__('src.services.llm_service')),
        ("RBAC Service", lambda: __import__('src.services.rbac_service')),
        ("Workflows", lambda: __import__('src.workflows.signal_ingestion')),
        ("Activities", lambda: __import__('src.activities.opportunity_activities')),
        ("CRM Activities", lambda: __import__('src.activities.crm_activities')),
        ("Worker", lambda: __import__('src.workers.temporal_worker')),
        ("API Routers", lambda: __import__('src.api.routers')),
    ]
    
    print("=" * 60)
    print("ClientPulse Phase 5 Module Validation")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for name, import_func in tests:
        try:
            import_func()
            print(f"✓ {name:<20} OK")
            passed += 1
        except Exception as e:
            print(f"✗ {name:<20} FAILED: {str(e)[:50]}")
            failed += 1
            traceback.print_exc()
    
    print("=" * 60)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 60)
    
    return failed == 0


def test_file_structure():
    """Test that all critical files exist"""
    import os
    
    files = [
        "src/config/settings.py",
        "src/services/vector_service.py",
        "src/services/rbac_service.py",
        "src/services/llm_service.py",
        "src/workflows/signal_ingestion.py",
        "src/workflows/opportunity_discovery.py",
        "src/workflows/crm_activation.py",
        "src/workflows/review_await.py",
        "src/activities/crm_activities.py",
        "src/activities/opportunity_activities.py",
        "src/workers/temporal_worker.py",
        "src/models/account.py",
        "src/models/signal.py",
        "src/models/opportunity.py",
    ]
    
    print("\nFile Structure Check:")
    print("-" * 60)
    
    all_exist = True
    for fpath in files:
        exists = os.path.exists(fpath)
        status = "✓" if exists else "✗"
        print(f"{status} {fpath}")
        if not exists:
            all_exist = False
    
    print("-" * 60)
    return all_exist


if __name__ == "__main__":
    print("\nPhase 5 Build Validation\n")
    
    files_ok = test_file_structure()
    imports_ok = test_imports()
    
    if files_ok and imports_ok:
        print("\n✓ All validation checks passed!")
        print("\nReady for Temporal worker startup:")
        print("  1. Start Temporal: temporal server start-dev")
        print("  2. Run worker: python src/workers/temporal_worker.py")
        print("  3. Run API: python main.py")
        sys.exit(0)
    else:
        print("\n✗ Validation failed. Please fix errors above.")
        sys.exit(1)
