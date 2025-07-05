import { influxRequest } from "../utils/influxClient.js";

// Tool: Remove Organization Member
export async function removeOrgMember({ creds, orgID, userID }) {
  try {
    await influxRequest(creds, `/api/v2/orgs/${orgID}/members/${userID}`, {
      method: "DELETE",
    });

    return {
      content: [{
        type: "text",
        text: `Member with ID ${userID} removed successfully from organization ${orgID}.`,
      }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error removing member: ${error.message}` }],
      isError: true,
    };
  }
}
