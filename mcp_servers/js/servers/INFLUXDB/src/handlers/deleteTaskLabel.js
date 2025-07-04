import { influxRequest } from "../utils/influxClient.js";

// Tool: Delete Label from Task
export async function deleteLabelFromTask({ creds, taskID, labelID }) {
  try {
    await influxRequest(creds, `/api/v2/tasks/${taskID}/labels/${labelID}`, {
      method: "DELETE",
    });

    return {
      content: [{
        type: "text",
        text: `Label ${labelID} removed from task ${taskID}.`,
      }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error removing label: ${error.message}` }],
      isError: true,
    };
  }
}
