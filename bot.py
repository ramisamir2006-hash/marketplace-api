import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

# --- RAW HARDCODED DATA ---
# Replace these with your actual details
BOT_TOKEN = "754829xxxx:AAH_Example_Token" 
STORE_URL = "https://your-project.up.railway.app" 

# Enable logging to see errors in the Railway "Logs" tab
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Amazon-style Welcome Message"""
    
    # Elegant layout for 316L Stainless Steel branding
    text = (
        "✨ **Karas & Abu Seifein Luxury Store** ✨\n\n"
        "Welcome to our 2026 Collection.\n"
        "🔹 High-Grade 316L Stainless Steel\n"
        "🔹 Tarnish-Proof & Skin-Safe\n"
        "🔹 Wholesale & Retail shipping\n\n"
        "Click below to browse the catalog:"
    )

    keyboard = [[
        InlineKeyboardButton(
            text="🛍️ Shop Now (Amazon Style)", 
            web_app=WebAppInfo(url=STORE_URL)
        )
    ]]
    
    await update.message.reply_text(
        text, 
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode="Markdown"
    )

def main():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    
    print("Bot is starting... Check Railway Logs for activity.")
    app.run_polling()

if __name__ == "__main__":
    main()
