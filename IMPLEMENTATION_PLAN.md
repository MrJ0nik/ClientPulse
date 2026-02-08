# План реалізації ClientPulse

## Статус: ✅ Phase 1-2 (50%) завершена -核心компоненти + REST API + Read Models

### Що вже реалізовано

#### 1. Структура проекту ✅
- [x] Базова структура директорій
- [x] Конфігураційні файли (requirements.txt, pyproject.toml, .env.example)
- [x] Git ignore та базові налаштування

#### 2. Моделі даних ✅
- [x] Account, Signal, Opportunity, Asset, Playbook
- [x] Review, Comment, Event моделі
- [x] Pydantic моделі з валідацією
- [x] BaseEntity з tenant_id та versioning

#### 3. Firestore Integration ✅
- [x] FirestoreClient для CRUD операцій
- [x] Read models (AM Inbox, Account View, Dashboard aggregates)
- [x] Оптимістична конкуренція (version field)
- [x] Tenant isolation
- [x] Розширені read models: **AMInboxItem, AccountView, DashboardAggregates**
- [x] Методи для aggregation та reporting

#### 4. Qdrant Integration ✅
- [x] QdrantClient для semantic search
- [x] Embedding service (OpenAI)
- [x] Collection management
- [x] Permission-aware filtering

#### 5. Temporal Workflows ✅
- [x] AccountMonitoringWorkflow
- [x] SignalIngestionWorkflow
- [x] OpportunityDiscoveryWorkflow
- [x] ReviewAwaitWorkflow (human-in-the-loop)
- [x] CRMActivationWorkflow

#### 6. Activities ✅
- [x] Account activities
- [x] Signal activities (fetch, extract, dedupe, persist, index)
- [x] Opportunity activities (classify, retrieve, match, generate, score)
- [x] CRM activities (note, task, opportunity)

#### 7. Connectors ✅
- [x] Base connector interface
- [x] SEC connector
- [x] News connector
- [x] Jobs connector
- [x] Connector registry

#### 8. Processing ✅
- [x] Document processor (extract, chunk)
- [x] Entity extraction (базовий)
- [x] Theme detection (базовий)
- [x] Language detection

#### 9. Opportunity Engine ✅
- [x] OpportunityEngine для генерації карток
- [x] **Розширений ScoringService з повними факторами**: Impact, Urgency, Fit, Access, Feasibility, Confidence
- [x] Source reliability weights (SEC=0.95, news=0.60-0.85, etc)
- [x] Feedback loop з decay factor
- [x] Playbook matching
- [x] Outreach variant generation

#### 10. RBAC ✅
- [x] RBACService
- [x] Ролі та permissions
- [x] Account scoping
- [x] RBAC checks in API routers

#### 11. REST API ✅ (NEW)
- [x] **FastAPI application** з middleware (CORS, request ID, error handling)
- [x] **Inbox router**: GET /api/v1/inbox (з min_score filtering), GET /api/v1/inbox/stats
- [x] **Opportunities router**: 
  - GET /api/v1/opportunities/{id}
  - POST /api/v1/opportunities/{id}/approve
  - POST /api/v1/opportunities/{id}/reject
  - POST /api/v1/opportunities/{id}/refine
  - GET /api/v1/opportunities/{id}/history
- [x] **Accounts router**: GET /api/v1/accounts, GET /api/v1/accounts/{id}
- [x] **Search router**: GET /api/v1/search/opportunities, GET /api/v1/search/assets (scaffold)
- [x] **Health router**: GET /health
- [x] API schemas (Pydantic) для всіх request/response types
- [x] Auth middleware (dependency injection via get_current_user)
- [x] X-Tenant-ID header extraction

#### 12. Audit Service ✅ (NEW)
- [x] **AuditService** для compliance logging
- [x] AuditAction enum (VIEW, CREATE, UPDATE, APPROVE, REJECT, REFINE, ACTIVATE, DELETE)
- [x] Log методи з timestamp, user_id, entity type, old/new values, reason
- [x] get_logs(entity_id) та get_user_activity(user_id) для查詢

#### 13. Reconciliation Job ✅ (NEW)
- [x] **ReconciliationJob** з методами:
  - reconcile_embeddings: перевірка версій у Firestore vs Qdrant
  - reconcile_permissions: перевірка permission drift
  - reconcile_crm_state: синхронізація з CRM
  - check_stuck_workflows: алерти на stuck states > 1 год

#### 14. Infrastructure ✅
- [x] Temporal worker
- [x] Reconciliation job (розширений)
- [x] Docker compose для локального розгортання
- [x] main.py для запуску API via uvicorn
- [x] requirements.txt оновлено (FastAPI, uvicorn)

### Наступні кроки (Phase 4: 80% завершена - залишилось Priority 5)

#### Priority 5: Advanced Frontend Features ⏳

5. **Advanced Opportunity Management**
   - [ ] Opportunity detail view component
   - [ ] Account health dashboard (trends, risk flags)
   - [ ] Advanced search/filters (by score, date, source, status)
   - [ ] Bulk operations (approve/reject multiple)
   - [ ] CSV/PDF export functionality
   - [ ] Mobile-responsive design

#### Priority 1: Complete Workflows & Activities

1. **Temporal Workflows - доопрацювання**
   - [ ] Error handling + retries для всіх 5 workflows
   - [ ] Timeouts + escalation для ReviewAwait
   - [ ] CRM error state machine з manual retry
   - [ ] Workflow version management (blue/green deployment)

2. **Activities - интеграция**
   - [ ] Integrate ScoringService в OpportunityDiscoveryActivity
   - [ ] Integrate ReadModelService для update inbox/account views
   - [ ] Integrate AuditService для всіх ключових дій

