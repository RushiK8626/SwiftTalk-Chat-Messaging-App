import React, { useState } from 'react';
import { X, Trash2, MessageSquare, Clock, Plus } from 'lucide-react';
import './SessionsList.css';

const SessionsList = ({ sessions, currentSessionId, onSelectSession, onDeleteSession, onNewChat, onClose }) => {
  const [hoveredSessionId, setHoveredSessionId] = useState(null);
  const [deletingSessionId, setDeletingSessionId] = useState(null);

  const handleDeleteClick = (e, sessionId) => {
    e.stopPropagation();
    if (window.confirm('Delete this session?')) {
      setDeletingSessionId(sessionId);
      onDeleteSession(sessionId);
    }
  };

  const handleSessionClick = (sessionId) => {
    onSelectSession(sessionId);
  };

  return (
    <div className="sessions-list-container">
      <div className="sessions-list-header">
        <div className="sessions-list-title">
          <MessageSquare size={20} />
          <h3>Chat History</h3>
          <span className="session-count">{sessions.length}</span>
        </div>
        <div className="sessions-list-actions">
          <button
            className="sessions-list-new-btn"
            onClick={onNewChat}
            title="Start a new chat"
          >
            <Plus size={18} />
            <span className="sessions-list-new-btn-text">New chat</span>
          </button>
          <button
            className="sessions-list-close-btn"
            onClick={onClose}
            title="Close sessions panel"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="sessions-list-content">
        {sessions.length === 0 ? (
          <div className="sessions-empty-state">
            <MessageSquare size={40} />
            <p>No chat sessions yet</p>
            <span>Start a new conversation to see it here</span>
          </div>
        ) : (
          <div className="sessions-scroll">
            {sessions.map((session) => (
              <div
                key={session.session_id}
                className={`session-item ${currentSessionId === session.session_id ? 'active' : ''
                  } ${deletingSessionId === session.session_id ? 'deleting' : ''}`}
                onClick={() => handleSessionClick(session.session_id)}
                onMouseEnter={() => setHoveredSessionId(session.session_id)}
                onMouseLeave={() => setHoveredSessionId(null)}
              >
                <div className="session-item-content">
                  <div className="session-icon">
                    <MessageSquare size={16} />
                  </div>
                  <div className="session-info">
                    <h4 className="session-title">{session.title}</h4>
                    <div className="session-meta">
                      <Clock size={12} />
                      <span className="session-time">{session.relative_time}</span>
                    </div>
                  </div>
                </div>

                {(hoveredSessionId === session.session_id ||
                  currentSessionId === session.session_id) && (
                    <button
                      className="session-delete-btn"
                      onClick={(e) => handleDeleteClick(e, session.session_id)}
                      title="Delete session"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsList;
