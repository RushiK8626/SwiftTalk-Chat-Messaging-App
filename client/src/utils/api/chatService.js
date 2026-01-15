/**
 * Chat Service - API functions for chat-related operations
 * Handles all chat, message, and member management API calls
 */

import axiosInstance from "./axiosInstance";

const API_BASE_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:3001"
).replace(/\/+$/, "");

/**
 * Fetch chat information by chat ID
 * @param {number|string} chatId - The chat ID
 * @returns {Promise<Object>} Chat data including members, admins, etc.
 */
export const fetchChatInfo = async (chatId) => {
  const response = await axiosInstance.get(`/api/chats/${chatId}`);
  return response.data;
};

/**
 * Fetch messages for a chat
 * @param {number|string} chatId - The chat ID
 * @param {number|string} userId - The current user ID
 * @returns {Promise<Object>} Messages data
 */
export const fetchChatMessages = async (chatId, userId) => {
  const response = await axiosInstance.get(
    `/api/messages/chat/${chatId}?userId=${encodeURIComponent(String(userId))}`
  );
  return response.data;
};

/**
 * Fetch user profile by user ID
 * @param {number|string} userId - The user ID to fetch
 * @returns {Promise<Object|null>} User data or null if not found
 */
export const fetchUserProfileById = async (userId) => {
  try {
    const response = await axiosInstance.get(`/api/users/public/id/${userId}`);
    const userData = response.data.user;

    // Convert profile_pic to full URL if it exists
    if (userData?.profile_pic) {
      const filename = userData.profile_pic.split("/uploads/").pop();
      userData.profile_pic = `${API_BASE_URL}/uploads/profiles/${filename}`;
    }

    return userData;
  } catch (error) {
    return null;
  }
};

/**
 * Fetch chat image with authentication
 * @param {string} imagePath - The image path from chat info
 * @returns {Promise<string|null>} Blob URL or null if failed
 */
export const fetchChatImage = async (imagePath) => {
  if (!imagePath) return null;

  try {
    const filename = imagePath.split("/uploads/").pop();
    const response = await axiosInstance.get(
      `/uploads/chat-images/${filename}`,
      {
        responseType: 'blob',
      }
    );

    if (response.data) {
      return URL.createObjectURL(response.data);
    }
    return null;
  } catch (err) {
    console.error("Error fetching chat image:", err);
    return null;
  }
};

/**
 * Delete a single message (for self)
 * @param {number|string} messageId - The message ID to delete
 * @returns {Promise<boolean>} True if successful
 */
