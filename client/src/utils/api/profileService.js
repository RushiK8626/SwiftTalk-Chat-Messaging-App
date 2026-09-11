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
 * @returns {Promise<Object>} personal profile data like username, fullname, email, etc
 */
export const fetchPersonalProfile = async (userId) => {
    const response = await axiosInstance.get(`/api/auth/me`);
    return response.data;
}

/**
 * Upload profile picture
 * @param {File} file - Image file to upload
 * @returns {Promise<Object>} Upload response with profile_pic and user details
 */
export const uploadProfilePicture = async (file) => {
    const formData = new FormData();
    formData.append("profilePic", file);

    const response = await axiosInstance.post("/uploads/profile-pic", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
}

/**
 * Update personal profile fields
 * @param {number|string} userId - The user ID
 * @param {Object} updatedFields - Fields to update (full_name, username, status_message)
 * @returns {Promise<Object>} Update response
 */
export const updateUserProfile = async (userId, updatedFields) => {
    const response = await axiosInstance.put(`/api/users/${userId}`, updatedFields);
    return response.data;
}