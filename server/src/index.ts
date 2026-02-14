import { getEnv } from './lib/env.js';
import { createServer } from 'http';

import app from './app.js';
import { initializeSocket } from './socket/index.js';

const httpServer = createServer(app);

// Initialize Socket.io
initializeSocket(httpServer);

const PORT = getEnv().PORT;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Client URL: ${getEnv().CLIENT_URL}`);
});
