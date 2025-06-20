import express, { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { body, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import morgan from 'morgan';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5050; // Use environment variable or default to 5050
const TWITCH_CLIENT_ID =  'ns1m5n123c9ola0n3kdqy1ldd293u3';
const TWITCH_CLIENT_SECRET = 'kv92spsb59q0izypz380i3yda5wmby';
let TWITCH_ACCESS_TOKEN =  'obrokkveoqi4i7eukwc0isl1jtrkp6';
const TWITCH_REDIRECT_URI = 'http://localhost';
const cache = new NodeCache({ stdTTL: 60 }); // Cache for 60 seconds

app.use(express.json());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests
});
app.use(limiter);

// Authentication middleware
const authenticateTwitch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!TWITCH_ACCESS_TOKEN) {
    try {
      const tokenResponse = await axios.post(
        `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials&redirect_uri=${encodeURIComponent(TWITCH_REDIRECT_URI)}`
      );
      TWITCH_ACCESS_TOKEN = tokenResponse.data.access_token;
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to authenticate with Twitch' });
      return;
    }
  }
  next();
};

// Validation
const twitchValidation = [
  body('userId').optional().trim().isString(),
  body('channelId').optional().trim().isString(),
  body('gameId').optional().trim().isString(),
  body('language').optional().trim().isString(),
];

const twitchQueryValidation = [
  query('channelId').optional().trim().isString().withMessage('Channel ID is required for query params'),
];

// Error handling
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
};