#### Priority 2: Frontend & UI

3. **Frontend Scaffold (React)**
   - [ ] AM Inbox component (список opportunity cards)
   - [ ] Opportunity Card detail view (full narrative + outreach)
   - [ ] Review interface (approve/reject/refine buttons + modals)
   - [ ] Account health dashboard (trends, risk flags, top opps)
   - [ ] Firestore real-time listeners для live updates (P95 ≤ 2s)

#### Priority 3: LLM & Quality

4. **LLM Integration**
   - [ ] OpenAI GPT-4 для card narrative generation
   - [ ] LLM-based entity extraction (替换 regex-based)
   - [ ] LLM-based theme detection + scoring weights
   - [ ] Summary generation із evidence

5. **Document Processing**
   - [ ] Semantic chunking (замість fixed-size)
   - [ ] PDF parsing для SEC filings
   - [ ] HTML parsing покращення для news
   - [ ] Metadata extraction (dates, people, companies)

6. **CRM Integration**
   - [ ] Salesforce API (create task/opportunity, log note)
   - [ ] HubSpot API integration
   - [ ] Error handling + retries + exponential backoff
   - [ ] Reconciliation для CRM state via daily job

#### Priority 4: Observability & Testing ✅ (COMPLETE)

7. **Monitoring & Observability** ✅
   - [x] **Prometheus metrics** (40+ metrics):
     - [x] Workflow metrics (execution, duration, retries, active count)
     - [x] Activity metrics (execution, duration)
     - [x] CRM metrics (operations, latency)
     - [x] LLM metrics (operations, latency, tokens, cost)
     - [x] Firestore metrics (operations, latency, listeners)
     - [x] Error metrics (by type, service)
     - [x] Business metrics (opportunities, activations, scores)
     - [x] System health metrics (health score, connections)
   - [x] **Grafana dashboards** (6 panels: health, latency, errors, operations, resources)
   - [x] **Structured logging** (JSON output with correlation IDs)
   - [x] **Health checks** (5 components: Firestore, Temporal, Qdrant, OpenAI, Prometheus)
   - [x] **Alerts** (20+ rules: stuck workflows, error rate, latency, CRM errors, LLM errors, system health)
   - [x] **Alertmanager** configuration (Slack + PagerDuty routing)
   - [x] **Docker Compose stack** (Prometheus, Grafana, Alertmanager)
   - [x] **Complete documentation** (setup guide, integration guide, checklist)

8. **Testing**
   - [ ] Unit tests для models, services
   - [ ] Integration tests для workflows (mocked Firestore/Qdrant)
   - [ ] E2E tests для critical flows (signal → card → approval)
   - [ ] Load testing (K6/Locust)
   - [ ] OpenAPI docs auto-generated від FastAPI

9. **Security**
   - [ ] PII redaction в ingestion (email, phone patterns)
   - [ ] Encryption at rest (Firestore native, Qdrant if supported)
   - [ ] Rate limiting per AM
   - [ ] Input validation (OWASP)
   - [ ] CORS configuration (remove "*" in prod)

10. **Performance**
    - [ ] Redis caching layer (account views, assets)
    - [ ] Query optimization (Firestore indexes)
    - [ ] Batch processing для reconciliation job
    - [ ] Pagination для large datasets

#### Priority 5: Documentation

11. **Documentation**
    - [ ] OpenAPI/Swagger via /docs endpoint
    - [ ] Architecture diagrams (C4)
    - [ ] Deployment guide (GCP, Docker, K8s)
    - [ ] Runbooks для operations

### Метрики для відстеження

- **Coverage**: Кількість Opportunity Cards/тиждень на 1 акаунт (target: ≥ 2-3)
- **Relevance**: % "Accepted/Useful" від AM (target: ≥ 70%)
- **Conversion**: % → meeting / CRM pipeline entry (target: ≥ 20%, v2+)
- **Latency**: P95 time-to-card після надходження сигналу (target: < 15 хв)
- **Realtime**: P95 update propagation до UI (target: ≤ 2 сек)
- **Reliability**: 0 stuck states без алертів > 1 год
- **Explainability**: 100% карток мають evidenceRefs + assetRefs + score breakdown

### Ризики та мітигації

Див. ARCHITECTURE.md для деталей про ризики та мітигації.

### Команди для запуску

```bash
# 1. Setup environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 2. Start services (Docker)
docker-compose up -d

# 3. Start API server
python main.py
# Доступний на http://localhost:8000/docs для OpenAPI docs

# 4. (Паралельно) Start Temporal worker
python -m src.workers.temporal_worker

# 5. (Паралельно) Run workflows (in another terminal)
python examples/example_usage.py

# 6. (Щодня) Run reconciliation job (можна додати як Kubernetes CronJob)
python scripts/reconciliation_job.py
```

### Структура API

```
GET  /health                                    # Health check
GET  /api/v1/inbox                             # AM inbox (score sorted)
GET  /api/v1/inbox/stats                       # Inbox statistics
GET  /api/v1/opportunities/{id}                # Card details
POST /api/v1/opportunities/{id}/approve        # Approve
POST /api/v1/opportunities/{id}/reject         # Reject
POST /api/v1/opportunities/{id}/refine         # Refine
GET  /api/v1/opportunities/{id}/history        # Audit trail
GET  /api/v1/accounts                          # My accounts
GET  /api/v1/accounts/{id}                     # Account health view
GET  /api/v1/search/opportunities              # Semantic search
GET  /api/v1/search/assets                     # Asset search
```

### Контакти та підтримка

Для питань та пропозицій створюйте issues у репозиторії.

