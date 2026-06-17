const dotenv = require('dotenv');
const { randomUUID } = require('crypto');
const { ChatGroq } = require('@langchain/groq');
const { ChatPromptTemplate, MessagesPlaceholder } = require("@langchain/core/prompts")
const { RunnableWithMessageHistory } = require('@langchain/core/runnables');
const { InMemoryChatMessageHistory } = require('@langchain/core/chat_history');
const { StringOutputParser } = require('@langchain/core/output_parsers');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

dotenv.config();

// Validate API key at startup
if (!process.env.AI_API_KEY) {
  console.warn('WARNING: AI_API_KEY not configured. AI chat stream will not work.');
}

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  apiKey: process.env.AI_API_KEY,
  temperature: parseFloat(process.env.GROQ_TEMPERATURE) || 0.7,
  streaming: true,
});

const SYSTEM_PROMPT = `
You are SwifTalk Assistant, a helpful, precise assistant.
Swifttalk is a Real time chat messaging app developed by Rushikesh supporting multiple AI features.
========================
OUTPUT FORMAT RULES
========================

ALWAYS respond using **Markdown** formatting.

- Use headings: ## and ###
- Use paragraphs with blank lines between them
- Use bullet lists with - or numbered lists with 1.
- Use **bold** and *italic* for emphasis
- Use tables with Markdown table syntax

NEVER output raw HTML tags like <div>, <p>, <ul>, <table>, etc.

========================
CODE RULES
========================

Inline code:
Use single backticks: \`example()\`

Code blocks:
Use triple backticks with a language identifier:

\`\`\`python
print("hello")
\`\`\`

========================
MATH RULES (VERY IMPORTANT)
========================

Use ONLY LaTeX math delimiters.

INLINE MATH (within a sentence):
Use single dollar signs: $E = mc^2$

DISPLAY/BLOCK MATH (standalone equation):
Use double dollar signs on their own lines:

$$
\\int_0^\\infty e^{{-x^2}} dx = \\frac{{\\sqrt{{\\pi}}}}{{2}}
$$

STRICT REQUIREMENTS:
- Every opening $ MUST have a closing $
- Every opening $$ MUST have a closing $$
- Never mix inline and block delimiters
- Never leave braces unmatched: every {{ must have a matching }}
- Every \\left must have a matching \\right
- Never generate partial or truncated equations

If uncertain about LaTeX correctness, prefer simpler valid LaTeX.

GOOD: $\\frac{{a+b}}{{c}}$
BAD: $\\frac{{a+b}}{{c$
BAD: $$x^2 + y^2 = z^2$$
BAD: $x^2 $$

========================
GENERAL RULES
========================

- Finish one complete thought/expression before starting another
- Structure responses clearly with headings for complex topics
- Keep explanations concise but thorough
`;
const prompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);

const parser = new StringOutputParser();

const chain = prompt.pipe(llm).pipe(parser);

const sessionStore = new Map();

function createSessionEntry(sessionId, userId, history = new InMemoryChatMessageHistory()) {
  return {
    session_id: sessionId,
    user_id: userId,
    created_at: new Date(),
    history,
  };
}

async function loadSessionToMemory(sessionId, conversation = [], userId = null) {
  const history = new InMemoryChatMessageHistory();

  if (Array.isArray(conversation) && conversation.length > 0 && typeof history.addMessages === 'function') {
    await history.addMessages(conversation);
  }

  sessionStore.set(sessionId, createSessionEntry(sessionId, userId, history));
  return history;
}

async function createSession(userId) {
  if (!userId) {
    throw new Error('User ID is required to create a session');
  }

  const sessionId = randomUUID();
  const history = new InMemoryChatMessageHistory();
  sessionStore.set(sessionId, createSessionEntry(sessionId, userId, history));

  await prisma.aISession.create({
    data: {
      session_id: sessionId,
      user_id: parseInt(userId, 10),
      title: `Chat - ${new Date().toLocaleDateString()}`,
      conversation: [],
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
    },
  });

  return {
    sessionId
  };
}

