import { influxRequest } from "../utils/influxClient.js";

// Tool: Update Label
export async function updateLabel({ creds, labelID, name, color, description }) {
  try {
    const payload = {
      name,
      properties: {
        color,
        description,
      },
    };

    const response = await influxRequest(creds, `/api/v2/labels/${labelID}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    const updated = await response.json();

    return {
      content: [{
        type: "text",
        text: `Label updated:\nID: ${updated.id}\nName: ${updated.name}`,
      }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error updating label: ${error.message}` }],
      isError: true,
    };
  }
}
