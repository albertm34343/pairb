import asyncio
import logging
from aiogram import Bot, Dispatcher
from core.config import BOT_TOKEN
from core.db import engine
from core.models import Base
from bot.handlers import router

logging.basicConfig(level=logging.INFO)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
dp.include_router(router)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def main():
    await init_db()
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())