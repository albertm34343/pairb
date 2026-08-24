from aiogram import Router, types
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from core.db import async_session
from core.models import User, Pair
from sqlalchemy import select
import uuid

router = Router()

@router.message(CommandStart())
async def start(message: types.Message):
    args = message.text.split()
    
    if len(args) > 1:
        await accept_invite(message, args[1])
        return
    
    username = message.from_user.username
    
    if not username:
        await message.answer(
            "❌ У вас не установлен username в Telegram.\n\n"
            "Пожалуйста, установите его в настройках Telegram, чтобы пользоваться сервисом."
        )
        return
    
    async with async_session() as session:
        user = await session.scalar(
            select(User).where(User.username == username)
        )
        
        if not user:
            user = User(username=username)
            session.add(user)
            await session.commit()
            await session.refresh(user)
        
        if user.pair_id:
            kb = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="📱 Открыть приложение", web_app=types.WebAppInfo(url="https://24pair.ru?v=7"))]
            ])
            await message.answer("Вы уже в паре!", reply_markup=kb)
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
    username = message.from_user.username
    
    if not username:
        await message.answer(
            "❌ У вас не установлен username в Telegram.\n\n"
            "Пожалуйста, установите его в настройках Telegram."
        )
        return
    
    async with async_session() as session:
        pair = await session.scalar(
            select(Pair).where(Pair.invite_token == invite_token)
        )
        
        if not pair:
            await message.answer("❌ Приглашение не найдено или устарело")
            return
        
        if pair.user2_id:
            await message.answer("❌ Эта пара уже создана")
            return
        
        user1 = await session.get(User, pair.user1_id)
        if user1 and user1.username == username:
            await message.answer("❌ Нельзя пригласить самого себя")
            return
        
        user2 = await session.scalar(
            select(User).where(User.username == username)
        )
        
        if not user2:
            user2 = User(username=username)
            session.add(user2)
            await session.commit()
            await session.refresh(user2)
        
        if user2.pair_id:
            await message.answer("❌ Вы уже состоите в паре")
            return
        
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="✅ Принять приглашение", callback_data=f"accept_{invite_token}")]
        ])
        
        await message.answer(
            "💑 Вас пригласили в пару!\n\n"
            "Нажмите кнопку ниже, чтобы принять приглашение и создать пару.",
            reply_markup=kb
        )

@router.callback_query(lambda c: c.data and c.data.startswith("accept_"))
async def process_accept(callback: types.CallbackQuery):
    invite_token = callback.data.replace("accept_", "")
    username = callback.from_user.username
    
    if not username:
        await callback.answer("Установите username в Telegram", show_alert=True)
        return
    
    async with async_session() as session:
        pair = await session.scalar(
            select(Pair).where(Pair.invite_token == invite_token)
        )
        
        if not pair:
            await callback.answer("Приглашение не найдено", show_alert=True)
            return
        
        if pair.user2_id:
            await callback.answer("Пара уже создана", show_alert=True)
            return
        
        user2 = await session.scalar(
            select(User).where(User.username == username)
        )
        
        if not user2:
            await callback.answer("Вы не зарегистрированы", show_alert=True)
            return
        
        if user2.pair_id:
            await callback.answer("Вы уже состоите в паре", show_alert=True)
            return
        
        pair.user2_id = user2.id
        user2.pair_id = pair.id
        user1 = await session.get(User, pair.user1_id)
        if user1:
            user1.pair_id = pair.id
        await session.commit()
        
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="📱 Открыть приложение", web_app=types.WebAppInfo(url="https://24pair.ru?v=7"))]
        ])
        
        await callback.message.edit_text(
            "🎉 Пара создана!\n\n"
            "Теперь вы можете пользоваться приложением.",
            reply_markup=kb
        )
        
        try:
            await callback.bot.send_message(
                user1.username,
                "🎉 Ваш партнёр принял приглашение! Пара создана!",
                reply_markup=kb
            )
        except:
            pass
    
    await callback.answer()