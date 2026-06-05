import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const calculatorService = {
  async addChar(char: string): Promise<{ expression: string; result?: number }> {
    try {
      const response = await axios.post(`${BASE_URL}/add-char`, { char });
      return response.data;
    } catch (error) {
      throw new Error('Failed to add character to expression');
    }
  },

  async handleOperation(operator: string): Promise<{ expression: string; result?: number }> {
    try {
      const response = await axios.post(`${BASE_URL}/handle-operation`, { operator });
      return response.data;
    } catch (error) {
      throw new Error('Failed to handle operation');
    }
  },

  async evaluateExpression(): Promise<{ result: number }> {
    try {
      const response = await axios.post(`${BASE_URL}/evaluate`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to evaluate expression');
    }
  },

  async clear(): Promise<{ expression: string; result?: number }> {
    try {
      const response = await axios.post(`${BASE_URL}/clear`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to clear calculator');
    }
  },

  async deleteLastChar(): Promise<{ expression: string }> {
    try {
      const response = await axios.post(`${BASE_URL}/delete-last-char`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete last character');
    }
  }
};