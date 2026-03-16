const API_URL = 'http://localhost:8080/api';

export const apiService = {
  async getStatus() {
    try {
      const response = await fetch(`${API_URL}/status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching status:', error);
      throw error;
    }
  },

  async sendChatMessage(message, context = {}) {
    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, context }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  },

  async setRepo(path) {
    try {
      const response = await fetch(`${API_URL}/set_repo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error setting repository:', error);
      throw error;
    }
  },

  async getGraph() {
    try {
      const response = await fetch(`${API_URL}/graph`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching git graph:', error);
      throw error;
    }
  },

  async selectDirectory() {
    try {
      const response = await fetch(`${API_URL}/select_directory`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error opening directory dialog:', error);
      throw error;
    }
  }
};
