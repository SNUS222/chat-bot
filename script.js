document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-btn');
    const themeToggle = document.querySelector('.theme-toggle');
    const backgroundVideo = document.getElementById('background-video');
    const botAvatarVideo = document.getElementById('bot-avatar-video');
    const botAvatarContainers = document.querySelectorAll('.bot-avatar-container');
    
    // State
    let darkMode = localStorage.getItem('darkMode') === 'true';
    
    // Apply saved theme
    if (darkMode) {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Theme toggle functionality
    themeToggle.addEventListener('click', () => {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-theme');
        themeToggle.innerHTML = darkMode 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
        localStorage.setItem('darkMode', darkMode);
    });
    
    // Обработка видео-фона
    if (backgroundVideo) {
        // Обработка ошибок загрузки видео
        backgroundVideo.addEventListener('error', (e) => {
            console.error('Ошибка загрузки видео-фона:', e);
            // Если видео не загружается, скрываем его контейнер
            const videoBackground = document.querySelector('.video-background');
            if (videoBackground) {
                videoBackground.style.display = 'none';
            }
        });
        
        // Попытка воспроизведения видео
        backgroundVideo.play().catch(error => {
            console.error("Ошибка автовоспроизведения видео-фона:", error);
            // Некоторые браузеры блокируют автовоспроизведение
            // Добавляем обработчик клика для запуска видео при взаимодействии пользователя
            document.body.addEventListener('click', () => {
                backgroundVideo.play().catch(e => console.error("Не удалось воспроизвести видео-фон:", e));
            }, { once: true });
        });
    }
    
    // Обработка видео-аватарки
    if (botAvatarVideo) {
        // Обработка ошибок загрузки видео-аватарки
        botAvatarVideo.addEventListener('error', (e) => {
            console.error('Ошибка загрузки видео-аватарки:', e);
            // Если видео не загружается, показываем иконку
            botAvatarContainers.forEach(container => {
                container.classList.add('video-error');
            });
        });
        
        // Попытка воспроизведения видео-аватарки
        botAvatarVideo.play().catch(error => {
            console.error("Ошибка автовоспроизведения видео-аватарки:", error);
            // Показываем иконку, если видео не воспроизводится
            botAvatarContainers.forEach(container => {
                container.classList.add('video-error');
            });
            
            // Пытаемся воспроизвести при взаимодействии пользователя
            document.body.addEventListener('click', () => {
                const allAvatarVideos = document.querySelectorAll('.bot-avatar-video');
                allAvatarVideos.forEach(video => {
                    video.play().catch(e => {
                        console.error("Не удалось воспроизвести видео-аватарку:", e);
                        // Если все равно не удалось, оставляем иконку
                        botAvatarContainers.forEach(container => {
                            container.classList.add('video-error');
                        });
                    });
                });
            }, { once: true });
        });
    } else {
        // Если элемент видео-аватарки не найден, показываем иконку
        botAvatarContainers.forEach(container => {
            container.classList.add('video-error');
        });
    }
    
    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = (userInput.scrollHeight) + 'px';
        
        // Reset height if empty
        if (userInput.value === '') {
            userInput.style.height = 'auto';
        }
    });
    
    // Send message on Enter (but allow Shift+Enter for new line)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Send button click
    sendButton.addEventListener('click', sendMessage);
    
    // Function to send message
    function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;
        
        // Add user message to chat
        addMessageToChat('user', message);
        
        // Clear input
        userInput.value = '';
        userInput.style.height = 'auto';
        
        // Show typing indicator
        showTypingIndicator();
        
        // Используем бесплатный API NLP Cloud
        sendToNLPCloud(message);
    }
    
    // Function to add message to chat
    function addMessageToChat(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
        
        const avatar = document.createElement('div');
        avatar.classList.add('avatar');
        
        if (sender === 'user') {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        } else {
            // Для бота создаем видео-аватарку
            const avatarContainer = document.createElement('div');
            avatarContainer.classList.add('bot-avatar-container', 'message-avatar-container');
            
            // Проверяем, есть ли ошибка с видео
            if (document.querySelector('.bot-avatar-container.video-error')) {
                avatarContainer.classList.add('video-error');
            }
            
            // Создаем видео элемент
            const video = document.createElement('video');
            video.classList.add('bot-avatar-video', 'message-avatar-video');
            video.autoplay = true;
            video.muted = true;
            video.loop = true;
            
            // Создаем source элемент
            const source = document.createElement('source');
            // Используем тот же путь, что и для основной аватарки
            const originalSource = document.querySelector('#bot-avatar-video source');
            if (originalSource) {
                source.src = originalSource.src;
                source.type = 'video/mp4';
            }
            
            // Создаем иконку для запасного варианта
            const icon = document.createElement('i');
            icon.classList.add('fas', 'fa-robot', 'icon-avatar');
            
            // Собираем все вместе
            video.appendChild(source);
            avatarContainer.appendChild(video);
            avatarContainer.appendChild(icon);
            avatar.appendChild(avatarContainer);
            
            // Пытаемся воспроизвести видео
            video.play().catch(e => {
                console.error("Не удалось воспроизвести видео в сообщении:", e);
                avatarContainer.classList.add('video-error');
            });
        }
        
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        
        const paragraph = document.createElement('p');
        paragraph.textContent = message;
        
        messageContent.appendChild(paragraph);
        messageElement.appendChild(avatar);
        messageElement.appendChild(messageContent);
        
        chatMessages.appendChild(messageElement);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to show typing indicator
    function showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('typing-indicator');
        typingIndicator.id = 'typing-indicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            typingIndicator.appendChild(dot);
        }
        
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to hide typing indicator
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Function to send message to ChatGPT API
    async function sendToChatGPT(message) {
        // Эта функция больше не используется
        simulateResponse(message);
    }
    
    // Новая функция для отправки сообщений в NLP Cloud API
    async function sendToNLPCloud(message) {
        try {
            // Используем бесплатную модель с NLP Cloud
            const API_URL = 'https://api.nlpcloud.io/v1/gpu/finetuned-llama-2-70b/chatbot';
            
            // Для использования API нужно зарегистрироваться на nlpcloud.io
            // и получить бесплатный токен в настройках аккаунта
            const NLP_TOKEN = '1a11810cc2694b84b93ce31cba8cbd6a96f31905'; // Замените на ваш токен после регистрации
            
            // Если токен не настроен, используем демо-режим
            if (NLP_TOKEN === 'nlpcloud_dummy_token') {
                simulateResponse(message);
                return;
            }
            
            // Получаем историю сообщений (последние 5)
            const messageElements = document.querySelectorAll('.message');
            const history = [];
            
            // Собираем последние сообщения (максимум 5)
            let count = 0;
            for (let i = messageElements.length - 1; i >= 0 && count < 5; i--) {
                const isUser = messageElements[i].classList.contains('user-message');
                const text = messageElements[i].querySelector('p').textContent;
                
                history.unshift({
                    input: isUser ? text : '',
                    response: isUser ? '' : text
                });
                
                count++;
            }
            
            // Добавляем текущее сообщение
            history.push({
                input: message,
                response: ''
            });
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${NLP_TOKEN}`
                },
                body: JSON.stringify({
                    input: message,
                    context: "Вы - полезный и дружелюбный ассистент, который отвечает на русском языке.",
                    history: history
                })
            });
            
            const data = await response.json();
            
            // Hide typing indicator
            hideTypingIndicator();
            
            // Add bot response to chat
            if (data && data.response) {
                addMessageToChat('bot', data.response);
            } else {
                throw new Error('Некорректный ответ от API');
            }
            
        } catch (error) {
            console.error('Error:', error);
            hideTypingIndicator();
            
            // Если произошла ошибка, используем демо-режим
            simulateResponse(message);
        }
    }
    
    // For demo purposes - if no API key is provided
    // This function simulates API response
    function simulateResponse(message) {
        // Hide typing indicator after random delay (1-3 seconds)
        setTimeout(() => {
            hideTypingIndicator();
            
            let response;
            if (message.toLowerCase().includes('привет') || message.toLowerCase().includes('здравствуй')) {
                response = 'Привет! Чем я могу вам помочь сегодня?';
            } else if (message.toLowerCase().includes('как дела') || message.toLowerCase().includes('как ты')) {
                response = 'У меня всё отлично, спасибо! Я готов помочь вам с любыми вопросами.';
            } else if (message.toLowerCase().includes('погода')) {
                response = 'Я не могу проверить текущую погоду, так как у меня нет доступа к данным о погоде в реальном времени. Но я могу рассказать вам о климате в разных регионах!';
            } else {
                response = 'Спасибо за ваше сообщение! Обычно я бы ответил с помощью API ChatGPT, но сейчас я работаю в демо-режиме. Пожалуйста, добавьте ваш API ключ в код для полноценной работы.';
            }
            
            addMessageToChat('bot', response);
        }, Math.random() * 2000 + 1000);
    }
}); 