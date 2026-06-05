interface CalculationHistory {
  expr: string;
  result: number;
}

interface AppSettings {
  darkMode: boolean;
  decimalPlaces: number;
}

export const storageService = {
  async getHistory(): Promise<CalculationHistory[]> {
    try {
      const data = window.localStorage.getItem('calcHistory');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveHistory(history: CalculationHistory[]): Promise<boolean> {
    try {
      window.localStorage.setItem('calcHistory', JSON.stringify(history));
      return true;
    } catch {
      return false;
    }
  },

  async getSettings(): Promise<AppSettings> {
    try {
      const data = window.localStorage.getItem('appSettings');
      if (data) {
        return JSON.parse(data);
      }
      return { darkMode: false, decimalPlaces: 2 };
    } catch {
      return { darkMode: false, decimalPlaces: 2 };
    }
  },

  async saveSettings(settings: AppSettings): Promise<boolean> {
    try {
      window.localStorage.setItem('appSettings', JSON.stringify(settings));
      return true;
    } catch {
      return false;
    }
  }
};