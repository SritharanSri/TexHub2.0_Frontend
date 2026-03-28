import api from './api';

export const chatService = {
  getMessages: async (orderId) => {
    try {
      const response = await api.get(`/messages/order/${orderId}`);
      return response;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },
  
  sendMessage: async (orderId, content, receiverId) => {
    try {
      const payload = { orderId, content }
      if (receiverId) payload.receiverId = receiverId
      const response = await api.post('/messages', payload)
      return response
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }
};
