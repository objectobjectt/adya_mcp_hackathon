// Prompt: Line Protocol Guide
export async function lineProtocolGuidePrompt() {
  console.log(`=== LINE-PROTOCOL-GUIDE PROMPT CALLED ===`);

  // Simple, direct approach - no dependencies
  const promptResponse = {
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `# InfluxDB Line Protocol Guide

Line protocol is the text format for writing data to InfluxDB. It follows this structure:

\`\`\`
measurement,tag-key=tag-value field-key="field-value" timestamp
\`\`\`

## Components:

1. **Measurement**: Name of the measurement (similar to a table in SQL)
2. **Tags**: Key-value pairs for metadata (used for indexing, optional)
3. **Fields**: Key-value pairs for the actual data values (required)
4. **Timestamp**: Unix timestamp in the specified precision (optional, defaults to current time)

## Examples:

1. Basic point:
\`\`\`
temperature,room=kitchen value=72.1 1631025259000000000
\`\`\`

2. Multiple fields:
\`\`\`
weather,location=us-midwest temperature=82.0,humidity=54.0,pressure=1012.1 1631025259000000000
\`\`\`

3. Multiple tags:
\`\`\`
cpu_usage,host=server01,region=us-west cpu=64.2,mem=47.3 1631025259000000000
\`\`\`

4. Different data types:
\`\`\`
readings,device=thermostat temperature=72.1,active=true,status="normal" 1631025259000000000
\`\`\`

## Notes:
- Escape special characters in string field values with double quotes and backslashes
- Do not use double quotes for tag values
- Timestamps are in nanoseconds by default, but can be in other precisions (set with the precision parameter)
- Multiple points can be written by separating them with newlines

## Common Issues:
- Field values require a type indicator (no quotes for numbers, true/false for booleans, quotes for strings)
- At least one field is required per point
- Special characters (spaces, commas) in measurement names, tag keys, tag values, or field keys must be escaped
- Timestamps should match the specified precision`,
      },
    }],
  };

  console.log(`=== LINE-PROTOCOL-GUIDE PROMPT COMPLETED SUCCESSFULLY ===`);
  return promptResponse;
}
