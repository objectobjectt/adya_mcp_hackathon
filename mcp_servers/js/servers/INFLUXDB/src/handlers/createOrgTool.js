import { influxRequest } from "../utils/influxClient.js";

// Tool: Create Organization
export async function createOrg({ creds, name, description }) {
  try {
    const orgData = {
      name,
      description,
    };

    const response = await influxRequest(creds, "/api/v2/orgs", {
      method: "POST",
      body: JSON.stringify(orgData),
    });

    const org = await response.json();

    return {
      content: [{
        type: "text",
        text:
          `Organization created successfully:\nID: ${org.id}\nName: ${org.name}\nDescription: ${org.description || "N/A"
          }`,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error creating organization: ${error.message}`,
      }],
      isError: true,
    };
  }
}
