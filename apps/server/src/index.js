import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { setupChatGateway } from './realtime/chat.gateway.js';

async function bootstrap() {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    logger.info(`API listening on port ${env.PORT}`);
  });

  setupChatGateway(server);
}

bootstrap().catch((error) => {
  logger.error({ err: error }, 'Failed to bootstrap application');
  process.exit(1);
});
