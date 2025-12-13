from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import auth, equipment, rentals

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="RentEase")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(equipment.router)
app.include_router(rentals.router)