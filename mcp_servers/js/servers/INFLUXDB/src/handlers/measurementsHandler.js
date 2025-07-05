import { influxRequest } from "../utils/influxClient.js";
import { DEFAULT_ORG } from "../config/env.js";

// Resource: Get Measurements in a Bucket
export async function bucketMeasurements({ creds, bucketName }) {
  console.log(
    `Processing measurements in bucket '${bucketName}' request - START`,
  );

  if (!creds.influxdb_default_org) {
    console.error("Error: INFLUXDB_ORG environment variable is not set");
    return {
      contents: [{
        text: JSON.stringify({
          error: "INFLUXDB_ORG environment variable is not set",
        }),
      }],
      error: true,
    };
  }

  try {
    // Use Flux query to get measurements
    console.log(
      `Creating Flux query for bucket '${bucketName}' measurements`,
    );
    const queryBody = JSON.stringify({
      query: `import "influxdata/influxdb/schema"

schema.measurements(bucket: "${bucketName}")`,
      type: "flux",
    });

    console.log(`Making InfluxDB API request for measurements...`);
    const response = await influxRequest(creds, 
      "/api/v2/query?org=" + encodeURIComponent(creds.influxdb_default_org),
      {
        method: "POST",
        body: queryBody,
      },
      5000, // Explicit timeout
    );
    console.log(
      "Measurements API response received, status:",
      response.status,
    );

    console.log("Reading response text...");
    const responseText = await response.text();

    console.log("Parsing CSV response...");
    const lines = responseText.split("\n").filter((line) => line.trim() !== "");
    console.log(`Found ${lines.length} lines in the response`);

    // Parse CSV response (Flux queries return CSV)
    const headers = lines[0].split(",");
    const valueIndex = headers.indexOf("_value");
    console.log("Headers:", headers);
    console.log("Value index:", valueIndex);

    if (valueIndex === -1) {
      console.log("No _value column found in the response");
      return {
        contents: [{
          text: JSON.stringify({
            bucket: bucketName,
            measurements: [],
          }),
        }],
      };
    }

    console.log("Extracting measurement values...");
    const measurements = lines.slice(1)
      .map((line) => line.split(",")[valueIndex])
      .filter((m) => m && !m.startsWith("#"))
      .join("\n");

    console.log(`Found ${measurements.split("\n").length} measurements`);
    console.log("Successfully processed measurements request - END");

    // Create a proper JSON structure for measurements
    const measurementsArray = measurements.split("\n").filter((m) =>
      m.trim() !== ""
    );

    return {
      contents: [{
        text: JSON.stringify({
          bucket: bucketName,
          measurements: measurementsArray,
        }),
      }],
    };
  } catch (error) {
    console.error(`Error in bucket measurements resource: ${error.message}`);
    console.error(error.stack);

    return {
      contents: [{
        text: JSON.stringify({
          error: `Error retrieving measurements: ${error.message}`,
        }),
      }],
      error: true,
    };
  }
}
