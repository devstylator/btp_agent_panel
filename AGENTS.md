# Project guidance

## SAP CAP

- Before changing CDS models, CAP services, or CAP handlers, use the CAP MCP server to search the CAP documentation for relevant APIs and patterns.
- Use the CAP MCP server to inspect the effective CDS model before relying on assumptions about project entities or services. Read source files if the MCP lookup is unavailable or insufficient.
- Use the `cap-developer` skill for CAP modeling and handler conventions. Use `cap-add-remote-service` when integrating an external service into a CAP Node.js app.

## Fiori

- Use the Fiori MCP server when creating or modifying the Fiori Elements frontend; use the UI5 MCP server only if UI5-specific development needs it and that server is configured.
- Consult Fiori/SAPUI5 guidance for frontend work rather than treating CAP documentation as a frontend reference.

## Cloud Foundry and CPI

- Use the `cf-cli` skill for Cloud Foundry CLI v8, MTA deployment, service bindings, and troubleshooting.
- Confirm with the user before running deployment or other mutating Cloud Foundry operations. Never print, commit, or hardcode credentials, service keys, or tokens.
- A CAP application's outbound call to an iFlow API is an application integration, not a reason to expose CPI tenant-management operations as MCP tools. Use the project's configured remote-service or HTTP integration pattern and externalize destination and credentials.
- Configure a CPI MCP server only if the user specifically needs the assistant to inspect or manage the CPI tenant. Review its permissions and restrict write/security operations before enabling it.
