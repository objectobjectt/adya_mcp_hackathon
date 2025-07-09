import { influxRequest } from "../utils/influxClient.js";

// Tool: Create Task
export async function createTask({ creds, description, flux, orgID }) {
  try {
    const response = await influxRequest(creds, "/api/v2/tasks", {
      method: "POST",
      body: JSON.stringify({ description, flux, orgID }),
    });

    const task = await response.json();

    console.log(`Task created`);
    

    return {
      content: [{
        type: "text",
        text: `Task created:\nID: ${task.id}\nName: ${task.name || "N/A"}\nStatus: ${task.status}`,
      }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error creating task: ${error.message}` }],
      isError: true,
    };
  }
}
