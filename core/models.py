from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date
from core.db import Base
import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    telegram_id = Column(String, unique=True, nullable=False)
    username = Column(String)
    pair_id = Column(Integer, ForeignKey("pairs.id"))
    onboarding_done = Column(Boolean, default=False)
    subscription_status = Column(String, default="free")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Онбординг
    name = Column(String)
    gender = Column(String)
    relationship_date = Column(Date)
    city = Column(String)
    personal_hobbies = Column(String)
    shared_hobbies = Column(String)

class Pair(Base):
    __tablename__ = "pairs"
    
    id = Column(Integer, primary_key=True)
    invite_token = Column(String, unique=True, nullable=False)
    user1_id = Column(Integer, ForeignKey("users.id"))
    user2_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String)
    started_at = Column(DateTime)
    expires_at = Column(DateTime)