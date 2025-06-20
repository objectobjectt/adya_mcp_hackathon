GitHub MCP TypeScript Server  

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quickstart](#quickstart)
- [What is GitHub MCP Server?](#what-is-github-mcp-server)
- [Core Concepts](#core-concepts)
  - [Server](#server)
  - [Endpoints](#endpoints)
  - [Authentication](#authentication)
  - [Performance Features](#performance-features)
- [Running Your Server](#running-your-server)
  - [Local Deployment](#local-deployment)
  - [Environment Configuration](#environment-configuration)
  - [Testing and Debugging](#testing-and-debugging)
- [Examples](#examples)
  - [Fetch Repository Details](#fetch-repository-details)
  - [Create Issue](#create-issue)
  - [List Contributors](#list-contributors)
- [Advanced Usage](#advanced-usage)
  - [Caching Configuration](#caching-configuration)
  - [Rate Limiting](#rate-limiting)
  - [Custom Error Handling](#custom-error-handling)
  - [Extending Endpoints](#extending-endpoints)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)


Overview
The GitHub MCP Server enables applications to interact with GitHub repositories in a standardized way, leveraging the GitHub REST API v3. Built on Express.js, this TypeScript server implements a comprehensive set of endpoints for managing GitHub resources, optimized for performance and security. It supports:

Building clients to interact with GitHub repositories
Exposing repository data and actions as RESTful endpoints
Using standard transports like stdio and Streamable HTTP
Handling GitHub API interactions with authentication and error management

Installation
npm install express axios dotenv express-validator express-rate-limit node-cache morgan

Quick Start
Create a simple GitHub MCP server to fetch repository details:
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'your-github-token';
app.use(express.json());

// Authentication middleware
const authenticateRequest = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  if (!GITHUB_TOKEN) {
    res.status(500).json({ error: 'GitHub API token not configured' });
    return;
  }
  next();
};

// Validation for repository endpoints
const repoValidation = [
  body('owner').trim().notEmpty().withMessage('Owner is required'),
  body('repo').trim().notEmpty().withMessage('Repository is required')
];

// Fetch repository details
app.post('/getRepo', authenticateRequest, repoValidation, async (req: express.Request, res: express.Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { owner, repo } = req.body;

  try {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json'
      }
    });

    const { name, description, stargazers_count, forks_count, created_at, updated_at } = response.data;
    res.json({ name, description, stars: stargazers_count, forks: forks_count, created_at, updated_at });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch repository: ${error.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`✅ GitHub MCP server is running on http://localhost:${PORT}`);
});

What is GitHub MCP Server?
The GitHub MCP Server is a connector within the Vanij Platform that enables secure, standardized interaction with GitHub repositories using the GitHub REST API v3. It acts like a web API tailored for GitHub operations, allowing you to:

Expose repository data through Resources (e.g., metadata, issues, commits)
Perform actions through Tools (e.g., create issues, branches, forks)
Define interaction patterns through Prompts (templates for client interactions)
Optimize performance with caching, rate limiting, and logging

Core Concepts
Server
The GitHub MCP Server is built on Express.js, handling HTTP requests and GitHub API interactions:
const app = express();
app.use(express.json());
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

Resources
Resources expose GitHub data, similar to GET endpoints, providing information without side effects:
app.post('/getIssues', authenticateRequest, repoValidation, async (req, res) => {
  const { owner, repo } = req.body;
  const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }
  });
  res.json(response.data.map((issue: any) => ({
    number: issue.number,
    title: issue.title,
    state: issue.state,
    created_at: issue.created_at,
    user: issue.user.login
  })));
});

Tools
Tools enable actions like creating or modifying GitHub resources, similar to POST endpoints:
app.post('/createIssue', authenticateRequest, [
  ...repoValidation,
  body('title').trim().notEmpty().withMessage('Issue title is required')
], async (req, res) => {
  const { owner, repo, title, body } = req.body;
  const response = await axios.post(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    { title, body },
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' } }
  );
  res.json({
    issueNumber: response.data.number,
    url: response.data.html_url,
    created_at: response.data.created_at
  });
});

Prompts
Prompts define reusable templates for client interactions with the server:
app.post('/promptIssueCreation', authenticateRequest, [
  body('message').trim().notEmpty().withMessage('Message is required')
], async (req, res) => {
  const { message } = req.body;
  res.json({
    messages: [{
      role: 'user',
      content: { type: 'text', textF: `Create an issue with the following details: ${message}` }
    }]
  });
});

Running Your Server
GitHub MCP servers need a transport to communicate with clients. The server supports stdio and Streamable HTTP transports.
stdio
For command-line integrations:
import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
app.use(express.json());

wss.on('connection', (ws) => {
  ws.on('message', async (data) => {
    const request = JSON.parse(data.toString());
    if (request.path === '/getRepo') {
      const response = await axios.get(`https://api.github.com/repos/${request.owner}/${request.repo}`, {
        headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }
      });
      ws.send(JSON.stringify({
        name: response.data.name,
        description: response.data.description,
        stars: response.data.stargazers_count
      }));
    }
  });
});

server.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

Streamable HTTP
For remote servers, use Streamable HTTP for client requests and server notifications.
With Session Management
For stateful interactions:
import express from 'express';
import { randomUUID } from 'node:crypto';

const app = express();
app.use(express.json());

// Store transports by session ID
const transports: { [sessionId: string]: any } = {};

// Handle POST requests
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && req.body.type === 'initialize') {
    transport = { sessionId: randomUUID(), handleRequest: async (req, res) => {} };
    transports[transport.sessionId] = transport;
    res.setHeader('mcp-session-id', transport.sessionId);
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Bad Request: No valid session ID' },
      id: null
    });
    return;
  }

  // Handle request (simplified)
  await transport.handleRequest(req, res);
});

// Handle GET and DELETE requests
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  await transports[sessionId].handleRequest(req, res);
};

app.get('/mcp', handleSessionRequest);
app.delete('/mcp', handleSessionRequest);

app.listen(3000);

Without Session Management (Stateless)
For stateless interactions:
import express from 'express';

const app = express();
app.use(express.json());

app.post('/mcp', async (req: express.Request, res: express.Response) => {
  try {
    const response = await axios.get(`https://api.github.com/repos/${req.body.owner}/${req.body.repo}`, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }
    });
    res.json({
      jsonrpc: '2.0',
      result: {
        name: response.data.name,
        description: response.data.description
      },
      id: req.body.id
    });
  } catch (error) {
    res.status(500).json({
      jsonrpc: '2.0',
      error: { code: -32603, message: 'Internal server error' },
      id: req.body.id
    });
  }
});

app.get('/mcp', (req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed' },
    id: null
  });
});

app.delete('/mcp', (req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed' },
    id: null
  });
});

app.listen(3000, () => {
  console.log(`✅ GitHub MCP Stateless Streamable HTTP Server listening on port 3000`);
});

This stateless approach is useful for:

Simple API wrappers
RESTful scenarios with independent requests
Horizontally scaled deployments

Testing and Debugging
Test your server using tools like Postman or curl:
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d '{"id":1,"method":"getRepo","params":{"owner":"octocat","repo":"hello-world"}}'

Use morgan logs for debugging request details and errors.
Examples
Echo Server
A simple server demonstrating resources, tools, and prompts:
import express from 'express';
import { body } from 'express-validator';

const app = express();
app.use(express.json());

app.post('/echo', [
  body('message').trim().notEmpty().withMessage('Message is required')
], async (req, res) => {
  const { message } = req.body;
  res.json({
    resource: { uri: `echo://${message}`, text: `Resource echo: ${message}` },
    tool: { content: [{ type: 'text', text: `Tool echo: ${message}` }] },
    prompt: {
      messages: [{
        role: 'user',
        content: { type: 'text', text: `Please process this message: ${message}` }
      }]
    }
  });
});

app.listen(3000);

SQLite Explorer
Integrate with a SQLite database:
import express from 'express';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { body } from 'express-validator';

const app = express();
app.use(express.json());

const getDb = () => {
  const db = new sqlite3.Database('database.db');
  return {
    all: promisify<string, any[]>(db.all.bind(db)),
    close: promisify(db.close.bind(db))
  };
};

app.post('/schema', async (req, res) => {
  const db = getDb();
  try {
    const tables = await db.all("SELECT sql FROM sqlite_master WHERE type='table'");
    res.json({
      contents: [{
        uri: 'schema://main',
        text: tables.map((t: {sql: string}) => t.sql).join('\n')
      }]
    });
  } finally {
    await db.close();
  }
});

app.post('/query', [body('sql').trim().notEmpty()], async (req, res) => {
  const { sql } = req.body;
  const db = getDb();
  try {
    const results = await db.all(sql);
    res.json({
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }]
    });
  } catch (err: unknown) {
    res.json({
      content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
      isError: true
    });
  } finally {
    await db.close();
  }
});

