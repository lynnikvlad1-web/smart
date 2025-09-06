document.addEventListener('DOMContentLoaded', async () => {
  const channelForm = document.getElementById('channel-form');
  const newsContainer = document.getElementById('news-container');
  const channelIdInput = document.getElementById('channel-id');
  const addChannelBtn = document.getElementById('add-channel-btn');
  const loadingSpinner = document.getElementById('loading-spinner');
  const errorMessage = document.getElementById('error-message');

  const API_BASE_URL = "https://smart-71n5.onrender.com";

  // Загрузка списка каналов с сервера
  async function loadChannels() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/channels`);
      if (!response.ok) throw new Error('Ошибка при загрузке каналов');
      const channels = await response.json();

      channelForm.innerHTML = '';
      channels.forEach(channel => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'channels';
        checkbox.value = JSON.stringify(channel);

        const label = document.createElement('label');
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(channel.title));

        channelForm.appendChild(label);
        channelForm.appendChild(document.createElement('br'));
      });
    } catch (error) {
      console.error(error);
      alert('Не удалось загрузить список каналов');
    }
  }

  await loadChannels();

  // Обработка добавления канала
  addChannelBtn.addEventListener('click', async () => {
    const channelId = channelIdInput.value.trim();
    if (!channelId) {
      errorMessage.textContent = 'Введите ID канала';
      errorMessage.classList.remove('hidden');
      return;
    }

    loadingSpinner.classList.remove('hidden');
    try {
      const response = await fetch(`${API_BASE_URL}/api/add-channel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      });

      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        await loadChannels();
      } else {
        throw new Error(result.error || 'Ошибка при добавлении канала');
      }
    } catch (error) {
      console.error(error);
      errorMessage.textContent = error.message;
      errorMessage.classList.remove('hidden');
    } finally {
      loadingSpinner.classList.add('hidden');
    }
  });

  // Обработка отправки формы
  document.getElementById('submit-channels').addEventListener('click', async () => {
    const selectedChannels = Array.from(channelForm.querySelectorAll('input[type="checkbox"]:checked'))
      .map(checkbox => JSON.parse(checkbox.value));

    if (selectedChannels.length === 0) {
      alert('Выберите хотя бы один канал');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels: selectedChannels }),
      });

      const news = await response.json();
      renderNews(news);
    } catch (error) {
      console.error(error);
      alert('Ошибка при получении новостей');
    }
  });

  // Отображение новостей
  function renderNews(news) {
    newsContainer.innerHTML = '';
    if (news.length === 0) {
      newsContainer.innerHTML = '<p>Нет новостей для отображения.</p>';
      return;
    }

    news.forEach(post => {
      const newsItem = document.createElement('div');
      newsItem.className = 'news-item';
      newsItem.innerHTML = `
        <strong>${post.channel}</strong><br>
        ${post.text}<br>
        <small>${post.date}</small>
      `;
      newsContainer.appendChild(newsItem);
    });
  }

});




