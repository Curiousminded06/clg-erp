import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { setupChatGateway } from './realtime/chat.gateway.js';

let server;
let chatGateway;
let shuttingDown = false;

async function shutdown(signal, error) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (error) {
    logger.error({ err: error, signal }, 'Fatal process error');
  } else {
    logger.info({ signal }, 'Shutting down server');
  }

  try {
    if (chatGateway) {
      chatGateway.close();
    }

    if (server) {
      await new Promise((resolve, reject) => {
        server.close((closeError) => (closeError ? reject(closeError) : resolve()));
      });
    }

    await disconnectDB();
  } catch (shutdownError) {
    logger.error({ err: shutdownError, signal }, 'Error while shutting down');
  } finally {
    process.exit(error ? 1 : 0);
  }
}

async function bootstrap() {
  await connectDB();

  server = app.listen(env.PORT, () => {
    logger.info(`API listening on port ${env.PORT}`);
  });

  chatGateway = setupChatGateway(server);

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  process.on('unhandledRejection', (error) => {
    void shutdown('unhandledRejection', error);
  });

  process.on('uncaughtException', (error) => {
    void shutdown('uncaughtException', error);
  });
}

bootstrap().catch((error) => {
  logger.error({ err: error }, 'Failed to bootstrap application');
  process.exit(1);
});
