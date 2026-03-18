from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Support both:
# - `python backend/main.py` (imports as top-level modules via backend/ cwd)
# - `python -m uvicorn backend.main:app` (imports as a package)
try:
    from backend.api.routes import router as api_router  # type: ignore
except Exception:
    from api.routes import router as api_router  # type: ignore

app = FastAPI(
    title="Git AI Agent API",
    description="Backend API for the Web Git AI Agent",
    version="1.0.0"
)

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Welcome to the Git AI Agent API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
