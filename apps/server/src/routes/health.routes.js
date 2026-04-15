import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

function getMongoState() {
  const state = mongoose.connection.readyState;
  const map = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  return {
    code: state,
    label: map[state] ?? 'unknown'
  };
}

router.get('/live', (_req, res) => {
  res.status(200).json({
    success: true,
    service: 'clg-erp-api',
    status: 'alive',
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

router.get('/ready', (_req, res) => {
  const mongo = getMongoState();
  const ready = mongo.code === 1;

  res.status(ready ? 200 : 503).json({
    success: ready,
    service: 'clg-erp-api',
    status: ready ? 'ready' : 'not-ready',
    mongo: mongo.label,
    timestamp: new Date().toISOString()
  });
});

router.get('/', (_req, res) => {
  const mongo = getMongoState();

  res.status(200).json({
    success: true,
    service: 'clg-erp-api',
    mongo: mongo.label,
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

export default router;
