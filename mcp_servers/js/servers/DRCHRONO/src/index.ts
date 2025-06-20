

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { body, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import morgan from 'morgan';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';
import { mockDrChronoApi, Patient, Appointment, ClinicalNote, BillingRecord } from './mockApi';

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
  windowMs: 60 * 60 * 1000,
  limit: 500,
});
app.use(limiter);

// Validation
const patientValidation = [
  body('patientId').optional().isInt().withMessage('Patient ID must be a number'),
  body('firstName').optional().trim().isString(),
  body('lastName').optional().trim().isString(),
  body('email').optional().trim().isEmail(),
];

const appointmentValidation = [
  body('appointmentId').optional().isInt().withMessage('Appointment ID must be a number'),
  body('patientId').optional().isInt(),
  body('doctorId').optional().isInt(),
  body('dateTime').optional().isISO8601().withMessage('Invalid date format'),
];

const clinicalNoteValidation = [
  body('noteId').optional().isInt().withMessage('Note ID must be a number'),
  body('patientId').optional().isInt(),
  body('appointmentId').optional().isInt(),
  body('note').optional().trim().isString(),
];

const billingValidation = [
  body('billingId').optional().isInt().withMessage('Billing ID must be a number'),
  body('patientId').optional().isInt(),
  body('appointmentId').optional().isInt(),
  body('amount').optional().isFloat().withMessage('Amount must be a number'),
];

const queryValidation = [
  query('patientId').optional().isInt().withMessage('Patient ID must be a number'),
  query('appointmentId').optional().isInt().withMessage('Appointment ID must be a number'),
];

// Error handling
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
};

// Resource: Get Patient (GET)
app.get('/getPatient', queryValidation, async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { patientId } = req.query as { patientId: string };
  const cacheKey = `patient_${patientId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const patient = await mockDrChronoApi.getPatient(Number(patientId));
    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    cache.set(cacheKey, patient);
    res.json(patient);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch patient: ${error.message}` });
  }
});

// Resource: Get Patient (POST)
app.post('/getPatient', patientValidation, async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { patientId } = req.body;
  const cacheKey = `patient_${patientId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const patient = await mockDrChronoApi.getPatient(Number(patientId));
    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    cache.set(cacheKey, patient);
    res.json(patient);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch patient: ${error.message}` });
  }
});

// Resource: Get All Patients
app.get('/getAllPatients', async (req: Request, res: Response): Promise<void> => {
  const cacheKey = 'allPatients';
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const patients = await mockDrChronoApi.getAllPatients();
    cache.set(cacheKey, patients);
    res.json(patients);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch patients: ${error.message}` });
  }
});

// Tool: Create Patient
app.post('/createPatient', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('dateOfBirth').trim().isISO8601().withMessage('Valid date of birth is required'),
  body('gender').trim().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { firstName, lastName, email, dateOfBirth, gender } = req.body;
  try {
    const patientId = await mockDrChronoApi.createPatient({ firstName, lastName, email, dateOfBirth, gender });
    res.json({ message: 'Patient created', patientId });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to create patient: ${error.message}` });
  }
});

// Tool: Update Patient
app.put('/updatePatient', [
  body('patientId').isInt().withMessage('Patient ID is required'),
  ...patientValidation,
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { patientId, ...data } = req.body;
  try {
    await mockDrChronoApi.updatePatient(Number(patientId), data);
    res.json({ message: 'Patient updated' });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to update patient: ${error.message}` });
  }
});

// Tool: Delete Patient
app.delete('/deletePatient', [
  body('patientId').isInt().withMessage('Patient ID is required'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { patientId } = req.body;
  try {
    await mockDrChronoApi.deletePatient(Number(patientId));
    res.json({ message: 'Patient deleted' });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to delete patient: ${error.message}` });
  }
});

// Resource: Get Appointment
app.get('/getAppointment', queryValidation, async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { appointmentId } = req.query as { appointmentId: string };
  const cacheKey = `appointment_${appointmentId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const appointment = await mockDrChronoApi.getAppointment(Number(appointmentId));
    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    cache.set(cacheKey, appointment);
    res.json(appointment);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch appointment: ${error.message}` });
  }
});

// Tool: Create Appointment
app.post('/createAppointment', [
  body('patientId').isInt().withMessage('Patient ID is required'),
  body('doctorId').isInt().withMessage('Doctor ID is required'),
  body('dateTime').isISO8601().withMessage('Valid date is required'),
  body('status').isIn(['Scheduled', 'Completed', 'Cancelled']).withMessage('Invalid status'),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { patientId, doctorId, dateTime, status, reason } = req.body;
  try {
    const appointmentId = await mockDrChronoApi.createAppointment({ patientId, doctorId, dateTime, status, reason });
    res.json({ message: 'Appointment created', appointmentId });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to create appointment: ${error.message}` });
  }
});

// Tool: Update Appointment
app.put('/updateAppointment', [
  body('appointmentId').isInt().withMessage('Appointment ID is required'),
  ...appointmentValidation,
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { appointmentId, ...data } = req.body;
  try {
    await mockDrChronoApi.updateAppointment(Number(appointmentId), data);
    res.json({ message: 'Appointment updated' });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to update appointment: ${error.message}` });
  }
});

