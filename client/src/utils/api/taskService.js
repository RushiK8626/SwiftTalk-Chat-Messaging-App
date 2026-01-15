import axiosInstance from "./axiosInstance";

/**
 * Fetch tasks information by user ID
 * @param {number|string} userId - The user ID
 * @returns {Promise<Object>} Tasks data including title, description, meta and subtasks, etc.
 */
export const fetchUserTasks = async (userId) => {
  const response = await axiosInstance.get(`/api/tasks`);
  return response.data;
};

/**
 * Delete a single task
 * @param {number|string} taskID - The task ID
 * @returns {Promise<boolean>} True if successfull
 */
export const deleteTask = async (taskId) => {
  const response = await axiosInstance.delete(`/api/tasks/${taskId}`);
  return response.data;
};

/**
 * Update a status of the single task
 * @param {number|string} taskID - The task ID
 * @returns {Promise<boolean>} True if successfull
 */
export const updateTaskStatus = async (taskId, status) =>{
    const response = await axiosInstance.put(`/api/tasks/${taskId}`, {
        status
    });
    return response.data;
}