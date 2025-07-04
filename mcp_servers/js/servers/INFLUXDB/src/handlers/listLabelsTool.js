import { influxRequest } from "../utils/influxClient.js";

// Tool: List Labels
export async function listLabels({creds, orgID}) {
  try {
    const response = await influxRequest(creds, `/api/v2/labels?orgID=${orgID}`, {
      method: "GET",
    });
    const data = await response.json();

    return {
      content: [{
        type: "text",
        text: `Labels:\n${data.labels.map(l => `• ${l.name} (${l.id})`).join('\n') || "No labels found."}`,
      }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error listing labels: ${error.message}` }],
      isError: true,
    };
  }
}
