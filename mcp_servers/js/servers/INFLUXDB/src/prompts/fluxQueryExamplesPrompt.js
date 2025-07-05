// Prompt: Common Flux Queries
export async function fluxQueryExamplesPrompt() {
  console.log(`=== FLUX-QUERY-EXAMPLES PROMPT CALLED ===`);

  // Simple, direct approach - no dependencies
  const promptResponse = {
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Here are some example Flux queries for InfluxDB:

1. Get data from the last 5 minutes:
\`\`\`flux
from(bucket: "my-bucket")
  |> range(start: -5m)
  |> filter(fn: (r) => r._measurement == "cpu_usage")
\`\`\`

2. Calculate the average value over time windows:
\`\`\`flux
from(bucket: "my-bucket")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "temperature")
  |> aggregateWindow(every: 5m, fn: mean)
\`\`\`

3. Find the maximum value:
\`\`\`flux
from(bucket: "my-bucket")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "temperature" and r.sensor_id == "TLM0201")
  |> max()
\`\`\`

4. Group by a tag and calculate statistics:
\`\`\`flux
from(bucket: "my-bucket")
  |> range(start: -1d)
  |> filter(fn: (r) => r._measurement == "network_traffic")
  |> group(columns: ["host"])
  |> mean()
\`\`\`

5. Join two data sources:
\`\`\`flux
cpu = from(bucket: "my-bucket")
  |> range(start: -15m)
  |> filter(fn: (r) => r._measurement == "cpu")

mem = from(bucket: "my-bucket")
  |> range(start: -15m)
  |> filter(fn: (r) => r._measurement == "mem")

join(tables: {cpu: cpu, mem: mem}, on: ["_time", "host"])
\`\`\`

Please adjust these queries to match your specific bucket names, measurements, and requirements.`,
      },
    }],
  };

  console.log(`=== FLUX-QUERY-EXAMPLES PROMPT COMPLETED SUCCESSFULLY ===`);
  return promptResponse;
}