app.listen(3000);

Advanced Usage
Dynamic Servers
Dynamically add or remove endpoints based on state:
import express from 'express';

const app = express();
app.use(express.json());

let endpoints: { [key: string]: boolean } = { getRepo: true };

app.post('/addEndpoint', [body('name').notEmpty()], async (req, res) => {
  endpoints[req.body.name] = true;
  res.json({ message: `Endpoint ${req.body.name} enabled` });
});

app.post('/removeEndpoint', [body('name').notEmpty()], async (req, res) => {
  delete endpoints[req.body.name];
  res.json({ message: `Endpoint ${req.body.name} disabled` });
});

app.post('/getRepo', async (req, res) => {
  if (!endpoints.getRepo) return res.status(404).json({ error: 'Endpoint disabled' });
  // Handle getRepo request
});

Low-Level Server
For fine-grained control, implement a custom server:
import express from 'express';

const app = express();
app.use(express.json());

app.post('/mcp', async (req, res) => {
  if (req.body.method === 'listEndpoints') {
    res.json({
      jsonrpc: '2.0',
      result: { endpoints: ['getRepo', 'createIssue'] },
      id: req.body.id
    });
  } else if (req.body.method === 'getRepo') {
    // Handle getRepo
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid method' },
      id: req.body.id
    });
  }
});

