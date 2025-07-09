import { influxRequest } from "../utils/influxClient.js";

// Tool: Add Organization Member
export async function addOrgMember({ creds, orgID, id, name }) {
  try {
    const payload = { id, name };
    const response = await influxRequest(creds, `/api/v2/orgs/${orgID}/members`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const user = await response.json();

    return {
      content: [{
        type: "text",
        text: `Member added:\nID: ${user.id}\nName: ${user.name}`,
      }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error adding member: ${error.message}` }],
      isError: true,
    };
  }
}
