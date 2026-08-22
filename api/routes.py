from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.db import async_session
from core.models import User, Pair
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

@router.get("/api/check_onboarding/{telegram_id}")
async def check_onboarding(telegram_id: int):
    async with async_session() as session:
        user = await session.scalar(
            select(User).where(User.telegram_id == str(telegram_id))
        )
        
        if not user:
            return {"exists": False, "onboarding_done": False}
        
        return {
            "exists": True,
            "onboarding_done": user.onboarding_done,
            "name": user.name
        }

@router.get("/api/get_profile/{telegram_id}")
async def get_profile(telegram_id: int):
    async with async_session() as session:
        user = await session.scalar(
            select(User).where(User.telegram_id == str(telegram_id))
        )
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "name": user.name,
            "gender": user.gender,
            "relationship_date": str(user.relationship_date) if user.relationship_date else None,
            "city": user.city,
            "personal_hobbies": user.personal_hobbies,
            "shared_hobbies": user.shared_hobbies
        }

@router.post("/api/update_profile")
async def update_profile(data: OnboardingData):
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
        
        await session.commit()
        
        return {"status": "ok"}

@router.post("/api/break_pair/{telegram_id}")
async def break_pair(telegram_id: int):
    async with async_session() as session:
        user = await session.scalar(
            select(User).where(User.telegram_id == str(telegram_id))
        )
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.pair_id:
            pair = await session.get(Pair, user.pair_id)
            if pair:
                if pair.user1_id == user.id:
                    user2 = await session.get(User, pair.user2_id) if pair.user2_id else None
                else:
                    user2 = await session.get(User, pair.user1_id)
                
                if user2:
                    user2.pair_id = None
                
                await session.delete(pair)
            
            user.pair_id = None
            await session.commit()
        
        return {"status": "ok"}