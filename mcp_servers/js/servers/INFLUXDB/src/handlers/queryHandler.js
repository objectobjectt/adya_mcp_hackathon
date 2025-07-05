import fetch from "node-fetch";

// Resource: Query data as a resource
export async function executeQuery({ creds, orgName, fluxQuery }) {
  console.log(`=== QUERY RESOURCE CALLED ===`);
  console.log(`Query for org: ${orgName}, query length: ${fluxQuery.length}`);

  try {
    const decodedQuery = decodeURIComponent(fluxQuery);
    console.log(`Decoded query: ${decodedQuery.substring(0, 50)}...`);

    // Direct fetch approach
    const queryUrl = `${creds.influxdb_url}/api/v2/query?org=${encodeURIComponent(orgName)
      }`;
    console.log(`Query URL: ${queryUrl}`);

    const response = await fetch(queryUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${creds.influxdb_token}`,
      },
      body: JSON.stringify({ query: decodedQuery, type: "flux" }),
    });

    console.log(`Query response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to execute query: ${response.status} ${errorText}`,
      );
    }

    const responseText = await response.text();
    console.log(`Query response length: ${responseText.length}`);

    console.log(`=== QUERY RESOURCE COMPLETED SUCCESSFULLY ===`);

    // Parse CSV to JSON
    const lines = responseText.split("\n").filter((line) => line.trim() !== "");
    let result;

    if (lines.length > 1) {
      const headers = lines[0].split(",");
      const data = lines.slice(1).map((line) => {
        const values = line.split(",");
        const record = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });
        return record;
      });

      result = {
        contents: [{
          text: JSON.stringify({
            query: decodedQuery,
            organization: orgName,
            headers: headers,
            data: data,
          }),
        }],
      };
    } else {
      // No results or headers only
      result = {
        contents: [{
          text: JSON.stringify({
            query: decodedQuery,
            organization: orgName,
            data: [],
          }),
        }],
      };
    }

    return result;
  } catch (error) {
    console.error(`=== QUERY RESOURCE ERROR: ${error.message} ===`);
    return {
      contents: [{
        text: JSON.stringify({
          error: `Error executing query: ${error.message}`,
        }),
      }],
      error: true,
    };
  }
}
