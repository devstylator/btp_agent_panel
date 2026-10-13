# SAP BTP Agent Administration prototype

A local, interactive prototype for the initial requirements in [`REQUIREMENTS.md`](./REQUIREMENTS.md). The backend uses SAP CAP Node.js with SQLite for local development; the frontend is a SAPUI5 freestyle application using the SAP Horizon theme.

## Run locally

1. Install dependencies with `npm install`.
2. Start the CAP development server with `npm run watch`.
3. Open the CAP index at <http://localhost:4004> and select **Agent Administration**.
4. On the local preview login screen, use the built-in CAP mock user `alice` with a blank password.

The first `npm run watch` creates `db.sqlite` and loads sample configuration from `db/data/`. Subsequent starts preserve changes. Delete the ignored `db.sqlite` file to reset the local demo data. Direct `cds watch` skips this first-time database setup.

## Prototype boundaries

- Agent runs are local simulations; no OpenAI/OpenRouter API is called.
- Provider, MCP, SAP system, and CF service entries are configuration records only. They do not establish remote connections or bindings.
- Provider secrets are never entered in the UI; only an optional secret reference is stored. No secret manager is integrated yet.
- Role assignments are sample records and do not integrate with an identity provider. The OData service requires an authenticated user; local development uses CAP's development authentication.
- SQLite is for local preview only. SAP HANA Cloud remains an undecided production candidate.
- The UI loads SAPUI5 from the official CDN, so browser access to `ui5.sap.com` is required.

Do not deploy this prototype or enter real secrets until authentication, authorization, secret storage/rotation, integration trust, audit, and operational requirements are resolved.
