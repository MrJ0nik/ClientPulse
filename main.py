"""ClientPulse FastAPI application"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from src.api.routers import accounts_router, signals_router, opportunities_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="ClientPulse API",
    description="AI-powered sales intelligence platform API",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Route handlers
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "clientpulse-api"}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "ClientPulse API",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json"
    }


# Include routers
@app.get("/api/accounts", tags=["accounts"])
async def get_accounts(tenant_id: str):
    """Forward to accounts router"""
    pass


# Register routers with API prefix
app.include_router(accounts_router, prefix="/api")
app.include_router(signals_router, prefix="/api")
app.include_router(opportunities_router, prefix="/api")


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
