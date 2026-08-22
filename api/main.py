from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.routes import router

app = FastAPI(title="PairB API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")

@app.get("/health")
async def health():
    return {"status": "healthy"}