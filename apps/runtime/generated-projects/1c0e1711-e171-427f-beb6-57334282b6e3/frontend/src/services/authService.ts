export const authService = {  
  async login(email: string, password: string): Promise<{ token?: string; error?: string }> {
    try {
      const mockUser = { email: "user@example.com", password: "password123", token: "mock-jwt-token" };
      if (email === mockUser.email && password === mockUser.password) {
        localStorage.setItem("authToken", mockUser.token!);
        return { token: mockUser.token };
      } else {
        return { error: "Invalid email or password" };
      }
    } catch (error) {
      return { error: "Internal server error" };
    }
  },

  async register(email: string, password: string): Promise<{ success?: boolean; error?: string }> {
    try {
      const mockEmail = "newuser@example.com";
      if (email === mockEmail) {
        return { success: true };
      } else {
        return { error: "Email is not valid or already registered" };
      }
    } catch (error) {
      return { error: "Internal server error" };
    }
  },

  logout(): void {
    localStorage.removeItem("authToken");
  },

  getToken(): string | null {
    return localStorage.getItem("authToken");
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem("authToken");
  },
};