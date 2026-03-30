from fastapi import FastAPI
from app.database import engine
from app import model
from app.model import Base
from app.auth import router as auth_router
from app.backtask import create_tasks,create_otp_cleanup_task
from fastapi.middleware.cors import CORSMiddleware
from app.queue_service import router as  queue_service_router
from app.barber_manage import router as barber_manage_router
from app.data_service import router as data_router

app = FastAPI(
    title="Barber Shop API",
    version="2.0.0",
    description="Backend for Barber Shop booking system",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins="http://localhost:5173",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Tables found:", Base.metadata.tables.keys())
Base.metadata.create_all(engine)

app.include_router(auth_router)
app.include_router(queue_service_router)
app.include_router(barber_manage_router)
create_tasks(app)
create_otp_cleanup_task(app)

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "version": "1.0.0"}
 
 
@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}