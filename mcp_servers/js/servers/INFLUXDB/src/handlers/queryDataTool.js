import { influxRequest } from "../utils/influxClient.js";

// Tool: Query Data
export async function queryData({ creds, org, query }) {
  try {
    const response = await influxRequest(creds, 
      `/api/v2/query?org=${encodeURIComponent(org)}`,
      {
        method: "POST",
        body: JSON.stringify({ query, type: "flux" }),
      },
    );

    const responseText = await response.text();

    return {
      content: [{
        type: "text",
        text: responseText,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error executing query: ${error.message}`,
      }],
      isError: true,
    };
  }
}
