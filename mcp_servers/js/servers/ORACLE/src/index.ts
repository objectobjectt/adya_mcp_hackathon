import express, { Request, Response, NextFunction } from 'express';
import oracledb from 'oracledb';
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
const PORT = process.env.PORT || 5050;
const ORACLE_USER = process.env.ORACLE_USER || 'system';
const ORACLE_PASSWORD = process.env.ORACLE_PASSWORD || '1234';
const ORACLE_CONNECTION_STRING = process.env.ORACLE_CONNECTION_STRING || 'localhost/XEPDB1';
const cache = new NodeCache({ stdTTL: 60 }); // Cache for 60 seconds

app.use(express.json());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 500,
});
app.use(limiter);

// Oracle connection pool
let pool: oracledb.Pool;
async function initializePool(): Promise<void> {
  try {
    pool = await oracledb.createPool({
      user: ORACLE_USER,
      password: ORACLE_PASSWORD,
      connectString: ORACLE_CONNECTION_STRING,
    });
    console.log('Oracle connection pool created');
  } catch (error: any) {
    console.error('Failed to create Oracle pool:', error.message);
    process.exit(1);
  }
}
initializePool();

// Authentication middleware
const authenticateOracle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let connection: oracledb.Connection | undefined;
  try {
    connection = await pool.getConnection();
    next();
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to connect to Oracle Database' });
  } finally {
    if (connection) await connection.close();
  }
};

// Validation
const oracleValidation = [
  body('tableName').optional().trim().isString(),
  body('id').optional().trim().isNumeric(),
];

const oracleQueryValidation = [
  query('tableName').optional().trim().isString().withMessage('Table name is required for query params'),
];

// Error handling
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
};

// Resource: Get Table Data (GET)
app.get('/getTableData', authenticateOracle, oracleQueryValidation, async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array() });
    return;
  }

  const { tableName } = req.query as { tableName: string };
  const cacheKey = `table_${tableName}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  let connection: oracledb.Connection | undefined;
  try {
    connection = await pool.getConnection();
    const result = await connection.execute(`SELECT * FROM ${tableName} FETCH FIRST 10 ROWS ONLY`);
    const data = result.rows || [];
    cache.set(cacheKey, data);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch table data: ${error.message}` });
  } finally {
    if (connection) await connection.close();
  }
});

// Resource: Get Table Data (POST)
app.post('/getTableData', authenticateOracle, oracleValidation, async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array() });
    return;
  }

  const { tableName } = req.body;
  const cacheKey = `table_${tableName}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  let connection: oracledb.Connection | undefined;
  try {
    connection = await pool.getConnection();
    const result = await connection.execute(`SELECT * FROM ${tableName} FETCH FIRST 10 ROWS ONLY`);
    const data = result.rows || [];
    cache.set(cacheKey, data);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch table data: ${error.message}` });
  } finally {
    if (connection) await connection.close();
  }
});

// Tool: Insert Data
app.post('/insertData', authenticateOracle, [
  ...oracleValidation,
  body('tableName').trim().notEmpty().withMessage('Table name is required'),
  body('data').isObject().withMessage('Data must be an object'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { tableName, data } = req.body;
  let connection: oracledb.Connection | undefined;
  try {
    connection = await pool.getConnection();
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data).map((_, i) => `:${i + 1}`).join(', ');
    const bindVars = Object.values(data);
    await connection.execute(
      `INSERT INTO ${tableName} (${columns}) VALUES (${values})`,
      bindVars,
      { autoCommit: true }
    );
    res.json({ message: `Data inserted into ${tableName}` });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to insert data: ${error.message}` });
  } finally {
    if (connection) await connection.close();
  }
});

// Prompt: Data Query
app.post('/promptQuery', authenticateOracle, [
  body('message').trim().notEmpty().withMessage('Message is required'),
], async (req: Request, res: Response): Promise<void> => {
  const { message } = req.body;
  res.json({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Execute database query based on: ${message}`,
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

  if (req.body.method === 'getTableData') {
    const { tableName } = req.body.params;
    const cacheKey = `table_${tableName}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.json({ jsonrpc: '2.0', result: cached, id: req.body.id });
      return;
    }

    let connection: oracledb.Connection | undefined;
    try {
      connection = await pool.getConnection();
      const result = await connection.execute(`SELECT * FROM ${tableName} FETCH FIRST 10 ROWS ONLY`);
      const data = result.rows || [];
      cache.set(cacheKey, data);
      res.json({ jsonrpc: '2.0', result: data, id: req.body.id });
    } catch (error: any) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: `Failed to fetch table data: ${error.message}` },
        id: req.body.id,
      });
    } finally {
      if (connection) await connection.close();
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
    if (request.path === '/getTableData') {
      const { tableName } = request;
      let connection: oracledb.Connection | undefined;
      try {
        connection = await pool.getConnection();
        const result = await connection.execute(`SELECT * FROM ${tableName} FETCH FIRST 10 ROWS ONLY`);
        ws.send(JSON.stringify(result.rows || []));
      } catch (error: any) {
        ws.send(JSON.stringify({ error: `Failed to fetch table data: ${error.message}` }));
      } finally {
        if (connection) await connection.close();
      }
    }
  });
});

// Error handling
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`✅ Oracle MCP server is running on http://localhost:${PORT}`);
});