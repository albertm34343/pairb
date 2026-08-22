from aiogram import Router, types
from aiogram.filters import Command, CommandStart
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from core.db import async_session
from core.models import User, Pair
from sqlalchemy import select
import uuid

router = Router()

@router.message(CommandStart())
async def start(message: types.Message):
    # Проверяем, есть ли deep-link (инвайт)
    args = message.text.split()
    
    if len(args) > 1:
        # Это переход по инвайту
        await accept_invite(message, args[1])
        return
    
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
            [InlineKeyboardButton(text="🔗 Ссылка для партнёра", url=invite_link)]
        ])
        
        await message.answer(
            "💑 Добро пожаловать в PairB!\n\n"
            "Отправьте эту ссылку вашему партнёру:\n"
            f"{invite_link}\n\n"
            "Когда партнёр перейдёт по ссылке, вы станете парой!",
            reply_markup=kb
        )

async def accept_invite(message: types.Message, invite_token: str):
    async with async_session() as session:
        # Ищем приглашение
        pair = await session.scalar(
            select(Pair).where(Pair.invite_token == invite_token)
        )
        
        if not pair:
            await message.answer("❌ Приглашение не найдено или устарело")
            return
        
        if pair.user2_id:
            await message.answer("❌ Эта пара уже создана")
            return
        
        # Проверяем, что это не тот же юзер
        if pair.user1_id == message.from_user.id:
            await message.answer("❌ Нельзя пригласить самого себя")
            return
        
        # Создаём второго юзера
        user2 = await session.scalar(
            select(User).where(User.telegram_id == str(message.from_user.id))
        )
        
        if not user2:
            user2 = User(
                telegram_id=str(message.from_user.id),
                username=message.from_user.username
            )
            session.add(user2)
            await session.commit()
            await session.refresh(user2)
        
        # Привязываем к паре
        pair.user2_id = user2.id
        user2.pair_id = pair.id
        await session.commit()
        
        # Уведомляем обоих
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="📱 Открыть приложение", web_app=types.WebAppInfo(url="https://24pair.ru"))]
        ])
        
        await message.answer(
            "🎉 Пара создана!\n\n"
            "Теперь вы можете пользоваться приложением.",
            reply_markup=kb
        )
        
        # Уведомляем первого партнёра
        user1 = await session.get(User, pair.user1_id)
        try:
            await message.bot.send_message(
                user1.telegram_id,
                "🎉 Ваш партнёр принял приглашение! Пара создана!",
                reply_markup=kb
            )
        except:
            pass