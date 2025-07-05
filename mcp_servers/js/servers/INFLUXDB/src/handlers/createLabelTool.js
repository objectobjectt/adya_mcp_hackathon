import { influxRequest } from "../utils/influxClient.js";

// Tool: Create Label
export async function createLabel({ creds, name, orgID, color, description }) {
  try {
    const payload = {
      name,
      orgID,
      properties: {
        color,
        description,
      },
    };

    const response = await influxRequest(creds, `/api/v2/labels`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const labelData = await response.json();

    return {
      content: [{
        type: "text",
        text: `Label created:\nID: ${labelData.label.id}\nName: ${labelData.label.name}`,
      }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error creating label: ${error.message}` }],
      isError: true,
    };
  }
}