app.listen(3000);

Writing MCP Clients
Create a client to interact with the server:
import axios from 'axios';

const client = {
  async call(method: string, params: any) {
    const response = await axios.post('http://localhost:3000/mcp', {
      jsonrpc: '2.0',
      method,
      params,
      id: Math.floor(Math.random() * 1000)
    });
    return response.data.result;
  }
};

// List endpoints
const endpoints = await client.call('listEndpoints', {});

// Call getRepo
const repo = await client.call('getRepo', { owner: 'octocat', repo: 'hello-world' });

Proxy Authorization Requests Upstream
Proxy GitHub OAuth requests:
import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

const proxyAuth = {
  authorizationUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  verifyAccessToken: async (token: string) => ({
    token,
    clientId: 'github-client-id',
    scopes: ['repo', 'workflow']
  }),
  getClient: async (client_id: string) => ({
    client_id,
    redirect_uris: ['http://localhost:3000/callback']
  })
};

app.use('/auth', async (req, res) => {
  if (req.path === '/authorize') {
    res.redirect(`${proxyAuth.authorizationUrl}?client_id=${proxyAuth.getClient('id').client_id}`);
  } else if (req.path === '/token') {
    const token = await proxyAuth.verifyAccessToken(req.body.code);
    res.json(token);
  }
});

app.listen(3000);

Backwards Compatibility
Support both Streamable HTTP and deprecated HTTP+SSE transports.
Client-Side Compatibility
import axios from 'axios';

let client: any;
const baseUrl = 'http://localhost:3000';

try {
  client = {
    async call(method: string, params: any) {
      const res = await axios.post(`${baseUrl}/mcp`, { method, params });
      return res.data.result;
    }
  };
  console.log('Connected using Streamable HTTP');
} catch (error) {
  client = {
    async call(method: string, params: any) {
      const res = await axios.post(`${baseUrl}/sse`, { method, params });
      return res.data.result;
    }
  };
  console.log('Connected using SSE');
}

Server-Side Compatibility
import express from 'express';

const app = express();
app.use(express.json());

const transports: { streamable: any; sse: any } = { streamable: {}, sse: {} };

app.all('/mcp', async (req, res) => {
  // Handle Streamable HTTP (simplified)
});

app.get('/sse', async (req, res) => {
  const transport = { sessionId: 'sse-id', handlePostMessage: async () => {} };
  transports.sse[transport.sessionId] = transport;
  res.json({ sessionId: transport.sessionId });
});

app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.sse[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res, req.body);
  } else {
    res.status(400).send('No transport found');
  }
});

app.listen(3000);

Note: The SSE transport is deprecated. New implementations should use Streamable HTTP.
Documentation

GitHub REST API v3
Vanij Platform
GitHub MCP Server

Contributing
Issues and pull requests are welcome at https://github.com/your-org/github-mcp-server.
License
This project is licensed under the MIT License—see the LICENSE file for details.