// OAuth2 Authorization
app.get('/auth/twitch', (req: Request, res: Response): void => {
  const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(TWITCH_REDIRECT_URI)}&response_type=code&scope=user:read:email+channel:read:entities+chat:edit+chat:read+channel:manage:broadcast+user:read:follows+clips:edit+channel:read:subscriptions+channel:read:analytics`;
  res.redirect(authUrl);
});

// OAuth2 Callback
app.get('/auth/callback', async (req: Request, res: Response): Promise<void> => {
  const { code } = req.query;
  try {
    const tokenResponse = await axios.post(
      `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&code=${encodeURIComponent(code as string)}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(TWITCH_REDIRECT_URI)}`
    );
    TWITCH_ACCESS_TOKEN = tokenResponse.data.access_token;
    res.json({ message: 'Authentication successful' });
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to exchange code for token' });
  }
});

// Resource: Get Channel (GET)
app.get('/getChannel', authenticateTwitch, twitchQueryValidation, async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array() });
    return;
  }

  const { channelId } = req.query as { channelId: string };
  const cacheKey = `channel_${channelId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const response = await axios.get(`https://api.twitch.tv/helix/channels?broadcaster_id=${encodeURIComponent(channelId)}`, {
      headers: {
        Authorization: `Bearer ${TWITCH_ACCESS_TOKEN}`,
        'Client-Id': TWITCH_CLIENT_ID,
      },
    });
    const channel = response.data.data[0] || {};
    const result = {
      id: channel.broadcaster_id,
      name: channel.broadcaster_name,
      description: channel.description,
      game: channel.game_name,
      language: channel.broadcaster_language,
    };
    cache.set(cacheKey, result);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch channel: ${error.message}` });
  }
});

// Resource: Get Channel (POST)
app.post('/getChannel', authenticateTwitch, twitchValidation, async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array() });
    return;
  }

  const { channelId } = req.body;
  const cacheKey = `channel_${channelId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const response = await axios.get(`https://api.twitch.tv/helix/channels?broadcaster_id=${encodeURIComponent(channelId)}`, {
      headers: {
        Authorization: `Bearer ${TWITCH_ACCESS_TOKEN}`,
        'Client-Id': TWITCH_CLIENT_ID,
      },
    });
    const channel = response.data.data[0] || {};
    const result = {
      id: channel.broadcaster_id,
      name: channel.broadcaster_name,
      description: channel.description,
      game: channel.game_name,
      language: channel.broadcaster_language,
    };
    cache.set(cacheKey, result);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch channel: ${error.message}` });
  }
});

// Resource: Get Stream
app.post('/getStream', authenticateTwitch, twitchValidation, async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { channelId } = req.body;
  const cacheKey = `stream_${channelId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const response = await axios.get(`https://api.twitch.tv/helix/streams?user_id=${encodeURIComponent(channelId)}`, {
      headers: {
        Authorization: `Bearer ${TWITCH_ACCESS_TOKEN}`,
        'Client-Id': TWITCH_CLIENT_ID,
      },
    });
    const stream = response.data.data[0] || {};
    const result = {
      id: stream.id,
      title: stream.title,
      viewer_count: stream.viewer_count,
      started_at: stream.started_at,
      game: stream.game_name,
    };
    cache.set(cacheKey, result);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch stream: ${error.message}` });
  }
});

// Resource: Get Top Games
app.post('/getTopGames', authenticateTwitch, async (req: Request, res: Response): Promise<void> => {
  const cacheKey = 'top_games';
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const response = await axios.get(`https://api.twitch.tv/helix/games/top`, {
      headers: {
        Authorization: `Bearer ${TWITCH_ACCESS_TOKEN}`,
        'Client-Id': TWITCH_CLIENT_ID,
      },
    });
    const games = response.data.data.map((game: any) => ({
      id: game.id,
      name: game.name,
      box_art_url: game.box_art_url,
    }));
    cache.set(cacheKey, games);
    res.json(games);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch top games: ${error.message}` });
  }
});

// Resource: Search Live Streams
app.post('/searchStreams', authenticateTwitch, twitchValidation, async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { gameId, language } = req.body;
  const cacheKey = `streams_${gameId}_${language}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const response = await axios.get(`https://api.twitch.tv/helix/streams?game_id=${encodeURIComponent(gameId)}&language=${encodeURIComponent(language)}`, {
      headers: {
        Authorization: `Bearer ${TWITCH_ACCESS_TOKEN}`,
        'Client-Id': TWITCH_CLIENT_ID,
      },
    });
    const streams = response.data.data.map((stream: any) => ({
      id: stream.id,
      user_name: stream.user_name,
      title: stream.title,
      viewer_count: stream.viewer_count,
    }));
    cache.set(cacheKey, streams);
    res.json(streams);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to search streams: ${error.message}` });
  }
});

// Resource: Get User
app.post('/getUser', authenticateTwitch, twitchValidation, async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { userId } = req.body;
  const cacheKey = `user_${userId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const response = await axios.get(`https://api.twitch.tv/helix/users?id=${encodeURIComponent(userId)}`, {
      headers: {
        Authorization: `Bearer ${TWITCH_ACCESS_TOKEN}`,
        'Client-Id': TWITCH_CLIENT_ID,
      },
    });
    const user = response.data.data[0] || {};
    const result = {
      id: user.id,
      login: user.login,
      display_name: user.display_name,
      description: user.description,
      profile_image_url: user.profile_image_url,
    };
    cache.set(cacheKey, result);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch user: ${error.message}` });
  }
});

// Resource: Get Clips
app.post('/getClips', authenticateTwitch, twitchValidation, async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { channelId } = req.body;
  const cacheKey = `clips_${channelId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const response = await axios.get(`https://api.twitch.tv/helix/clips?broadcaster_id=${encodeURIComponent(channelId)}`, {
      headers: {
        Authorization: `Bearer ${TWITCH_ACCESS_TOKEN}`,
        'Client-Id': TWITCH_CLIENT_ID,
      },
    });
    const clips = response.data.data.map((clip: any) => ({
      id: clip.id,
      title: clip.title,
      url: clip.url,
      created_at: clip.created_at,
    }));
    cache.set(cacheKey, clips);
    res.json(clips);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch clips: ${error.message}` });
  }
});

// Resource: Get Followers
app.post('/getFollowers', authenticateTwitch, twitchValidation, async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { channelId } = req.body;
  const cacheKey = `followers_${channelId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const response = await axios.get(`https://api.twitch.tv/helix/users/follows?to_id=${encodeURIComponent(channelId)}`, {
      headers: {
        Authorization: `Bearer ${TWITCH_ACCESS_TOKEN}`,
        'Client-Id': TWITCH_CLIENT_ID,
      },
    });
    const followers = response.data.data.map((follow: any) => ({
      from_id: follow.from_id,
      from_name: follow.from_name,
      followed_at: follow.followed_at,
    }));
    cache.set(cacheKey, followers);
    res.json(followers);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch followers: ${error.message}` });
  }
});

// Tool: Create Follow
app.post('/createFollow', authenticateTwitch, [
  ...twitchValidation,
  body('fromUserId').trim().notEmpty().withMessage('From user ID is required'),
  body('toUserId').trim().notEmpty().withMessage('To user ID is required'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { fromUserId, toUserId } = req.body;
  try {
    const response = await axios.post(
      `https://api.twitch.tv/helix/users/follows`,
      { from_id: fromUserId, to_id: toUserId },
      {
        headers: {
          Authorization: `Bearer ${TWITCH_ACCESS_TOKEN}`,
          'Client-Id': TWITCH_CLIENT_ID,
        },
      }
    );
    res.json({ message: `Successfully followed user ${toUserId}`, status: response.status });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to create follow: ${error.message}` });
  }
});

// Tool: Create Clip
app.post('/createClip', authenticateTwitch, [
  ...twitchValidation,
  body('channelId').trim().notEmpty().withMessage('Channel ID is required'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { channelId } = req.body;
  try {
    const response = await axios.post(
      `https://api.twitch.tv/helix/clips?broadcaster_id=${encodeURIComponent(channelId)}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${TWITCH_ACCESS_TOKEN}`,
          'Client-Id': TWITCH_CLIENT_ID,
        },
      }
    );
    res.json({ clip_id: response.data.data[0].id, edit_url: response.data.data[0].edit_url });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to create clip: ${error.message}` });
  }
});

// Prompt: Follow Creation
app.post('/promptFollow', authenticateTwitch, [
  body('message').trim().notEmpty().withMessage('Message is required'),
], async (req: Request, res: Response): Promise<void> => {
  const { message } = req.body;
  res.json({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Create a follow request based on: ${message}`,
        },
      },
    ],
  });
});

