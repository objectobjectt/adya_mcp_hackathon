import { influxRequest } from "../utils/influxClient.js";

// Tool: List Organization Members
export async function listOrgMembers({creds, orgID}) {
  try {
    console.log(`Listing members for organization ID: ${orgID}`);
    
    const response = await influxRequest(creds, `/api/v2/orgs/${orgID}/members`, {
      method: "GET",
    });
    const members = await response.json();

    return {
      content: [{
        type: "text",
        text: `Members of Organization:\n${members.users.map(u => `• ${u.name} (${u.id})`).join('\n') || "No members found."}`,
      }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error listing members: ${error.message}` }],
      isError: true,
    };
  }
}
