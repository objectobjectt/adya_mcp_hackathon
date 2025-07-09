import { influxRequest } from "../utils/influxClient.js";

// Tool: Delete Label
export async function deleteLabel({creds, labelID}) {
  try {
    await influxRequest(creds, `/api/v2/labels/${labelID}`, {
      method: "DELETE",
    });

    return {
      content: [{
        type: "text",
        text: `Label with ID ${labelID} deleted successfully.`,
      }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error deleting label: ${error.message}` }],
      isError: true,
    };
  }
}
