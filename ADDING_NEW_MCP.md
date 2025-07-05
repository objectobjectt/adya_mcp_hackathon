## Instructions for Adding a New MCP Server

When adding a new MCP server, follow the steps below:

1. **Add the New MCP Server Directory**

   * Location: `mcp_servers/js/servers`
   * Naming Convention: Use **ALL UPPERCASE** for the directory name corresponding to the MCP server.

2. **Update the Configuration**

   * File: `mcp_servers/js/clients/src/client_and_server_config.ts`
   * Add an entry for the new MCP server.

3. **Update the Dyanmic Credentials Logic**

   * File: `mcp_servers/js/clients/src/client_and_server_execution.ts`
   * Add a case to handle the new MCP server credentials.

4. **Add Documentation for the New MCP Server**

   * Location: `mcp_servers_documentation/`
   * Copy the existing `[MCP_DOC_TEMPLATE]` directory.
   * Rename it to match the new MCP name in **ALL UPPERCASE**.
   * Ensure the documentation is updated accordingly.
