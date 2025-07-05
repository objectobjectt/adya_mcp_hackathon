import fetch from "node-fetch";
// Helper function for InfluxDB API requests with timeout
export async function influxRequest(creds, endpoint, options = {}, timeoutMs = 5000) {
  const { influxdb_url, influxdb_token } = creds || {};
  const url = `${influxdb_url}${endpoint}`;
  const defaultOptions = {
    headers: {
      Authorization: `Token ${influxdb_token}`,
      "Content-Type": "application/json",
    },
  };

  console.log(`Making request to: ${url}`);

  try {
    // Use AbortController for proper request cancellation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort(`InfluxDB API request timed out after ${timeoutMs}ms`);
    }, timeoutMs);

    // Properly merge headers to avoid conflicts
    // This ensures custom headers (like Content-Type) aren't overridden
    const mergedHeaders = {
      ...defaultOptions.headers,
      ...options.headers || {},
    };

    // Add the abort signal to the request options
    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: mergedHeaders,
      signal: controller.signal,
    };

    console.log(`Request options: ${JSON.stringify({
      method: requestOptions.method,
      headers: Object.keys(requestOptions.headers),
    })
      }`);

    // Make the request
    const response = await fetch(url, requestOptions);

    // Clear the timeout since the request completed
    clearTimeout(timeoutId);

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await Promise.race([
        response.text(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Response text timeout")), 3000)
        ),
      ]);
      throw new Error(`InfluxDB API Error (${response.status}): ${errorText}`);
    }

    return response;
  } catch (error) {
    // Log the error with more details
    console.error(`Error in influxRequest to ${url}:`, error.message);
    // Rethrow to be handled by the caller
    throw error;
  }
}
