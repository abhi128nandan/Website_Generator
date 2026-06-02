import * as net from 'net';

export async function findAvailablePort(preferredPort: number, scanRange: number = 15): Promise<number> {
  const checkPort = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.unref();
      server.on('error', () => {
        resolve(false);
      });
      server.listen(port, () => {
        server.close(() => {
          resolve(true);
        });
      });
    });
  };

  for (let port = preferredPort; port <= preferredPort + scanRange; port++) {
    const isAvailable = await checkPort(port);
    if (isAvailable) {
      return port;
    }
  }

  throw new Error(`No available ports found in range ${preferredPort}-${preferredPort + scanRange}`);
}
