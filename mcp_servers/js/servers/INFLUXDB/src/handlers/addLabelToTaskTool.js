import { influxRequest } from "../utils/influxClient.js";

// Tool: Add Label to Task
export async function addLabelToTask({ creds, taskID, labelID }) {
    try {
        await influxRequest(creds, `/api/v2/tasks/${taskID}/labels`, {
            method: "POST",
            body: JSON.stringify({ labelID }),
        });

        return {
            content: [
                {
                    type: "text",
                    text: `Label ${labelID} added to task ${taskID}.`,
                },
            ],
        };
    } catch (error) {
        return {
            content: [{ type: "text", text: `Error adding label: ${error.message}` }],
            isError: true,
        };
    }
}
