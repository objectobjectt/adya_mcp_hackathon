import fetch from "node-fetch";
import { INFLUXDB_TOKEN, INFLUXDB_URL } from "../config/env.js";

// Tool: Create Bucket
export async function deleteBucket({ creds, bucketId }) {
    console.log(`=== DELETE-BUCKET TOOL CALLED ===`);
    console.log(`Deleting bucket: bucketId: ${bucketId}`);

    try {
        // Use fetch directly instead of our wrapper
        const response = await fetch(`${creds.influxdb_url}/api/v2/buckets/${bucketId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${creds.influxdb_token}`,
            },
        });

        console.log(`Delete bucket response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to delete bucket: ${response.status} ${errorText}`);
        }

        console.log(`=== CREATE-BUCKET TOOL COMPLETED SUCCESSFULLY ===`);
        return {
            content: [
                {
                    type: "text",
                    text: `Bucket deleted successfully:\nID: ${bucketId}`,
                },
            ],
        };
    } catch (error) {
        console.error(`=== DELETE-BUCKET TOOL ERROR: ${error.message} ===`);
        return {
            content: [
                {
                    type: "text",
                    text: `Error delete bucket: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
}
