import { influxRequest } from "../utils/influxClient.js";

// Tool: Update Task
export async function updateTask({ creds, taskID, ...updates }) {
  try {
    const response = await influxRequest(creds, `/api/v2/tasks/${taskID}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });

    const task = await response.json();

    return {
      content: [{
        type: "text",
        text: `Task updated:\nID: ${task.id}\nStatus: ${task.status}`,
      }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error updating task: ${error.message}` }],
      isError: true,
    };
  }
}
