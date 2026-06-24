import * as net from 'net';

class PortManager {
  private reservedPorts: Set<number> = new Set();

  private checkPort(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.unref();
      server.on('error', () => {
        resolve(false);
      });
      // Attempt actual bind
      server.listen(port, () => {
        server.close(() => {
          resolve(true);
        });
      });
    });
  }

  /**
   * Manually reserve a port to prevent it from being allocated to others
   */
  reservePort(port: number) {
    this.reservedPorts.add(port);
  }

  /**
   * Finds an available port starting from the given port.
   * Tracks assigned ports in memory to avoid race conditions.
   */
  async findAvailablePort(startPort: number, scanRange: number = 100, onCheck?: (port: number, status: 'testing' | 'available' | 'occupied') => void): Promise<number> {
    for (let port = startPort; port <= startPort + scanRange; port++) {
      if (onCheck) onCheck(port, 'testing');
      
      if (this.reservedPorts.has(port)) {
        if (onCheck) onCheck(port, 'occupied');
        continue;
      }
      
      const isAvailable = await this.checkPort(port);
      
      if (isAvailable) {
        if (onCheck) onCheck(port, 'available');
        // Reserve it immediately to prevent race conditions from concurrent calls
        this.reservedPorts.add(port);
        return port;
      } else {
        if (onCheck) onCheck(port, 'occupied');
      }
    }
    throw new Error(`No available ports found in range ${startPort}-${startPort + scanRange}`);
  }

  /**
   * Optional: release a port if the service is stopped.
   */
  releasePort(port: number) {
    this.reservedPorts.delete(port);
  }

  /**
   * Forcibly kill any process listening on the given port (Windows / Unix).
   */
  async killProcessOnPort(port: number): Promise<void> {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      if (process.platform === 'win32') {
        exec(`FOR /F "tokens=5" %a IN ('netstat -aon ^| findstr :${port}') DO taskkill /F /PID %a`, () => resolve());
      } else {
        exec(`lsof -t -i:${port} | xargs kill -9`, () => resolve());
      }
    });
  }
}

export const portManager = new PortManager();
