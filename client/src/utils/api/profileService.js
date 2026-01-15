import axiosInstance from "./axiosInstance";

/**
 * Fetch profile information by user ID
 * @param {number|string} userId - The user ID
 * @returns {Promise<Object>} Public profile data like username, fullname, etc
 */
export const fetchPublicProfile = async (userId) => {
    const response = await axiosInstance.get(`/api/users/public/id/${userId}`);
    return response.data;
}

/**
 * Fetch personal profile information by user ID
 * @param {number|string} userId - The user ID
 * @returns {Promise<Object>} personal profile data like username, fullname, email, mobile, etc
 */
export const fetchPersonalProfile = async (userId) => {
    const response = await axiosInstance.get(`/api/auth/me`);
    return response.data;
}