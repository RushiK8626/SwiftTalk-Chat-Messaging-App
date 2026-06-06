import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Sparkles, Copy, Edit, Trash2, Redo2, Languages, X, History } from 'lucide-react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import MessageRenderer from '../../components/messages/messageRenderer';
import { streamAIMessage, AI_ASSISTANT, loadSession, createNewSession, deleteSession as deleteAISession, getSessionList } from '../../utils/api/aiClient';
import { aiSessionQueryOptions, aiSessionListQueryOptions, aiKeys } from '../../utils/api/chatQueries';
import { getSidebarWidth, setSidebarWidth, SIDEBAR_CONFIG } from '../../utils/storage';
import useContextMenu from "../../hooks/useContextMenu";
import ContextMenu from "../../components/common/ContextMenu";
import { translateText } from "../../utils/api";
import MessageTranslator from "../../components/modals/MessageTranslator";
import SessionsList from "../../components/modals/SessionsList";
import { useToast } from "../../hooks/useToast";
import useResponsive from '../../hooks/useResponsive';
import useSplitPane from "../../hooks/useSplitPane";
import './ChatWindow.css';
import './AIChatWindow.css';

const AIChatWindow = ({ onClose, isEmbedded = false }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isWideScreen = useResponsive();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const { paneWidth: rightPanelWidth, startDragging, isDragging } = useSplitPane(
    getSidebarWidth(),
    {
      minWidth: SIDEBAR_CONFIG.MIN_WIDTH,
      maxWidth: SIDEBAR_CONFIG.MAX_WIDTH,
      edge: "right",
    }
  );

  const [messageEditing, setMessageEditing] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessage, setEditingMessage] = useState('');

  const messageContextMenu = useContextMenu();
  const [selectedMessage, setSelectedMessage] = useState(null);

  const { showError } = useToast();

  const [showTranslator, setShowTranslator] = useState(false);
  const [translateMessage, setTranslateMessage] = useState(null);
  const [messageTranslations, setMessageTranslations] = useState({});

  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [userSessions, setUserSessions] = useState([]);
  const [showSessionsList, setShowSessionsList] = useState(false);

  const getDefaultSessionTitle = () => `Chat - ${new Date().toLocaleDateString()}`;

  const buildNewChatSession = (sessionId = null, title = 'New Chat') => ({
    title,
    session_id: sessionId,
    created_at: new Date().toISOString(),
  });

  const setNewChatSessionInList = (sessionId = null, title = 'New Chat') => {
    setUserSessions(prev => {
      const withoutTemp = prev.filter(session => session.session_id != null);
      return [buildNewChatSession(sessionId, title), ...withoutTemp];
    });
  };

  const removeNewChatSessionFromList = () => {
    setUserSessions(prev => prev.filter(session => session.session_id != null));
  };

  const readSseStream = async (response, assistantMessageId) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let assistantText = '';
    let receivedFirstChunk = false;

    const updateAssistantMessage = (content) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
              ...msg,
              content,
            }
            : msg
        )
      );
    };

    const handleEvent = (eventName, data) => {
      if (eventName === 'chunk') {
        const chunkText = data?.chunk ?? '';
        if (!receivedFirstChunk) {
          receivedFirstChunk = true;
          setLoading(false);
        }

        assistantText += chunkText;

        updateAssistantMessage(assistantText);
      }

      if (eventName === 'end') {
        setStreaming(false);
        setLoading(false);
      }

      if (eventName === 'error') {
        setStreaming(false);
        setLoading(false);
        throw new Error(data?.details || data?.error || 'AI stream error');
      }
    };

    const processBuffer = () => {
      let eventBoundary = buffer.indexOf('\n\n');

      while (eventBoundary !== -1) {
        const eventBlock = buffer.slice(0, eventBoundary);
        buffer = buffer.slice(eventBoundary + 2);

        const eventLines = eventBlock.split('\n');
        const eventNameLine = eventLines.find((line) => line.startsWith('event:'));
        const dataLines = eventLines
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart());

        const eventName = eventNameLine ? eventNameLine.slice(6).trim() : 'message';

        for (const raw of dataLines) {
          if (!raw) {
            continue;
          }

          let parsedData;
          try {
            parsedData = JSON.parse(raw);
          } catch {
            parsedData = raw;
          }

          handleEvent(eventName, parsedData);
        }

        eventBoundary = buffer.indexOf('\n\n');
      }
    };

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        buffer += decoder.decode();
        processBuffer();
        setStreaming(false);
        setLoading(false);
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      processBuffer();
    }

    return assistantText;
  };

  const ensureSessionId = async () => {
    const existingSessionId = currentSessionId || localStorage.getItem('ai_session_id');

    if (existingSessionId) {
      return existingSessionId;
    }

    const newSession = await createNewSession();
    const sessionId = newSession?.sessionId || newSession?.session_id;

    if (!sessionId) {
      throw new Error('Failed to create chat session');
    }

    localStorage.setItem('ai_session_id', sessionId);
    setCurrentSessionId(sessionId);
    setNewChatSessionInList(sessionId, getDefaultSessionTitle());

    return sessionId;
  };

  // Load sessions on component mount — reads from React Query cache if prefetched
  useEffect(() => {
    const initializeSession = async () => {
      try {
        let sessionId = localStorage.getItem('ai_session_id');

        setCurrentSessionId(sessionId);

        if (sessionId) {
          try {
            // Try React Query cache first (populated by prefetch on hover)
            const cachedSession = queryClient.getQueryData(aiKeys.session(sessionId));
            if (cachedSession) {
              setMessages(cachedSession.conversation || []);
            } else {
              // Cache miss — fetch via query and populate cache
              const sessionData = await queryClient.fetchQuery(aiSessionQueryOptions(sessionId));
              if (sessionData) {
                setMessages(sessionData.conversation || []);
              }
            }
          } catch (loadError) {
            console.warn('Could not load existing session messages:', loadError);
            setMessages([]);
          }
        }

        // Get all sessions — try cache first
        try {
          const cachedSessions = queryClient.getQueryData(aiKeys.sessionList);
          const userSessionsData = cachedSessions || await queryClient.fetchQuery(aiSessionListQueryOptions());
          if (userSessionsData && Array.isArray(userSessionsData)) {
            setUserSessions(sessionId ? userSessionsData : [buildNewChatSession(), ...userSessionsData]);
          }
        } catch (sessionsError) {
          console.warn('Could not load sessions list:', sessionsError);
          setUserSessions(sessionId ? [] : [buildNewChatSession()]);
        }
      } catch (error) {
        console.error('Session init error:', error);
        showError?.('Failed to initialize chat');
      }
    };

    initializeSession();
  }, [showError, queryClient]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ai_chat_history', JSON.stringify(messages.slice(-100)));
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    setSidebarWidth(rightPanelWidth);
  }, [rightPanelWidth]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleSend = async (message) => {
    if ((!inputText.trim() && (!message || !message.trim())) || loading || streaming) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputText.trim() || message.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    setStreaming(true);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const assistantMessageId = Date.now() + 1;

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date().toISOString(),
        },
      ]);

      const sessionId = await ensureSessionId();
      const response = await streamAIMessage(userMessage.content, sessionId);

      if (!response.ok) {
        throw new Error(`AI stream request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      await readSseStream(response, assistantMessageId);
    } catch (error) {
      setStreaming(false);
      setLoading(false);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            "Sorry, I encountered an error. Please try again. " +
            (error.message || ""),
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (id) => {
    const messageIndex = messages.findIndex(m => m.id === id);
    if (messageIndex === -1) return;

    const updatedHistory = messages.slice(0, messageIndex);
    const editedMessage = {
      ...messages[messageIndex],
      content: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    const finalMessages = [...updatedHistory, editedMessage];
    setMessages(finalMessages);

    setEditingMessage(null);
    setEditingMessageId(null);
    setMessageEditing(false);
    setInputText('');
    setLoading(true);
    setStreaming(true);


    try {
      const sessionId = await ensureSessionId();
      const apiHistory = finalMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
      const response = await streamAIMessage(editedMessage.content, sessionId, apiHistory);
      if (!response.ok || !response.body) {
        throw new Error(`AI stream request failed with status ${response.status}`);
      }

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };
      setMessages([...finalMessages, aiMessage]);

      await readSseStream(response, aiMessage.id);
    } catch (error) {
      setStreaming(false);
      setLoading(false);
      setMessages(finalMessages);
    } finally {
      setStreaming(false);
      setLoading(false);
    }
  };

  const handleCopyMessage = () => {
    if (selectedMessage?.content) {
      navigator.clipboard.writeText(selectedMessage.content)
        .then(() => {
          messageContextMenu.closeMenu();
        })
        .catch((err) => {
          messageContextMenu.closeMenu();
        });
    }
  };

  const handleEditMessage = () => {
    if (selectedMessage?.role === 'user' && selectedMessage?.content) {
      setMessageEditing(true);
      setEditingMessage(selectedMessage.content);
      setInputText(selectedMessage.content);
      setEditingMessageId(selectedMessage.id);
      messageContextMenu.closeMenu();
    }
  };

  const handleRegenerateMessage = () => {
    if (selectedMessage?.role === 'assistant' && selectedMessage?.id) {
      messageContextMenu.closeMenu();

      const messageIndex = messages.findIndex(m => m.id === selectedMessage.id);
      if (messageIndex !== -1) {
        const updatedMessages = messages.slice(0, messageIndex);
        setMessages(updatedMessages);
        setLoading(true);
        setStreaming(true);

        const userMessage = updatedMessages[updatedMessages.length - 1];
        if (userMessage?.role === 'user') {
          const conversationHistory = updatedMessages.slice(0, -1).map(m => ({
            role: m.role,
            content: m.content,
          }));

          ensureSessionId()
            .then((sessionId) => streamAIMessage(userMessage.content, sessionId, conversationHistory))
            .then(async (response) => {
              if (!response.ok || !response.body) {
                throw new Error(`AI stream request failed with status ${response.status}`);
              }

              const aiMessageId = Date.now() + 1;
              setMessages(prev => [...prev, {
                id: aiMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date().toISOString(),
              }]);

              await readSseStream(response, aiMessageId);
            })
            .catch((error) => {
              setStreaming(false);
              setLoading(false);

              setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                content: 'Failed to regenerate response. Please try again.',
                timestamp: new Date().toISOString(),
                isError: true,
              }]);
            })
            .finally(() => {
              setStreaming(false);
              setLoading(false);
            });
        }
      }
    }
  };

  const getDefaultTranslationLanguage = () => {
    return localStorage.getItem("defaultTranslationLanguage") || "en";
  };

  const handleTranslateMessage = async (message, targetLanguage) => {
    if (!message?.content) return;

    const messageId = message.id;

    setMessageTranslations(prev => ({
      ...prev,
      [messageId]: { text: '', lang: targetLanguage, loading: true }
    }));

    try {
      const result = await translateText(message.content, targetLanguage);
      const translatedText = result.translatedText || result.translated_text || '';

      setMessageTranslations(prev => ({
        ...prev,
        [messageId]: { text: translatedText, lang: targetLanguage, loading: false }
      }));
    } catch (error) {
      console.error('Translation error:', error);
      showError('Translation failed. Please try again.');
      setMessageTranslations(prev => {
        const newTranslations = { ...prev };
        delete newTranslations[messageId];
        return newTranslations;
      });
    }
  };

  const handleShowOriginal = (messageId) => {
    setMessageTranslations(prev => {
      const newTranslations = { ...prev };
      delete newTranslations[messageId];
      return newTranslations;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (messageEditing) {
        handleEditSubmit(editingMessageId);
      } else {
        handleSend();
      }
    }
  };

  const clearChat = async () => {
    if (window.confirm('Clear this conversation?')) {
      if (currentSessionId) {
        await deleteAISession(currentSessionId);
      }

      localStorage.removeItem('ai_session_id');
      localStorage.removeItem('ai_chat_history');
      setCurrentSessionId(null);
      setMessages([]);
      setNewChatSessionInList();
    }
  };

  const handleSelectSession = async (sessionId) => {
    try {
      setMessages([]);
      if (!sessionId) {
        setCurrentSessionId(null);
        localStorage.removeItem('ai_session_id');
        setNewChatSessionInList();
        return;
      }

      removeNewChatSessionFromList();
      localStorage.setItem('ai_session_id', sessionId);
      setCurrentSessionId(sessionId);

      if (sessionId) {
        try {
          const sessionData = await loadSession(sessionId);
          if (sessionData) {
            setMessages(sessionData.conversation || []);
          }
        } catch (loadError) {
          console.warn('Could not load existing session messages:', loadError);
          setMessages([]);
        }
      }

      // Close sessions list on mobile after selection
      if (!isWideScreen) {
        setShowSessionsList(false);
      }
    } catch (error) {
      console.error('Session selection error:', error);
      showError('Failed to load session');
    }
  };

  const handleNewChat = async () => {
    try {

      localStorage.removeItem('ai_session_id');
      localStorage.removeItem('ai_chat_history');
      setCurrentSessionId(null);
      setMessages([]);
      setNewChatSessionInList();

      if (!isWideScreen) {
        setShowSessionsList(false);
      }
    } catch (error) {
      console.error('New chat error:', error);
      showError?.('Failed to start a new chat');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      if (!sessionId) {
        removeNewChatSessionFromList();
        setCurrentSessionId(null);
        setMessages([]);
        localStorage.removeItem('ai_session_id');
        return;
      }

      await deleteAISession(sessionId);

      setUserSessions(prev => prev.filter(s => s.session_id !== sessionId));

      if (currentSessionId === sessionId) {
        localStorage.removeItem('ai_session_id');
        setCurrentSessionId(null);
        setMessages([]);
        setNewChatSessionInList();
      }
    } catch (error) {
      console.error('Session deletion error:', error);
      showError('Failed to delete session');
    }
  };

  useEffect(() => {
    if (
      !isEmbedded &&
      isWideScreen &&
      typeof window !== "undefined" &&
      window.innerWidth >= 900
    ) {
      navigate("/chats", { state: { showAIChat: true } });
    }
  }, [isWideScreen, isEmbedded, navigate]);

  const handleBack = () => {
    if (isEmbedded && onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const getMessageContextMenuItems = (message) => {
    const isPrompt = message?.role === 'user';
    const defaultLang = getDefaultTranslationLanguage();

    const items = [
      {
        id: "copy",
        label: "Copy",
        icon: <Copy size={16} />,
        onClick: handleCopyMessage,
      },
    ];

    if (isPrompt) {
      items.push({
        id: "edit",
        label: "Edit",
        icon: <Edit size={16} />,
        onClick: handleEditMessage,
        disabled: !message?.content,
      });
    }
    else {
      items.push({
        id: "regernate",
        label: "Regenerate",
        icon: <Redo2 size={16} />,
        onClick: handleRegenerateMessage,
        disabled: !message?.content,
      });

      items.push({
        id: "translate-default",
        label: "Translate",
        icon: <Languages size={16} />,
        onClick: () => {
          handleTranslateMessage(message, defaultLang);
          messageContextMenu.closeMenu();
        },
        disabled: !message?.content,
      });

      items.push({
        id: "translate-to",
        label: "Translate to...",
        icon: <Languages size={16} />,
        onClick: () => {
          setTranslateMessage(message);
          setShowTranslator(true);
          messageContextMenu.closeMenu();
        },
        disabled: !message?.content,
      });
    }
    return items;
  };

  const handleMessageContextMenu = (e, message) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedMessage(message);

    const menuWidth = 280;
    const menuHeight = 300;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 16;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 16;
    }

    messageContextMenu.setMenu({ isOpen: true, x, y });
  };

  return (
    <div className={`chat-window ai-chat-window ${isEmbedded ? 'embedded' : ''}`}>
      <div
        className="ai-chat-main-container"
        ref={containerRef}
        style={
          isWideScreen
            ? { gridTemplateColumns: `minmax(0, 1fr) 10px ${rightPanelWidth}px` }
            : {}
        }
      >
        <div className="ai-chat-content-pane">
          <div className="chat-window-header ai-header">
            {!isEmbedded && (
              <button className="back-btn" onClick={handleBack}>
                <ArrowLeft size={24} />
              </button>
            )}
            <div className="header-info">
              <div className="chat-avatar-small ai-chat-avatar">
                <Sparkles size={24} />
              </div>
              <div className="header-text">
                <h2>{AI_ASSISTANT.name}</h2>
                <span className="status-text">Always available</span>
              </div>
            </div>
            <div className="header-actions">
              <button
                className="history-btn"
                onClick={() => setShowSessionsList(!showSessionsList)}
                title="Chat history"
              >
                <History size={20} />
              </button>
              <button
                className="clear-chat-btn"
                onClick={clearChat}
                title="Clear chat history"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          <SimpleBar className="messages-container">
            {messages.length === 0 && (
              <div className="ai-welcome">
                <div className="ai-welcome-icon">
                  <Sparkles size={48} />
                </div>
                <h3>Hi! I'm your AI Assistant</h3>
                <p>Ask me anything - I can help with questions, coding, writing, and more!</p>
                <div className="ai-suggestions">
                  <button onClick={() => handleSend("What can you help me with?")}>
                    What can you help me with?
                  </button>
                  <button onClick={() => handleSend("Tell me a fun fact")}>
                    Tell me a fun fact
                  </button>
                  <button onClick={() => handleSend("Help me write a message")}>
                    Help me write a message
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const hasTranslation = messageTranslations[msg?.id];
              const showTranslated = hasTranslation && !hasTranslation.loading;
              const displayText = showTranslated ? hasTranslation.text : msg.content;
              const isPendingAssistantMessage = msg.role === 'assistant' && !msg.content?.trim();

              if (isPendingAssistantMessage && loading) {
                return null;
              }

              return (
                <div
                  key={msg.id}
                  className={`message ${msg.role === 'user' ? 'message-sent' : 'message-received'} ${msg.isError ? 'error' : ''}`}

                  onContextMenu={(e) => {
                    handleMessageContextMenu(e, msg);
                  }}
                  onTouchStart={() => setSelectedMessage(msg)}
                  onTouchEnd={(e) => messageContextMenu.handleLongPress(e, 500)}
                >
                  {msg.role === 'assistant' && (
                    <div className="ai-msg-avatar">
                      <Sparkles size={16} />
                    </div>
                  )}

                  <div className="message-bubble">
                    {hasTranslation?.loading && (
                      <div className="translation-loading">
                        <span>Translating...</span>
                      </div>
                    )}

                    <div className="message-text">
                      {msg.role === 'assistant' ? (
                        <MessageRenderer content={displayText} />
                      ) : (
                        displayText
                      )}
                    </div>

                    {hasTranslation && !hasTranslation.loading && (
                      <div className="translation-info">
                        <span className="translation-badge">
                          <Languages size={12} />
                          Translated to {hasTranslation.lang.toUpperCase()}
                        </span>
                        <button
                          className="see-original-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowOriginal(msg.id);
                          }}
                          title="Show original message"
                        >
                          See original
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="message message-received ai-loading-message">
                <div className="ai-msg-avatar">
                  <Sparkles size={16} />
                </div>
                <div className="message-bubble typing-bubble ai-thinking-bubble">
                  <div className="ai-thinking-content">
                    <div className="ai-thinking-orbs" aria-hidden="true">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <div className="ai-thinking-copy">
                      <span className="ai-thinking-label">Thinking</span>
                      <span className="ai-thinking-subtext">Crafting a response...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </SimpleBar>

          <div className={`message-input-container ${messageEditing ? 'editing-mode' : ''}`}>
            {messageEditing && (
              <div className="edit-indicator">
                <div className="edit-label">
                  <Edit size={16} className="edit-icon" />
                  <span>Editing message</span>
                </div>
                <button className="cancel-edit" onClick={() => {
                  setMessageEditing(false);
                  setEditingMessageId(null);
                  setEditingMessage('');
                  setInputText('');
                }} title="Cancel editing">
                  <X size={20} />
                </button>
              </div>
            )}

            <div className="message-input-wrapper">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={"Message AI Assistant..."}
                rows={1}
                disabled={loading || streaming}
              />
              <button
                className={`send-button ${(inputText.trim() && !loading && !streaming) ? 'active' : ''}`}
                onClick={messageEditing ? () => handleEditSubmit(editingMessageId) : handleSend}
                disabled={!inputText.trim() || loading || streaming || inputText === editingMessage}
              >
                {messageEditing ? <Sparkles size={20} /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </div>

        {isWideScreen && (
          <div
            className={`ai-chat-divider ${isDragging ? "active" : ""}`}
            onMouseDown={startDragging}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize AI chat sessions panel"
          />
        )}

        <div
          className={`sessions-list-wrapper ${showSessionsList ? 'active' : ''}`}
          style={
            isWideScreen
              ? { width: `${rightPanelWidth}px` }
              : {}
          }
        >
          <SessionsList
            sessions={userSessions}
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            onNewChat={handleNewChat}
            onClose={() => setShowSessionsList(false)}
          />
        </div>
      </div>

      <ContextMenu
        isOpen={messageContextMenu.isOpen}
        x={messageContextMenu.x}
        y={messageContextMenu.y}
        items={getMessageContextMenuItems(selectedMessage)}
        onClose={messageContextMenu.closeMenu}
      />

      {showTranslator && translateMessage && (
        <MessageTranslator
          messageText={translateMessage.content}
          messageId={translateMessage.id}
          onClose={() => {
            setShowTranslator(false);
            setTranslateMessage(null);
          }}
          onTranslate={(msgId, translatedText, lang) => {
            setMessageTranslations(prev => ({
              ...prev,
              [msgId]: { text: translatedText, lang: lang, loading: false }
            }));
          }}
        />
      )}

    </div>
  );
};

export default AIChatWindow;