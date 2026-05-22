/**
 * AI Client for SwiftTalk
 * Handles all AI-related API calls: smart replies, translation, summarization, etc.
 */

import axiosInstance from "./axiosInstance";

const getApiBaseUrl = () => axiosInstance.defaults.baseURL || "http://localhost:3001";

export const createNewSession = async() => {
  try {
    const response = await axiosInstance.post(`/api/ai/sessions`);
    const data = response.data;
    const sessionId = data?.sessionId || data?.session_id || data?.data?.sessionId || data?.data?.session_id;

    if (sessionId) {
      return {
        ...data,
        sessionId,
        session_id: sessionId,
      };
    }

    return data;
  } catch (error) {
    console.error('Failed to create new session', error);
    return null;
  }
}

export const loadSession = async(sessionId) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    const response = await axiosInstance.get(`/api/ai/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
}

export const deleteSession = async(sessionId) => {
  try {
    await axiosInstance.delete(`/api/ai/sessions/${sessionId}`);
    return true;
  } catch (error) {
    console.error('Failed to delete the session');
  }
}

export const getSessionList = async() => {
  try {
    const response = await axiosInstance.get(`/api/ai/sessions`);
    return response.data.sessions || [];
  } catch (error) {
    console.error('Failed to fetch session list', error);
    return [];
  } 
}

/**
 * Get smart reply suggestions for a chat
 * @param {number} chatId - The chat ID
 * @param {number} limit - Maximum number of suggestions (default: 3)
 * @returns {Promise<string[]>} Array of suggested replies
 */
export const getSmartReplies = async (chatId, limit = 3) => {
  try {
    const response = await axiosInstance.post(`/api/ai/smart-replies`, {
      chat_id: chatId,
      limit: limit,
    });
    return response.data.suggestions || response.data || [];
  } catch (error) {
    console.error("Error getting smart replies:", error);
    throw error;
  }
};

/**
 * Translate text to target language
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code (e.g., 'es', 'fr', 'de')
 * @returns {Promise<Object>} Translation result with translatedText
 */
export const translateText = async (text, targetLanguage) => {
  try {
    const response = await axiosInstance.post(`/api/ai/translate`, {
      text: text,
      target_language: targetLanguage,
    });
    return response.data;
  } catch (error) {
    console.error("Error translating text:", error);
    throw error;
  }
};

/**
 * Summarize a chat conversation
 * @param {number} chatId - The chat ID
 * @param {string} summaryType - Type of summary ('brief', 'detailed', 'bullet')
 * @returns {Promise<Object>} Summary result with summary text
 */
export const summarizeChat = async (chatId, summaryType = "brief") => {
  try {
    const response = await axiosInstance.post(`/api/ai/summarize`, {
      chat_id: chatId,
      summary_type: summaryType,
    });
    return response.data;
  } catch (error) {
    console.error("Error summarizing chat:", error);
    throw error;
  }
};

/**
 * Detect language of text
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} Language detection result with languageCode
 */
export const detectLanguage = async (text) => {
  try {
    const response = await axiosInstance.post(`/api/ai/detect-language`, {
      text: text,
    });
    return response.data;
  } catch (error) {
    console.error("Error detecting language:", error);
    throw error;
  }
};

/**
 * Get conversation starter suggestions
 * @param {number} chatId - The chat ID
 * @returns {Promise<Object>} Conversation starters with starters array
 */
export const getConversationStarters = async (chatId) => {
  try {
    const response = await axiosInstance.post(`/api/ai/conversation-starters`, {
      chat_id: chatId,
    });
    return response.data;
  } catch (error) {
    console.error("Error getting conversation starters:", error);
    throw error;
  }
};

export const streamAIMessage = async (message, sessionId, conversationHistory = []) => {
  const token = localStorage.getItem("accessToken");

  return fetch(`${getApiBaseUrl()}/api/ai/chat-stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message,
      session_id: sessionId,
      conversation_history: conversationHistory,
    }),
  });
};

// AI Assistant info constant
export const AI_ASSISTANT = {
  id: 'ai-assistant',
  name: 'AI Assistant',
  avatar: '🤖',
  description: 'Your helpful AI companion powered by Gemini',
  isAI: true,
};

const aiClient = {
  getSmartReplies,
  translateText,
  summarizeChat,
  detectLanguage,
  getConversationStarters,
  streamAIMessage,
  loadSession,
  createNewSession,
  deleteSession,
  getSessionList,
  AI_ASSISTANT,
};

export default aiClient;