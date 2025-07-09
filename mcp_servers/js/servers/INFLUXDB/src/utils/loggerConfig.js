// Redirect console.log and console.error to stderr to avoid interfering with MCP protocol messages
// MCP uses stdout for protocol communication
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

export function configureLogger() {
  console.log = function() {
    process.stderr.write("[INFO] " + Array.from(arguments).join(" ") + "\n");
  };

  console.error = function() {
    process.stderr.write("[ERROR] " + Array.from(arguments).join(" ") + "\n");
  };
}
