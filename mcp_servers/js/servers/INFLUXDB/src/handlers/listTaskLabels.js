import { influxRequest } from "../utils/influxClient.js";

// Tool: List Task Labels
export async function listTaskLabels({ creds, taskID }) {
  try {
    const response = await influxRequest(creds, `/api/v2/tasks/${taskID}/labels`, {
      method: "GET",
    });

    const data = await response.json();

    return {
      content: [{
        type: "text",
        text: `Labels for task ${taskID}:\n${data.labels.map(l => `• ${l.name} (${l.id})`).join('\n') || "No labels found."}`,
      }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error listing labels: ${error.message}` }],
      isError: true,
    };
  }
}