export const deleteMessage = async (messageId) => {
  try {
    await axiosInstance.delete(`/api/messages/${messageId}`);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Delete multiple messages (batch delete for self)
 * @param {Array<number>} messageIds - Array of message IDs to delete
 * @returns {Promise<Object>} Response with deletedCount
 */
export const deleteMessagesBatch = async (messageIds) => {
  const response = await axiosInstance.delete(`/api/messages/batch`, {
    data: { message_ids: messageIds },
  });
  return response.data;
};

/**
 * Clear all messages in a chat (for self)
 * @param {number|string} chatId - The chat ID to clear
 * @returns {Promise<Object>} Response with deletedCount
 */
export const clearChat = async (chatId) => {
  const response = await axiosInstance.delete(`/api/messages/chat/${chatId}/clear`);
  return response.data;
};

/**
 * Search for users (for adding to group)
 * @param {string} query - Search query
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @returns {Promise<Array>} Array of user objects
 */
export const searchUsers = async (query, page = 1, limit = 10) => {
  const response = await axiosInstance.get(
    `/api/users/public/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
  );

  // Process profile pictures to full URLs
  const usersWithPics = (response.data.users || []).map((user) => {
    if (user.profile_pic) {
      const filename = user.profile_pic.split("/uploads/").pop();
      user.profile_pic = `${API_BASE_URL}/uploads/profiles/${filename}`;
    }
    return user;
  });

  return usersWithPics;
};

/**
 * Add a member to a group chat
 * @param {number|string} chatId - The chat ID
 * @param {number|string} userId - The user ID to add
 * @returns {Promise<Object>} Response data
 */
export const addMemberToGroup = async (chatId, userId) => {
  const response = await axiosInstance.post(`/api/chats/${chatId}/members`, {
    user_id: userId,
  });
  return response.data;
};

/**
 * Remove a member from a group chat (or exit group)
 * @param {number|string} chatId - The chat ID
 * @param {number|string} userId - The user ID to remove
 * @returns {Promise<boolean>} True if successful
 */
export const removeMemberFromGroup = async (chatId, userId) => {
  try {
    await axiosInstance.delete(`/api/chats/${chatId}/members/${userId}`);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Exit from a group chat (alias for removeMemberFromGroup with current user)
 * @param {number|string} chatId - The chat ID
 * @param {number|string} userId - The current user ID
 * @returns {Promise<boolean>} True if successful
 */
export const exitGroup = async (chatId, userId) => {
  return removeMemberFromGroup(chatId, userId);
};

/**
 * Exit from a group chat using the exit endpoint
 * @param {number|string} chatId - The chat ID
 * @returns {Promise<Object>} Response data
 */
export const exitGroupChat = async (chatId) => {
  const response = await axiosInstance.post(`/api/chats/${chatId}/exit`);
  return response.data;
};

/**
 * Create a new chat (private or group)
 * @param {string} chatType - The chat type ('private' or 'group')
 * @param {Array<number>} memberIds - Array of member user IDs
 * @param {string} chatName - Optional chat name (for groups)
 * @returns {Promise<Object>} Created chat data
 */
export const createChat = async (chatType, memberIds, chatName = null) => {
  const payload = {
    chat_type: chatType,
    member_ids: memberIds,
  };
  if (chatName) {
    payload.chat_name = chatName;
  }
  const response = await axiosInstance.post(`/api/chats/`, payload);
  return response.data;
};

/**
 * Fetch active chats for a user (chat visibility)
 * @param {number|string} userId - The user ID
 * @returns {Promise<Object>} Chats data with array of chats
 */
export const fetchActiveChats = async (userId) => {
  const response = await axiosInstance.get(`/api/chat-visibility/active/${userId}`);
  return response.data;
};

/**
 * Mark all messages in a chat as read
 * @param {number|string} chatId - The chat ID
 * @param {number|string} userId - The user ID
 * @returns {Promise<Object>} Response data
 */
export const markChatAsRead = async (chatId, userId) => {
  const response = await axiosInstance.put(`/api/messages/chat/${chatId}/read-all/${userId}`);
  return response.data;
};

/**
 * Pin or unpin a chat
 * @param {number|string} chatId - The chat ID
 * @param {boolean} pin - True to pin, false to unpin
 * @returns {Promise<Object>} Response data
 */
export const toggleChatPin = async (chatId, pin) => {
  const action = pin ? 'pin' : 'unpin';
  const response = await axiosInstance.put(`/api/chat-visibility/${chatId}/${action}`);
  return response.data;
};

/**
 * Delete a chat (hide from visibility)
 * @param {number|string} chatId - The chat ID
 * @returns {Promise<Object>} Response data
 */
export const deleteChat = async (chatId) => {
  const response = await axiosInstance.delete(`/api/chat-visibility/${chatId}`);
  return response.data;
};

/**
 * Batch delete multiple chats
 * @param {Array<number>} chatIds - Array of chat IDs to delete
 * @returns {Promise<Object>} Response data
 */
export const batchDeleteChats = async (chatIds) => {
  const response = await axiosInstance.post(`/api/chat-visibility/batch/delete`, {
    chatIds,
  });
  return response.data;
};

/**
 * Batch mark multiple chats as read
 * @param {Array<number>} chatIds - Array of chat IDs to mark as read
 * @returns {Promise<Object>} Response data
 */
export const batchMarkChatsAsRead = async (chatIds) => {
  const response = await axiosInstance.post(`/api/chat-visibility/batch/mark-read`, {
    chatIds,
  });
  return response.data;
};

/**
 * Batch pin multiple chats
 * @param {Array<number>} chatIds - Array of chat IDs to pin
 * @returns {Promise<Object>} Response data
 */
export const batchPinChats = async (chatIds) => {
  const response = await axiosInstance.post(`/api/chat-visibility/batch/pin`, {
    chatIds,
  });
  return response.data;
};
