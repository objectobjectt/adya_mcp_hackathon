const { GoogleGenerativeAI } = require("@google/generative-ai")

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const required = ["VERCEL_TOKEN", "GEMINI_API_KEY"]
  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }
}

/**
 * Create execution context with API clients and configuration
 */
function createContext(args = {}) {
  // Extract credentials from args.__credentials__ first, then fall back to environment
  const credentials = args.__credentials__ || {};
  const vercelToken = credentials.token || process.env.VERCEL_TOKEN;
  const geminiApiKey = credentials.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  console.log("Extracted credentials:", { vercelToken, geminiApiKey });

  console.log("Validating environment variables:", vercelToken ? "VERCEL_TOKEN present" : "VERCEL_TOKEN missing", geminiApiKey ? "GEMINI_API_KEY present" : "GEMINI_API_KEY missing");

  if (!vercelToken) {
    throw new Error("Missing Vercel token - provide via credentials or VERCEL_TOKEN environment variable")
  }

  if (!geminiApiKey) {
    throw new Error("Missing GEMINI_API_KEY - provide via credentials or GEMINI_API_KEY environment variable")
  }

  // Initialize Google Generative AI
  const genAI = new GoogleGenerativeAI(geminiApiKey)

  return {
    vercelToken,
    geminiApiKey,
    teamId: credentials.teamId || process.env.TEAM_ID || null,
    projectId: credentials.projectId || process.env.PROJECT_ID || null,
    deploymentId: credentials.deploymentId || process.env.DEPLOYMENT_ID || null,
    genAI,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Format API response for MCP
 */
function formatResponse(data, message = "") {
  return {
    content: [
      {
        type: "text",
        text: message ? `${message}\n\n${JSON.stringify(data, null, 2)}` : JSON.stringify(data, null, 2),
      },
    ],
  }
}

/**
 * Handle API errors consistently
 */
function handleApiError(error, operation) {
  console.error(`[${operation}] Error:`, error)
  throw new Error(`${operation} failed: ${error.message}`)
}

/**
 * Build URL with query parameters
 */
function buildUrl(baseUrl, params = {}) {
  const url = new URL(baseUrl)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString())
    }
  })
  return url.toString()
}

/**
 * Make authenticated request to Vercel API
 */
async function makeVercelRequest(endpoint, options = {}) {
  const { method = "GET", body, params, token } = options

  const url = buildUrl(`https://api.vercel.com${endpoint}`, params)

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`)
  }

  return response.json()
}

/**
 * Validate required parameters
 */
function validateParams(params, required) {
  const missing = required.filter((key) => !params[key])
  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(", ")}`)
  }
}

/**
 * Generate AI prompt for deployment assistance
 */
function generateDeploymentPrompt(query, context = "") {
  return `You are a Vercel deployment expert. Help with this deployment question:

Question: ${query}
${context ? `Context: ${context}` : ""}

Provide a detailed, actionable response with:
1. Root cause analysis
2. Step-by-step solution
3. Best practices
4. Prevention tips

Format your response clearly with headers and bullet points.`
}

/**
 * Generate AI prompt for project optimization
 */
function generateOptimizationPrompt(projectData, deploymentData) {
  return `Analyze this Vercel project and provide optimization recommendations:

Project: ${JSON.stringify(projectData, null, 2)}
Recent Deployments: ${JSON.stringify(deploymentData, null, 2)}

Provide recommendations for:
1. Performance optimization
2. Build time improvements
3. Cost optimization
4. Security enhancements
5. Developer experience improvements

Format as actionable recommendations with priority levels.`
}

/**
 * Generate AI prompt for security audit
 */
function generateSecurityPrompt(projectData, envData, auditType = "basic") {
  return `Perform a ${auditType} security audit for this Vercel project:

Project: ${JSON.stringify(projectData, null, 2)}
Environment Variables: ${JSON.stringify(envData, null, 2)}

Security Audit Areas:
1. Environment variable security and exposure
2. Domain and SSL configuration
3. Authentication and authorization setup
4. Dependency security vulnerabilities
5. Build and deployment security
6. Access control and permissions
7. Data protection and privacy
8. Compliance considerations (GDPR, SOC2, etc.)

Provide:
- Security risk assessment (High/Medium/Low)
- Specific vulnerabilities found
- Remediation steps with priority
- Security best practices recommendations
- Compliance checklist items

Format as a comprehensive security report.`
}

module.exports = {
  validateEnvironment,
  createContext,
  formatResponse,
  handleApiError,
  buildUrl,
  makeVercelRequest,
  validateParams,
  generateDeploymentPrompt,
  generateOptimizationPrompt,
  generateSecurityPrompt,
}
