import { influxRequest } from "../utils/influxClient.js";

// Tool: Delete Organization
export async function deleteOrg({ creds, orgId }) {
  try {
    const response = await influxRequest(creds, `/api/v2/orgs/${orgId}`, {
      method: "DELETE",
    });

    if (response.status !== 204) {
        throw new Error(`Failed to delete organization: ${response.statusText}`);
    }

    return {
      content: [{
        type: "text",
        text:
          `Organization deleted successfully:\nID: ${orgId}`,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error deleting organization: ${error.message}`,
      }],
      isError: true,
    };
  }
}
