const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const AI_CONFIG = {
  model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 150,
  temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
};

const generateSmartReplies = async (messageHistory, count = 3) => {
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error('Gemini API key not configured');
    if (!messageHistory || messageHistory.length === 0) throw new Error('Message history is required');

    // Format message history for context
    const conversationContext = messageHistory
      .slice(-10) // Only use last 10 messages for context
      .map(msg => `${msg.sender}: ${msg.text}`)
      .join('\n');

    const lastMessage = messageHistory[messageHistory.length - 1];

    const prompt = `You are helping generate quick reply suggestions for a chat application. 
Based on the following conversation, suggest ${count} brief, natural, and contextually appropriate responses.
Each reply should be concise (1-2 sentences max) and sound conversational.

Conversation:
${conversationContext}

Generate ${count} different reply suggestions that would make sense as responses to the last message from ${lastMessage.sender}.
Return ONLY the suggestions, one per line, without numbering or formatting. You can use suitable emoji in message`;

    const model = genAI.getGenerativeModel({ 
      model: AI_CONFIG.model,
      generationConfig: {
        maxOutputTokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const suggestions = text
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .slice(0, count);

    return suggestions;
  } catch (error) {
    throw error;
  }
};

const translateMessage = async (text, targetLanguage, sourceLanguage = 'auto') => {
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error('Gemini API key not configured');
    if (!text || !text.trim()) throw new Error('Text to translate is required');
    if (!targetLanguage) throw new Error('Target language is required');

    const languageNames = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'hi': 'Hindi',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'it': 'Italian',
      'mr': 'Marathi',
    };

    const targetLangName = languageNames[targetLanguage.toLowerCase()] || targetLanguage;

    const prompt = sourceLanguage === 'auto' 
      ? `Translate the following text to ${targetLangName}. Only return the translation, nothing else:\n\n${text}`
      : `Translate the following text from ${languageNames[sourceLanguage] || sourceLanguage} to ${targetLangName}. Only return the translation, nothing else:\n\n${text}`;

    const model = genAI.getGenerativeModel({ 
      model: AI_CONFIG.model,
      generationConfig: {
        maxOutputTokens: Math.max(AI_CONFIG.maxTokens, text.length * 2),
        temperature: 0.3, // Lower temperature for more consistent translations
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text().trim();

    return {
      translatedText,
      sourceLanguage,
      targetLanguage,
    };
  } catch (error) {
    throw error;
  }
};

const summarizeConversation = async (messages, summaryType = 'brief') => {
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error('Gemini API key not configured');
    if (!messages || messages.length === 0) throw new Error('Messages to summarize are required');

    const conversationText = messages
      .map(msg => {
        const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '';
        return `[${timestamp}] ${msg.sender}: ${msg.text}`;
      })
      .join('\n');

    const summaryInstructions = {
      brief: 'Provide a brief 1-2 sentence summary of the main points discussed.',
      detailed: 'Provide a detailed paragraph summarizing the conversation, including key points, decisions, and important details.',
      bullet: 'Provide a bullet-point summary of the main topics and key points discussed.',
    };

    const instruction = summaryInstructions[summaryType] || summaryInstructions.brief;

    const prompt = `Summarize the following conversation. ${instruction}

Conversation:
${conversationText}

Summary:`;

    const model = genAI.getGenerativeModel({ 
      model: AI_CONFIG.model,
      generationConfig: {
        maxOutputTokens: summaryType === 'detailed' ? 300 : AI_CONFIG.maxTokens,
        temperature: 0.5,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text().trim();

    return summary;
  } catch (error) {
    throw error;
  }
};

const detectLanguage = async (text) => {
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error('Gemini API key not configured');
    if (!text || !text.trim()) throw new Error('Text is required for language detection');

    const prompt = `Detect the language of the following text and respond with ONLY the ISO 639-1 language code (e.g., en, es, fr, de, hi, zh):\n\n${text}`;

    const model = genAI.getGenerativeModel({ 
      model: AI_CONFIG.model,
      generationConfig: {
        maxOutputTokens: 10,
        temperature: 0.1,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const languageCode = response.text().trim().toLowerCase();

    return {
      languageCode,
      text: text.substring(0, 100),
    };
  } catch (error) {
    throw error;
  }
};

const generateConversationStarters = async (context) => {
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error('Gemini API key not configured');

    const { chatType, chatName, recipientName } = context;
    
    let prompt;

    const strictOutputRules = "IMPORTANT: Output ONLY the 3 specific message options. Do not include numbering (1., 2., 3.), bullet points, greetings to me, or phrases like 'Here are the starters'. Just return the 3 lines of text. You can use emoji in the messages.";

    if (chatType === 'group') {
      prompt = `Generate 3 short friendly icebreakers to start a conversation in a new $ chat named "${chatName}". The tone should be welcoming and encourage members to start talking for the first time. ${strictOutputRules}`;
    } else {
      prompt = `Generate 3 short friendly conversation starters for a direct message with a new connection named ${recipientName || 'a new friend'}. The context is saying hello for the very first time, so make them engaging but polite. ${strictOutputRules}`;
    }

    const model = genAI.getGenerativeModel({ 
      model: AI_CONFIG.model,
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.8,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const starters = text
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim()) 
      .slice(0, 3);

    return starters;
  } catch (error) {
    throw error;
  }
};

const isConfigured = () => !!process.env.GEMINI_API_KEY;

module.exports = {
  generateSmartReplies,
  translateMessage,
  summarizeConversation,
  detectLanguage,
  generateConversationStarters,
  isConfigured,
};
