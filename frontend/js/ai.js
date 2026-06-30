// FinGenius AI - Chatbot JavaScript
let chatHistory = [];

// Initialize Chatbot
async function initChatbot() {
  if (!fingenius.requireAuth()) return;
  
  setupChatEventListeners();
  addWelcomeMessage();
}

// Setup Event Listeners
function setupChatEventListeners() {
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  
  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }
  
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
}

// Add Welcome Message
function addWelcomeMessage() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  
  const welcomeMessage = `
    <div class="chat-message ai">
      <div class="message-bubble">
        <p>Hello! I'm your AI financial assistant. I can help you with:</p>
        <ul style="margin-top: 10px; margin-left: 20px;">
          <li>Purchase suggestions: "Can I buy 50000 phone?"</li>
          <li>Savings advice: "How can I save more?"</li>
          <li>Expense analysis: "How am I spending?"</li>
          <li>Income overview: "Show my income"</li>
          <li>General tips: "Give me financial advice"</li>
        </ul>
        <p style="margin-top: 15px;">Your current health score will be included in my responses.</p>
      </div>
    </div>
  `;
  
  chatMessages.innerHTML = welcomeMessage;
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send Message
async function sendMessage() {
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  
  if (!chatInput || !chatMessages) return;
  
  const message = chatInput.value.trim();
  if (!message) return;
  
  // Add user message
  addMessage(message, 'user');
  chatInput.value = '';
  
  // Show typing indicator
  showTypingIndicator();
  
  try {
    const response = await fingeniusAPI.post('/ai/chat', { message });
    removeTypingIndicator();
    addMessage(response.data.response, 'ai');
  } catch (error) {
    removeTypingIndicator();
    addMessage('Sorry, I encountered an error. Please try again.', 'ai');
    console.error('Chat error:', error);
  }
}

// Add Message to Chat
function addMessage(message, sender) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${sender}`;
  messageDiv.innerHTML = `<div class="message-bubble">${formatMessage(message)}</div>`;
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Format Message (convert newlines to breaks)
function formatMessage(message) {
  return message.replace(/\n/g, '<br>');
}

// Show Typing Indicator
function showTypingIndicator() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  
  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-message ai';
  typingDiv.id = 'typingIndicator';
  typingDiv.innerHTML = `
    <div class="message-bubble">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove Typing Indicator
function removeTypingIndicator() {
  const typingIndicator = document.getElementById('typingIndicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Check Affordability
async function checkAffordability(amount) {
  try {
    const response = await fingeniusAPI.post('/finance/can-afford', { amount });
    return response.data;
  } catch (error) {
    console.error('Affordability check error:', error);
    return null;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initChatbot);
