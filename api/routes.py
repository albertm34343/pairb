from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.db import async_session
from core.models import User
from sqlalchemy import select
import datetime

router = APIRouter()

class OnboardingData(BaseModel):
    telegram_id: int
    name: str
    gender: str
    relationship_date: str
    city: str
    personal_hobbies: str
    shared_hobbies: str

@router.post("/api/onboarding")
async def save_onboarding(data: OnboardingData):
    async with async_session() as session:
        user = await session.scalar(
            select(User).where(User.telegram_id == str(data.telegram_id))
        )
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.name = data.name
        user.gender = data.gender
        user.relationship_date = datetime.date.fromisoformat(data.relationship_date)
        user.city = data.city
        user.personal_hobbies = data.personal_hobbies
        user.shared_hobbies = data.shared_hobbies
        user.onboarding_done = True
        
        await session.commit()
        
        return {"status": "ok"}