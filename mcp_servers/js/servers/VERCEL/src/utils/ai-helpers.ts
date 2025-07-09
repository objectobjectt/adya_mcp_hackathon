import { z } from "zod"

// Response validation schema
const AIResponseSchema = z.object({
  summary: z.string().optional(),
  analysis: z.string().optional(),
  recommendations: z.array(z.string()).optional(),
  actionItems: z.array(z.string()).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  estimatedTime: z.string().optional(),
})

export function validateAIResponse(response: string): string {
  try {
    // Basic validation - ensure response is not empty and has reasonable length
    if (!response || response.trim().length < 10) {
      throw new Error("AI response is too short or empty")
    }

    // Check for potential harmful content (basic filtering)
    const harmfulPatterns = [/\b(hack|exploit|vulnerability)\b/gi, /\b(password|secret|token)\s*[:=]\s*\S+/gi]

    let sanitizedResponse = response
    harmfulPatterns.forEach((pattern) => {
      sanitizedResponse = sanitizedResponse.replace(pattern, "[REDACTED]")
    })

    return sanitizedResponse
  } catch (error) {
    console.error("AI response validation failed:", error)
    return "AI analysis could not be completed due to validation issues."
  }
}

export function formatAIResponse(response: string): string {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(response)
    return JSON.stringify(parsed, null, 2)
  } catch {
    // If not JSON, format as structured text
    return response
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n")
  }
}

export function extractActionItems(response: string): string[] {
  const actionItems: string[] = []

  try {
    // Try to parse as JSON and extract action items
    const parsed = JSON.parse(response)
    if (parsed.actionItems && Array.isArray(parsed.actionItems)) {
      return parsed.actionItems
    }
    if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
      return parsed.recommendations
    }
  } catch {
    // Extract action items from text using patterns
    const lines = response.split("\n")
    const actionPatterns = [/^\s*[-*]\s+(.+)$/, /^\s*\d+\.\s+(.+)$/, /^(TODO|Action|Recommendation):\s*(.+)$/i]

    lines.forEach((line) => {
      actionPatterns.forEach((pattern) => {
        const match = line.match(pattern)
        if (match) {
          const actionItem = match[1] || match[2]
          if (actionItem && actionItem.trim().length > 5) {
            actionItems.push(actionItem.trim())
          }
        }
      })
    })
  }

  return actionItems.slice(0, 10) // Limit to 10 action items
}

export function categorizeResponse(response: string): {
  category: string
  confidence: number
  tags: string[]
} {
  const categories = {
    deployment: ["deploy", "build", "error", "fail"],
    performance: ["slow", "optimize", "speed", "performance"],
    security: ["security", "vulnerability", "auth", "permission"],
    cost: ["cost", "billing", "usage", "optimize"],
    team: ["team", "collaboration", "member", "access"],
  }

  const responseLower = response.toLowerCase()
  const scores: Record<string, number> = {}
  const tags: string[] = []

  Object.entries(categories).forEach(([category, keywords]) => {
    const score = keywords.reduce((acc, keyword) => {
      const matches = (responseLower.match(new RegExp(keyword, "g")) || []).length
      if (matches > 0) tags.push(keyword)
      return acc + matches
    }, 0)
    scores[category] = score
  })

  const topCategory = Object.entries(scores).reduce((a, b) => (scores[a[0]] > scores[b[0]] ? a : b))

  return {
    category: topCategory[0],
    confidence: Math.min(topCategory[1] / 5, 1), // Normalize to 0-1
    tags: [...new Set(tags)], // Remove duplicates
  }
}

export function generateContextSummary(context: any): string {
  const summary = {
    timestamp: new Date().toISOString(),
    type: context.type || "analysis",
    projectId: context.projectId || context.project?.id,
    deploymentId: context.deploymentId,
    severity: context.severity || "medium",
  }

  return JSON.stringify(summary, null, 2)
}

export async function rateLimitAIRequests(requestKey: string, maxRequests = 10, windowMs = 60000): Promise<boolean> {
  // Simple in-memory rate limiting
  // In production, you'd want to use Redis or similar
  const now = Date.now()
  const windowStart = now - windowMs

  // This is a simplified implementation
  // You should implement proper rate limiting based on your needs
  return true // Allow all requests for now
}
