const config = window.TEJA_CONFIG || {
  appName: 'TEJA AI',
  defaultGame: 'All games',
  voiceReplies: true,
  intro: 'Hey! I\'m ready. Choose a game above or ask me anything. What are we playing today?'
};

const statusText = document.getElementById('statusText');
const gameSelect = document.getElementById('gameSelect');
const promptInput = document.getElementById('promptInput');
const messages = document.getElementById('messages');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const micBtn = document.getElementById('micBtn');
const speakToggle = document.getElementById('speakToggle');
const quickButtons = document.querySelectorAll('.quick');

const speechSupported = 'speechSynthesis' in window;
let isListening = false;
let recognizer = null;

function setStatus(text) {
  statusText.textContent = text;
}

function appendMessage(role, content) {
  const bubble = document.createElement('div');
  bubble.className = `bubble ${role}`;
  const label = document.createElement('b');
  label.textContent = role === 'ai' ? config.appName : 'You';
  const p = document.createElement('p');
  p.textContent = content;
  bubble.appendChild(label);
  bubble.appendChild(p);
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
}

function selectedGame() {
  return gameSelect.value || config.defaultGame;
}

function createFallbackReply(prompt, game) {
  const trimmed = prompt.trim();
  const lower = trimmed.toLowerCase();
  const gameNote = config.support && config.support[game] ? config.support[game] : 'Keep practicing the basics and focus on consistent decisions rather than one-off highlight plays.';

  if (!trimmed) {
    return 'Tell me what you want help with and I\'ll keep it practical.';
  }

  if (lower.includes('sensitivity') || lower.includes('control') || lower.includes('settings')) {
    return `For ${game}, start with a clean default layout, reduce unnecessary movement, and test small changes in short practice sessions. ${gameNote}`;
  }

  if (lower.includes('tip') || lower.includes('beginner') || lower.includes('practice')) {
    return `For ${game}, focus on one key loop: learn the mechanics, practice in short sessions, review mistakes, and repeat the same actions until they become natural. ${gameNote}`;
  }

  if (lower.includes('strategy') || lower.includes('guide') || lower.includes('how')) {
    return `A strong ${game} strategy is to learn the core loop, identify your safest plays, and keep your decisions simple. ${gameNote}`;
  }

  if (lower.includes('update') || lower.includes('patch') || lower.includes('feature')) {
    return `Check the official patch notes and then test the changes in a few matches. The biggest factors are usually timing, map knowledge, and adapting your loadout or build. ${gameNote}`;
  }

  return `Here is a practical approach for ${game}: learn the fundamentals, play with intention, and keep improving one habit at a time. ${gameNote}`;
}

function speakReply(text) {
  if (!config.voiceReplies || !speechSupported) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function handleSend() {
  const prompt = promptInput.value.trim();
  if (!prompt) return;

  appendMessage('user', prompt);
  promptInput.value = '';
  promptInput.style.height = 'auto';

  const game = selectedGame();
  const reply = createFallbackReply(prompt, game);
  setStatus(`AI ready · ${game}`);

  window.setTimeout(() => {
    appendMessage('ai', reply);
    if (config.voiceReplies && speechSupported) {
      speakReply(reply);
    }
  }, 250);
}

function onQuickPrompt(event) {
  const button = event.currentTarget;
  const game = selectedGame();
  const basePrompt = button.dataset.prompt || 'Help me with';
  const fullPrompt = `${basePrompt} ${game}`;
  promptInput.value = fullPrompt;
  promptInput.focus();
  handleSend();
}

function handleKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
}

function resizeTextarea() {
  promptInput.style.height = 'auto';
  promptInput.style.height = `${Math.min(promptInput.scrollHeight, 140)}px`;
}

function setupVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micBtn.title = 'Voice input not supported';
    micBtn.disabled = true;
    return;
  }

  recognizer = new SpeechRecognition();
  recognizer.lang = 'en-US';
  recognizer.continuous = false;
  recognizer.interimResults = false;

  recognizer.onstart = () => {
    isListening = true;
    micBtn.textContent = '🔴';
    micBtn.classList.add('is-listening');
    setStatus('Listening…');
  };

  recognizer.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    promptInput.value = transcript;
    resizeTextarea();
  };

  recognizer.onend = () => {
    isListening = false;
    micBtn.textContent = '🎙';
    micBtn.classList.remove('is-listening');
    setStatus('AI ready');
  };

  micBtn.addEventListener('click', () => {
    if (isListening) {
      recognizer.stop();
      return;
    }
    recognizer.start();
  });
}

function toggleVoiceReplies() {
  config.voiceReplies = !config.voiceReplies;
  speakToggle.textContent = config.voiceReplies ? '🔊 Voice replies: On' : '🔇 Voice replies: Off';
  setStatus(config.voiceReplies ? 'AI ready' : 'AI ready · text only');
}

sendBtn.addEventListener('click', handleSend);
clearBtn.addEventListener('click', () => {
  messages.innerHTML = '<div class="bubble ai"><b>TEJA AI</b><p>' + config.intro + '</p></div>';
  setStatus('AI ready');
});
promptInput.addEventListener('input', resizeTextarea);
promptInput.addEventListener('keydown', handleKeydown);
quickButtons.forEach((button) => button.addEventListener('click', onQuickPrompt));

gameSelect.addEventListener('change', () => {
  setStatus(`AI ready · ${selectedGame()}`);
});

speakToggle.addEventListener('click', toggleVoiceReplies);

resizeTextarea();
setStatus(`AI ready · ${selectedGame()}`);
setupVoiceInput();