async function getOrCreateSession(userId, sessionId = null) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const numericUserId = parseInt(userId, 10);
  const normalizedSessionId = typeof sessionId === 'string' ? sessionId.trim() : sessionId;

  if (!normalizedSessionId || normalizedSessionId === 'null' || normalizedSessionId === 'undefined') {
    throw new Error('Session ID is required');
  }

  // Check if session exists and belongs to user
  const session = await prisma.aISession.findUnique({
    where: { session_id: normalizedSessionId },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  if (session.user_id !== numericUserId) {
    throw new Error('Session not found or unauthorized');
  }

  // Update last activity
  await prisma.aISession.update({
    where: { session_id: normalizedSessionId },
    data: { last_activity: new Date() },
  });

  // Load history from memory or database
  if (!sessionStore.has(normalizedSessionId)) {
    // Reload from database if not in memory
    await loadSessionToMemory(normalizedSessionId, session.conversation, session.user_id);
  }

  return normalizedSessionId;
}

async function deleteSession(userId, sessionId) {
  const session = await prisma.aISession.findUnique({
    where: { session_id: sessionId },
  });

  if (!session || session.user_id !== userId) {
    throw new Error('Unauthorized');
  }

  // Remove from memory
  sessionStore.delete(sessionId);

  // Remove from database
  await prisma.aISession.delete({
    where: { session_id: sessionId },
  });
}

async function saveSessionHistory(sessionId, history) {
  const messages = history.messages || [];

  const session = sessionStore.get(sessionId);
  if (session) {
    session.history = history;
    sessionStore.set(sessionId, session);
  }

  await prisma.aISession.update({
    where: { session_id: sessionId },
    data: {
      conversation: messages, // Store as JSON
      last_activity: new Date(),
    },
  });
}

function getSessionHistory(sessionId) {
  const session = sessionStore.get(sessionId);

  if (session?.history) {
    return session.history;
  }

  const history = new InMemoryChatMessageHistory();
  sessionStore.set(sessionId, createSessionEntry(sessionId, null, history));
  return history;
}

const withHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: getSessionHistory,
  inputMessagesKey: "input",
  historyMessagesKey: "history",
});

function startSession() {
  const sessionId = randomUUID();
  sessionStore.set(sessionId, createSessionEntry(sessionId, null, new InMemoryChatMessageHistory()));
  return { session_id: sessionId };
}

function resetSession(sessionId) {
  if (sessionStore.has(sessionId)) {
    sessionStore.delete(sessionId);
  }
  return startSession();
}

/**
 * Creates an async generator that yields chat stream chunks with error handling
 * @param {string} message - User message
 * @param {string} session_id - Session ID for message history
 * @returns {AsyncGenerator} Yields {type: 'chunk'|'error'|'end', data: string|error}
 */
async function* createChatStream(message, session_id) {
  let stream;

  try {
    // Validate inputs
    if (!message || !message.trim()) {
      throw new Error('Message is required and cannot be empty');
    }
    if (!session_id) {
      throw new Error('Session ID is required');
    }
    if (!process.env.AI_API_KEY) {
      throw new Error('AI_API_KEY is not configured');
    }

    const config = {
      configurable: {
        sessionId: session_id,
      },
    };

    stream = await withHistory.stream(
      {
        input: message.trim(),
      },
      config
    );

    // Iterate through stream and handle errors
    let chunkCount = 0;
    for await (const chunk of stream) {
      try {
        // Chunk is already a string from StringOutputParser
        if (chunk) {
          chunkCount += 1;
          yield {
            type: 'chunk',
            data: chunk,
          };
        }
      } catch (chunkError) {
        console.error('Error processing stream chunk:', chunkError);
        yield {
          type: 'error',
          data: 'Error processing response chunk',
          error: chunkError.message,
        };
        return;
      }
    }

    // Send completion signal
    yield {
      type: 'end',
      data: 'Stream completed',
    };
  } catch (error) {
    console.error('[AI Chat Stream] Stream creation error:', error);
    yield {
      type: 'error',
      data: error.message || 'Failed to create chat stream',
      error: error.message,
    };
  } finally {
    if (stream && typeof stream.return === 'function') {
      try {
        await stream.return();
      } catch (cleanupError) {
      }
    }
  }
}

const saveMessage = async (session_id, role, content) => {
  const session = await prisma.aISession.findUnique({
    where: { session_id },
    select: { conversation: true },
  });

  const history = Array.isArray(session?.conversation) ? session.conversation : [];

  const newEntry = {
    id: Date.now(),
    role,   // "user" | "assistant"
    content,
    timestamp: new Date().toISOString(),
  };

  await prisma.aISession.update({
    where: { session_id },
    data: {
      conversation: [...history, newEntry],
    },
  });

  return newEntry;
};

module.exports = {
  startSession,
  resetSession,
  createChatStream,
  saveMessage,
  createSession,
  getOrCreateSession,
  deleteSession,
  saveSessionHistory,
  getSessionHistory,
};