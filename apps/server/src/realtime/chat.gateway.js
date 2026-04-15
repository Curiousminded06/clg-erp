import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ChatMessage } from '../models/chat-message.model.js';
import { Course } from '../models/course.model.js';

const objectIdRegex = /^[a-f\d]{24}$/i;

export function setupChatGateway(server) {
  const wss = new WebSocketServer({ server, path: '/ws/chat' });
  const participants = new Map();

  function sendSafe(socket, payload) {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  }

  async function loadHistory(courseId) {
    const data = await ChatMessage.find({ course: courseId })
      .populate('sender', 'fullName email role')
      .sort({ timestamp: -1 })
      .limit(50);

    return data.reverse();
  }

  wss.on('connection', (socket, request) => {
    const url = new URL(request.url ?? '/ws/chat', `http://${request.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      sendSafe(socket, { type: 'error', payload: { message: 'Authentication token required' } });
      socket.close(1008, 'Authentication token required');
      return;
    }

    let user;

    try {
      user = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch {
      sendSafe(socket, { type: 'error', payload: { message: 'Invalid token' } });
      socket.close(1008, 'Invalid token');
      return;
    }

    participants.set(socket, {
      userId: String(user.sub),
      email: String(user.email ?? ''),
      role: String(user.role ?? 'student'),
      room: null
    });

    socket.on('message', async (raw) => {
      let message;

      try {
        message = JSON.parse(raw.toString());
      } catch {
        sendSafe(socket, { type: 'error', payload: { message: 'Invalid message format' } });
        return;
      }

      if (message.type === 'join') {
        const roomId = String(message?.payload?.roomId ?? '').trim();

        if (!objectIdRegex.test(roomId)) {
          sendSafe(socket, { type: 'error', payload: { message: 'Invalid course id' } });
          return;
        }

        const courseExists = await Course.exists({ _id: roomId });
        if (!courseExists) {
          sendSafe(socket, { type: 'error', payload: { message: 'Course not found' } });
          return;
        }

        const participant = participants.get(socket);
        if (!participant) {
          return;
        }

        participant.room = roomId;
        participants.set(socket, participant);

        const history = await loadHistory(roomId);
        sendSafe(socket, { type: 'history', payload: history });
        return;
      }

      if (message.type === 'chat') {
        const participant = participants.get(socket);
        if (!participant?.room) {
          sendSafe(socket, { type: 'error', payload: { message: 'Join a room first' } });
          return;
        }

        const content = String(message?.payload?.message ?? '').trim();
        if (!content) {
          return;
        }

        const saved = await ChatMessage.create({
          course: participant.room,
          sender: participant.userId,
          content,
          timestamp: new Date()
        });

        const hydrated = await ChatMessage.findById(saved._id).populate('sender', 'fullName email role');

        const outbound = {
          type: 'message',
          payload: hydrated
        };

        participants.forEach((value, clientSocket) => {
          if (value.room === participant.room && clientSocket.readyState === clientSocket.OPEN) {
            clientSocket.send(JSON.stringify(outbound));
          }
        });
      }
    });

    socket.on('close', () => {
      participants.delete(socket);
    });
  });

  logger.info('WebSocket chat gateway initialized at /ws/chat');
  return wss;
}
