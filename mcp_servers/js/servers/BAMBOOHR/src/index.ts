import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { body, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import morgan from 'morgan';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import { mockBambooHRApi, Employee } from './mockApi';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 5000;
const cache = new NodeCache({ stdTTL: 60 });

app.use(express.json());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500, // Use 'max' instead of 'limit'
});
app.use(limiter);

// Validation middleware
const bambooHRValidation = [
  body('employeeId').optional().isInt({ min: 1 }).withMessage('Employee ID must be a positive integer'),
  body('name').optional().isString().trim(),
];

const bambooHRQueryValidation = [
  query('employeeId').optional().isInt({ min: 1 }).withMessage('Employee ID must be a positive integer'),
];

// Error handling middleware
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
};

// Resource: Get Employee (GET)
app.get('/getEmployee', bambooHRQueryValidation, async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { employeeId } = req.query as { employeeId?: string };
  if (!employeeId) {
    res.status(400).json({ error: 'Employee ID is required' });
    return;
  }

  const cacheKey = `employee_${employeeId}`;
  const cached = cache.get<Employee>(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const employee = await mockBambooHRApi.getEmployee(Number(employeeId));
    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }
    cache.set(cacheKey, employee);
    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch employee: ${error.message}` });
  }
});

// Resource: Get Employee (POST)
app.post('/getEmployee', bambooHRValidation, async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { employeeId } = req.body;
  if (!employeeId) {
    res.status(400).json({ error: 'Employee ID is required' });
    return;
  }

  const cacheKey = `employee_${employeeId}`;
  const cached = cache.get<Employee>(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const employee = await mockBambooHRApi.getEmployee(Number(employeeId));
    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }
    cache.set(cacheKey, employee);
    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch employee: ${error.message}` });
  }
});

// Resource: Get All Employees
app.get('/getAllEmployees', async (req: Request, res: Response): Promise<void> => {
  const cacheKey = 'allEmployees';
  const cached = cache.get<Employee[]>(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const employees = await mockBambooHRApi.getAllEmployees();
    cache.set(cacheKey, employees);
    res.json(employees);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch employees: ${error.message}` });
  }
});

// Tool: Create Employee
app.post('/createEmployee', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('jobTitle').optional().trim().isString(),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { firstName, lastName, email, jobTitle } = req.body;
  try {
    const employeeId = await mockBambooHRApi.createEmployee({ firstName, lastName, email, jobTitle });
    // Invalidate allEmployees cache
    cache.del('allEmployees');
    res.json({ message: 'Employee created', employeeId });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to create employee: ${error.message}` });
  }
});

// Prompt: Employee Query
app.post('/promptEmployee', [
  body('message').trim().notEmpty().withMessage('Message is required'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { message } = req.body;
  res.json({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Execute employee query: ${message}`,
        },
      }
    ],
  });
});

// Streamable HTTP
interface Transport {
  sessionId: string;
  handleRequest: (req: Request, res: Response) => Promise<void>;
}

const transports: { [sessionId: string]: Transport } = {};

app.post('/mcp', async (req: Request, res: Response): Promise<void> => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: Transport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && req.body.type === 'initialize') {
    transport = {
      sessionId: randomUUID(),
      handleRequest: async (req: Request, res: Response) => {}
    };
    transports[transport.sessionId] = transport;
    res.setHeader('mcp-session-id', transport.sessionId);
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Bad Request: No valid session ID' },
      id: req.body.id || null,
    });
    return;
  }

  if (req.body.method === 'getEmployee') {
    const { employeeId } = req.body.params || {};
    if (!employeeId) {
      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32602, message: 'Invalid params: employeeId required' },
        id: req.body.id || null,
      });
      return;
    }

    const cacheKey = `employee_${employeeId}`;
    const cached = cache.get<Employee>(cacheKey);
    if (cached) {
      res.json({ jsonrpc: '2.0', result: cached, id: req.body.id });
      return;
    }

    try {
      const employee = await mockBambooHRApi.getEmployee(Number(employeeId));
      if (!employee) {
        res.status(404).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Employee not found' },
          id: req.body.id,
        });
        return;
      }
      cache.set(cacheKey, employee);
      res.json({ jsonrpc: '2.0', result: employee, id: req.body.id });
    } catch (error: any) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: `Failed to fetch employee: ${error.message}` },
        id: req.body.id,
      });
    }
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid method' },
      id: req.body.id || null,
    });
  }
});

app.get('/mcp', (req: Request, res: Response): void => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32601, message: 'Method not allowed' },
    id: null,
  });
});

app.delete('/mcp', (req: Request, res: Response): void => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32601, message: 'Method not allowed' },
    id: null,
  });
});

// WebSocket message interface
interface WebSocketMessage {
  path: string;
  employeeId?: number;
}

// stdio via WebSocket
wss.on('connection', (ws: WebSocket) => {
  ws.on('message', async (data: Buffer) => {
    try {
      const request: WebSocketMessage = JSON.parse(data.toString());
      if (request.path === '/getEmployee' && request.employeeId) {
        try {
          const employee = await mockBambooHRApi.getEmployee(Number(request.employeeId));
          if (!employee) {
            ws.send(JSON.stringify({ error: 'Employee not found' }));
            return;
          }
          ws.send(JSON.stringify(employee));
        } catch (error: any) {
          ws.send(JSON.stringify({ error: `Failed to fetch employee: ${error.message}` }));
        }
      } else {
        ws.send(JSON.stringify({ error: 'Invalid request format or path' }));
      }
    } catch (error: any) {
      ws.send(JSON.stringify({ error: 'Invalid JSON format' }));
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Error handling
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`✅ BambooHR MCP server is running on http://localhost:${PORT}`);
});