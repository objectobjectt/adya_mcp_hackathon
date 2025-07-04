import { influxRequest } from "../utils/influxClient.js";

// Tool: Health Check
export async function healthCheck({ creds }) {
  try {
    const response = await influxRequest(
      creds,
      `/api/health`,
      {
        method: "GET",
      },
    );

    let isHealthy = response.ok;
    let responseText = "InfluxDB Instance is ";

    if (!isHealthy){
        responseText = "Unhealthy!!"
    }else{
        responseText = "Healthy"
    }

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
        text: `Error checking health: ${error.message}`,
      }],
      isError: true,
    };
  }
}
