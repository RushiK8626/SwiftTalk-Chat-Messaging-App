/**
 * User Blocking Service
 * Handles all blocking/unblocking operations
 */

import axiosInstance from "./axiosInstance";

/**
 * Block a user
 * @param {number} blockedUserId - The ID of the user to block
 * @returns {Promise<Object>} Response data
 */
export const blockUser = async (blockedUserId) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.user_id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const response = await axiosInstance.post(`/api/users/${userId}/block`, { blockedUserId });
  return response.data;
};

/**
 * Unblock a user
 * @param {number} blockedUserId - The ID of the user to unblock
 * @returns {Promise<Object>} Response data
 */
export const unblockUser = async (blockedUserId) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.user_id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const response = await axiosInstance.delete(`/api/users/${userId}/unblock/${blockedUserId}`);
  return response.data;
};

/**
 * Get list of blocked users
 * @returns {Promise<Array>} List of blocked users
 */
export const getBlockedUsers = async () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.user_id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const response = await axiosInstance.get(`/api/users/${userId}/blocked`);
  return response.data;
};

/**
 * Check if a specific user is blocked
 * @param {number} targetUserId - The ID of the user to check
 * @returns {Promise<boolean>} True if the user is blocked
 */
export const isUserBlocked = async (targetUserId) => {
  try {
    const blockedUsers = await getBlockedUsers();
    return blockedUsers.some(
      (blockedUser) => blockedUser.blockedUser.user_id === targetUserId
    );
  } catch (error) {
    console.error("Error checking if user is blocked:", error);
    return false;
  }
};

export const checkBlockStatus = async (userId, otherUserId) => {
  const response = await axiosInstance.get(`/api/users/${userId}/block-status/${otherUserId}`);
  return response.data;
};

const blockingService = {
  blockUser,
  unblockUser,
  getBlockedUsers,
  isUserBlocked,
  checkBlockStatus,
};

export default blockingService;
