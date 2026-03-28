from fastapi import FastAPI
from app.database import engine
from app import model
from app.model import Base
from app.auth import router as auth_router
from app.backtask import create_tasks,create_otp_cleanup_task
from fastapi.middleware.cors import CORSMiddleware
from app.queue_service import router as  queue_service_router


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins="http://localhost:5173",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Tables found:", Base.metadata.tables.keys())
Base.metadata.create_all(engine)

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(queue_service_router, prefix="/queue", tags=["Queue"])
create_tasks(app)
create_otp_cleanup_task(app)

@app.get("/")
def root():
    return {"message":"Root"}