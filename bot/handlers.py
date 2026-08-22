from aiogram import Router, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from core.db import async_session
from core.models import User, Pair
from sqlalchemy import select
import uuid

router = Router()

@router.message(Command("start"))
async def start(message: types.Message):
    async with async_session() as session:
        user = await session.scalar(
            select(User).where(User.telegram_id == str(message.from_user.id))
        )
        
        if not user:
            user = User(
                telegram_id=str(message.from_user.id),
                username=message.from_user.username
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
        
        if user.pair_id:
            await message.answer("Вы уже в паре!")
            return
        
        invite_token = str(uuid.uuid4())
        pair = Pair(invite_token=invite_token, user1_id=user.id)
        session.add(pair)
        await session.commit()
        
        bot_username = (await message.bot.me()).username
        invite_link = f"https://t.me/{bot_username}?start={invite_token}"
        
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🔗 Открыть приложение", url=invite_link)]
        ])
        
        await message.answer(
            "💑 Добро пожаловать в 24Pair!\n\n"
            "Отправьте эту ссылку вашему партнёру:\n"
            f"{invite_link}\n\n"
            "Когда партнёр перейдёт по ссылке, вы станете парой!",
            reply_markup=kb
        )