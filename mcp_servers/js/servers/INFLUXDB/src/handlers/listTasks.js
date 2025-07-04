import { influxRequest } from "../utils/influxClient.js";

// Tool: List Tasks
export async function listTasks({creds}) {
  try {
    const response = await influxRequest(creds, `/api/v2/tasks`, {
      method: "GET",
    });
    const data = await response.json();

    return {
      content: [{
        type: "text",
        text: `Tasks:\n${data.tasks.map(t => `• ${t.name} (${t.id})`).join('\n') || "No tasks found."}`,
      }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error listing tasks: ${error.message}` }],
      isError: true,
    };
  }
}
