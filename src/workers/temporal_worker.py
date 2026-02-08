"""Temporal Worker for ClientPulse Workflows"""
import asyncio
import logging
from temporalio.client import Client
from temporalio.worker import Worker

# Workflows
from ..workflows.signal_ingestion import SignalIngestionWorkflow
from ..workflows.account_monitoring import AccountMonitoringWorkflow
from ..workflows.opportunity_discovery import OpportunityDiscoveryWorkflow
from ..workflows.review_await import ReviewAwaitWorkflow
from ..workflows.crm_activation import CRMActivationWorkflow

# Activities
from ..activities.monitoring_activities import news_search_activity
from ..activities.opportunity_activities import (
    create_opportunity_activity,
    activate_opportunity_crm_activity,
    update_signal_status_activity,
    notify_user_activity,
    retrieve_assets_activity,
    generate_card_activity,
)
from ..activities.crm_activities import (
    create_salesforce_task_activity,
    create_hubspot_task_activity,
    update_opportunity_status_activity,
)

logger = logging.getLogger(__name__)

TASK_QUEUE = "clientpulse-task-queue"


async def main():
    """Run Temporal worker"""
    print("=" * 60)
    print("Connecting to Temporal at localhost:7233...")
    try:
        client = await Client.connect("localhost:7233")
        print("✓ Connected to Temporal")
    except Exception as e:
        print(f"✗ Failed to connect: {e}")
        return

    print("Initializing Worker...")

    workflows = [
        SignalIngestionWorkflow,
        AccountMonitoringWorkflow,
        OpportunityDiscoveryWorkflow,
        ReviewAwaitWorkflow,
        CRMActivationWorkflow,
    ]
    
    activities = [
        # Monitoring
        news_search_activity,
        
        # Opportunity management
        create_opportunity_activity,
        activate_opportunity_crm_activity,
        update_signal_status_activity,
        notify_user_activity,
        retrieve_assets_activity,
        generate_card_activity,
        
        # CRM integration
        create_salesforce_task_activity,
        create_hubspot_task_activity,
        update_opportunity_status_activity,
    ]

    worker = Worker(
        client,
        task_queue=TASK_QUEUE,
        workflows=workflows,
        activities=activities,
    )

    print("=" * 60)
    print("✓✓✓ TEMPORAL WORKER CONFIGURATION ✓✓✓")
    print("=" * 60)
    print(f"Workflows Registered: {len(workflows)}")
    for wf in workflows:
        print(f"  - {wf.__name__}")
    print(f"\nActivities Registered: {len(activities)}")
    for act in activities:
        print(f"  - {act.__name__}")
    print(f"\nTask Queue: {TASK_QUEUE}")
    print("=" * 60)
    print("WORKER RUNNING - Press Ctrl+C to stop")
    print("=" * 60)
    
    try:
        await worker.run()
    except KeyboardInterrupt:
        print("\n✓ Worker shutdown requested")


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    asyncio.run(main())

