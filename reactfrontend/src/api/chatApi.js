import axiosClient from './axiosClient';

export const sendMessage = async (message) => {
  const response = await axiosClient.post('/chat/message', { message });
  return response.data;
};

export const getSuggestions = async () => {
  const response = await axiosClient.get('/chat/suggestions');
  return response.data.suggestions || [];
};

export const checkHealth = async () => {
  const response = await axiosClient.get('/chat/health');
  return response.data;
};