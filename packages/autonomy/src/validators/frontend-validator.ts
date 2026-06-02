import http from 'http';

export class FrontendValidator {
  static async checkHealth(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        resolve(res.statusCode === 200 || res.statusCode === 304 || res.statusCode === 404); // React router might return 404 on base / sometimes depending on config
      });
      
      req.on('error', () => resolve(false));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }
}
