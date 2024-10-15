# Gemini Telegram Bot

This project is a Telegram bot that interacts with the Gemini API.

## Prerequisites

Before you begin, ensure you have the following:

- Gemini API Key
- Telegram Bot Token

## Setup

1. fork or clone this repository:

   ```bash
   git clone https://github.com/debinum/gemini-telegram.git
   cd gemini-telegram
   ```

2. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

3. Open the `.env` file and add your Gemini API Key and Telegram Bot Token:

   ```env
   APIKEY="your_gemini_api_key"
   TOKEN="your_telegram_bot_token"
   ```

4. Install the required dependencies:

   ```bash
   yarn install
   ```

5. Run the bot in development:
   ```bash
   yarn dev
   ```

## Usage

Once the bot is running, you can interact with it through Telegram.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