// Resource: Get Clinical Note
app.get('/getClinicalNote', queryValidation, async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { noteId } = req.query as { noteId: string };
  const cacheKey = `note_${noteId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const note = await mockDrChronoApi.getClinicalNote(Number(noteId));
    if (!note) {
      res.status(404).json({ error: 'Clinical note not found' });
      return;
    }
    cache.set(cacheKey, note);
    res.json(note);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch clinical note: ${error.message}` });
  }
});

// Tool: Create Clinical Note
app.post('/createClinicalNote', [
  body('patientId').isInt().withMessage('Patient ID is required'),
  body('appointmentId').isInt().withMessage('Appointment ID is required'),
  body('note').trim().notEmpty().withMessage('Note is required'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { patientId, appointmentId, note } = req.body;
  try {
    const noteId = await mockDrChronoApi.createClinicalNote({ patientId, appointmentId, note, createdAt: new Date().toISOString() });
    res.json({ message: 'Clinical note created', noteId });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to create clinical note: ${error.message}` });
  }
});

// Resource: Get Billing Record
app.get('/getBillingRecord', queryValidation, async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { billingId } = req.query as { billingId: string };
  const cacheKey = `billing_${billingId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const record = await mockDrChronoApi.getBillingRecord(Number(billingId));
    if (!record) {
      res.status(404).json({ error: 'Billing record not found' });
      return;
    }
    cache.set(cacheKey, record);
    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch billing record: ${error.message}` });
  }
});

// Tool: Create Billing Record
app.post('/createBillingRecord', [
  body('patientId').isInt().withMessage('Patient ID is required'),
  body('appointmentId').isInt().withMessage('Appointment ID is required'),
  body('amount').isFloat().withMessage('Amount is required'),
  body('status').isIn(['Pending', 'Paid', 'Overdue']).withMessage('Invalid status'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { patientId, appointmentId, amount, status } = req.body;
  try {
    const billingId = await mockDrChronoApi.createBillingRecord({
      patientId,
      appointmentId,
      amount,
      status,
      invoiceDate: new Date().toISOString().split('T')[0],
    });
    res.json({ message: 'Billing record created', billingId });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to create billing record: ${error.message}` });
  }
});

// Prompt: Data Query
app.post('/promptQuery', [
  body('message').trim().notEmpty().withMessage('Message is required'),
], async (req: Request, res: Response): Promise<void> => {
  const { message } = req.body;
  res.json({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Execute DrChrono query: ${message}`,
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

  if (req.body.method === 'getPatient') {
    const { patientId } = req.body.params;
    const cacheKey = `patient_${patientId}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.json({ jsonrpc: '2.0', result: cached, id: req.body.id });
      return;
    }

    try {
      const patient = await mockDrChronoApi.getPatient(Number(patientId));
      if (!patient) throw new Error('Patient not found');
      cache.set(cacheKey, patient);
      res.json({ jsonrpc: '2.0', result: patient, id: req.body.id });
    } catch (error: any) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: `Failed to fetch patient: ${error.message}` },
        id: req.body.id,
      });
    }
  } else if (req.body.method === 'getAppointment') {
    const { appointmentId } = req.body.params;
    const cacheKey = `appointment_${appointmentId}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.json({ jsonrpc: '2.0', result: cached, id: req.body.id });
      return;
    }

    try {
      const appointment = await mockDrChronoApi.getAppointment(Number(appointmentId));
      if (!appointment) throw new Error('Appointment not found');
      cache.set(cacheKey, appointment);
      res.json({ jsonrpc: '2.0', result: appointment, id: req.body.id });
    } catch (error: any) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: `Failed to fetch appointment: ${error.message}` },
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
    if (request.path === '/getPatient') {
      const { patientId } = request;
      try {
        const patient = await mockDrChronoApi.getPatient(Number(patientId));
        if (!patient) {
          ws.send(JSON.stringify({ error: 'Patient not found' }));
          return;
        }
        ws.send(JSON.stringify(patient));
      } catch (error: any) {
        ws.send(JSON.stringify({ error: `Failed to fetch patient: ${error.message}` }));
      }
    } else if (request.path === '/getAppointment') {
      const { appointmentId } = request;
      try {
        const appointment = await mockDrChronoApi.getAppointment(Number(appointmentId));
        if (!appointment) {
          ws.send(JSON.stringify({ error: 'Appointment not found' }));
          return;
        }
        ws.send(JSON.stringify(appointment));
      } catch (error: any) {
        ws.send(JSON.stringify({ error: `Failed to fetch appointment: ${error.message}` }));
      }
    }
  });
});

// Error handling
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`✅ DrChrono MCP server is running on http://localhost:${PORT}`);
});