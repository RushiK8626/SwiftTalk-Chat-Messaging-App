const dotenv = require('dotenv');
const { ChatGroq } = require('@langchain/groq');
const {
  HumanMessage,
  SystemMessage,
} = require('@langchain/core/messages');

dotenv.config();

const MODEL_NAME = process.env.AI_MODEL;
const API_KEY = process.env.AI_API_KEY;

// Smart replies
const smartReplyModel = new ChatGroq({
  model: MODEL_NAME,
  apiKey: API_KEY,
  temperature: 0.7,
  maxTokens: 150,
});

// Translation
const translationModel = new ChatGroq({
  model: MODEL_NAME,
  apiKey: API_KEY,
  temperature: 0.2,
  maxTokens: 200,
});

// Summaries
const summaryModel = new ChatGroq({
  model: MODEL_NAME,
  apiKey: API_KEY,
  temperature: 0.5,
  maxTokens: 300,
});

// Language detection
const languageDetectionModel = new ChatGroq({
  model: MODEL_NAME,
  apiKey: API_KEY,
  temperature: 0.1,
  maxTokens: 10,
});

// Conversation starters
const conversationStarterModel = new ChatGroq({
  model: MODEL_NAME,
  apiKey: API_KEY,
  temperature: 0.8,
  maxTokens: 100,
});


const generateSmartReplies = async (
  messageHistory,
  count = 3
) => {
  try {
    if (!API_KEY) {
      throw new Error('Model API key not configured');
    }

    if (!messageHistory?.length) {
      throw new Error('Message history is required');
    }

    const conversationContext = messageHistory
      .slice(-10)
      .map(msg => `${msg.sender}: ${msg.text}`)
      .join('\n');

    const lastMessage =
      messageHistory[messageHistory.length - 1];

    const prompt = `
Based on the following conversation, suggest ${count} brief, natural, and contextually appropriate responses.

Conversation:
${conversationContext}

Generate ${count} different reply suggestions that would make sense as responses to the last message from ${lastMessage.sender}.

Return ONLY the suggestions, one per line, without numbering or formatting. You may use suitable emojis.
`;

    const result = await smartReplyModel.invoke([
      new SystemMessage(
        'You generate concise smart reply suggestions for chat applications.'
      ),
      new HumanMessage(prompt),
    ]);

    return result.content
      .trim()
      .split('\n')
      .filter(Boolean)
      .slice(0, count);
  } catch (error) {
    throw error;
  }
};

const translateMessage = async (
  text,
  targetLanguage,
  sourceLanguage = 'auto'
) => {
  try {
    if (!API_KEY) {
      throw new Error('AI API key not configured');
    }

    if (!text?.trim()) {
      throw new Error('Text to translate is required');
    }

    if (!targetLanguage) {
      throw new Error('Target language is required');
    }

    const languageNames = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      hi: 'Hindi',
      mr: 'Marathi',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      ar: 'Arabic',
      pt: 'Portuguese',
      ru: 'Russian',
      it: 'Italian',
    };

    const targetLangName =
      languageNames[targetLanguage.toLowerCase()] ||
      targetLanguage;

    const prompt =
      sourceLanguage === 'auto'
        ? `Translate the following text to ${targetLangName}. Return ONLY the translated text.

${text}`
        : `Translate the following text from ${languageNames[sourceLanguage] ||
        sourceLanguage
        } to ${targetLangName}. Return ONLY the translated text.

${text}`;

    const result = await translationModel.invoke([
      new SystemMessage(
        'You are a professional translator. Return only the translation without explanations.'
      ),
      new HumanMessage(prompt),
    ]);

    return {
      translatedText: result.content.trim(),
      sourceLanguage,
      targetLanguage,
    };
  } catch (error) {
    throw error;
  }
};

const summarizeConversation = async (
  messages,
  summaryType = 'brief'
) => {
  try {
    if (!API_KEY) {
      throw new Error('AI API key not configured');
    }

    if (!messages?.length) {
      throw new Error('Messages to summarize are required');
    }

    const conversationText = messages
      .map(msg => {
        const timestamp = msg.timestamp
          ? new Date(msg.timestamp).toLocaleString()
          : '';

        return `[${timestamp}] ${msg.sender}: ${msg.text}`;
      })
      .join('\n');

    const summaryInstructions = {
      brief:
        'Provide a brief 1-2 sentence summary.',
      detailed:
        'Provide a detailed summary including key decisions and discussion points.',
      bullet:
        'Provide a bullet-point summary.',
    };

    const prompt = `
${summaryInstructions[summaryType] || summaryInstructions.brief}

Conversation:
${conversationText}
`;

    const result = await summaryModel.invoke([
      new SystemMessage(
        'You are an expert conversation summarizer.'
      ),
      new HumanMessage(prompt),
    ]);

    return result.content.trim();
  } catch (error) {
    throw error;
  }
};

const detectLanguage = async text => {
  try {
    if (!API_KEY) {
      throw new Error('AI API key not configured');
    }

    if (!text?.trim()) {
      throw new Error(
        'Text is required for language detection'
      );
    }

    const result =
      await languageDetectionModel.invoke([
        new SystemMessage(
          'Detect the language and return ONLY the ISO 639-1 language code.'
        ),
        new HumanMessage(text),
      ]);

    return {
      languageCode: result.content
        .trim()
        .toLowerCase(),
      text: text.substring(0, 100),
    };
  } catch (error) {
    throw error;
  }
};

const generateConversationStarters = async context => {
  try {
    if (!API_KEY) {
      throw new Error('AI API key not configured');
    }

    const {
      chatType,
      chatName,
      recipientName,
    } = context;

    const strictOutputRules =
      'Output ONLY 3 messages. No numbering, bullets, titles, or explanations. One message per line.';

    let prompt;

    if (chatType === 'group') {
      prompt = `
Generate 3 short friendly icebreakers for a new group chat named "${chatName}".

${strictOutputRules}
`;
    } else {
      prompt = `
Generate 3 friendly conversation starters for a direct message with ${recipientName || 'a new friend'
        }.

${strictOutputRules}
`;
    }

    const result =
      await conversationStarterModel.invoke([
        new SystemMessage(
          'You create engaging conversation starters for chat applications.'
        ),
        new HumanMessage(prompt),
      ]);

    return result.content
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line =>
        line.replace(/^\d+\.\s*/, '').trim()
      )
      .slice(0, 3);
  } catch (error) {
    throw error;
  }
};


const isConfigured = () => Boolean(API_KEY);

module.exports = {
  generateSmartReplies,
  translateMessage,
  summarizeConversation,
  detectLanguage,
  generateConversationStarters,
  isConfigured,
};