// Streamable HTTP
const transports: { [sessionId: string]: any } = {};

app.post('/mcp', async (req: Request, res: Response): Promise<void> => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && req.body.type === 'initialize') {
    transport = { sessionId: randomUUID(), handleRequest: async (req: Request, res: Response) => {} };
    transports[transport.sessionId] = transport;
    res.setHeader('mcp-session-id', transport.sessionId);
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Bad Request: No valid session ID' },
      id: null,
    });
    return;
  }

  if (req.body.method === 'getChannel') {
    const { channelId } = req.body.params;
    const cacheKey = `channel_${channelId}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.json({ jsonrpc: '2.0', result: cached, id: req.body.id });
      return;
    }

    try {
      const response = await axios.get(`https://api.twitch.tv/helix/channels?broadcaster_id=${encodeURIComponent(channelId)}`, {
        headers: {
          Authorization: `Bearer ${TWITCH_ACCESS_TOKEN}`,
          'Client-Id': TWITCH_CLIENT_ID,
        },
      });
      const channel = response.data.data[0] || {};
      const result = {
        id: channel.broadcaster_id,
        name: channel.broadcaster_name,
        description: channel.description,
      };
      cache.set(cacheKey, result);
      res.json({ jsonrpc: '2.0', result, id: req.body.id });
    } catch (error: any) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: `Failed to fetch channel: ${error.message}` },
        id: req.body.id,
      });
    }
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid method' },
      id: req.body.id,
    });
  }
});

app.get('/mcp', (req: Request, res: Response): void => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed' },
    id: null,
  });
});

app.delete('/mcp', (req: Request, res: Response): void => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed' },
    id: null,
  });
});

// stdio via WebSocket
wss.on('connection', (ws) => {
  ws.on('message', async (data) => {
    const request = JSON.parse(data.toString());
    if (request.path === '/getChannel') {
      const { channelId } = request;
      try {
        const response = await axios.get(`https://api.twitch.tv/helix/channels?broadcaster_id=${encodeURIComponent(channelId)}`, {
          headers: {
            Authorization: `Bearer ${TWITCH_ACCESS_TOKEN}`,
            'Client-Id': TWITCH_CLIENT_ID,
          },
        });
        const channel = response.data.data[0] || {};
        ws.send(
          JSON.stringify({
            id: channel.broadcaster_id,
            name: channel.broadcaster_name,
            description: channel.description,
          })
        );
      } catch (error: any) {
        ws.send(JSON.stringify({ error: `Failed to fetch channel: ${error.message}` }));
      }
    }
  });
});

// Error handling
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`✅ Twitch MCP server is running on http://localhost:${PORT}`);
});