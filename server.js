require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Загрузка токена из .env
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN) {
  console.error('Telegram bot token is missing!');
  process.exit(1);
}

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// Пример данных
let channels = [];
let news = [];

app.use(express.json());

// Получить список каналов
app.get('/api/channels', (req, res) => {
  res.json(channels);
});

// Добавить канал
app.post('/api/add-channel', async (req, res) => {
  const { channelId } = req.body;
  if (!channelId) return res.status(400).json({ error: 'ID канала обязателен' });

  try {
    // Проверяем, существует ли канал
    const channelInfo = await getChannelInfo(channelId);
    if (!channelInfo) {
      return res.status(404).json({ error: 'Канал не найден' });
    }

    // Добавляем канал в список
    channels.push({ id: channelId, title: channelInfo.title });
    res.json({ message: 'Канал успешно добавлен' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при добавлении канала' });
  }
});

// Получить новости
app.post('/api/news', async (req, res) => {
  const { channels } = req.body;
  if (!channels || channels.length === 0) {
    return res.status(400).json({ error: 'Выберите хотя бы один канал' });
  }

  try {
    const news = await fetchNewsFromChannels(channels.map(channel => channel.id));
    res.json(news);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при получении новостей' });
  }
});

// Функция для получения информации о канале
async function getChannelInfo(channelId) {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat`, {
      params: { chat_id: channelId },
    });
    return response.data.result;
  } catch (error) {
    console.error('Ошибка при получении информации о канале:', error);
    return null;
  }
}

// Функция для получения новостей из каналов
async function fetchNewsFromChannels(channelIds) {
  const news = [];
  for (const channelId of channelIds) {
    try {
      const response = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat`, {
        params: { chat_id: channelId },
      });

      const messagesResponse = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`, {
        params: { chat_id: channelId },
      });

      // Извлекаем последние 5 сообщений
      const messages = messagesResponse.data.result.slice(-5).map(update => ({
        channel: response.data.result.title,
        text: update.message.text,
        date: new Date(update.message.date * 1000).toLocaleString(),
      }));

      news.push(...messages);
    } catch (error) {
      console.error(`Ошибка при получении новостей из канала ${channelId}:`, error);
    }
  }
  return news;
}

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});