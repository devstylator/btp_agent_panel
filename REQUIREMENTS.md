# Requirements: SAP BTP Custom Agent Administration Panel

**Status:** Initial draft
**Language:** English (default application language)
**Purpose:** Working source of truth for product requirements, unresolved decisions, and implementation guidance. Update this document as decisions are made; do not treat items marked **Open** as settled design choices.

## 1. Product overview

The product is a web-based administration panel and service application for creating, configuring, and operating custom AI agents for SAP BTP and connected SAP systems. It is intended to run on Cloud Foundry and use SAP CAP to provide its application services. The frontend should be consistent with SAPUI5.

The application will manage agent definitions, AI provider connections, tools and their permissions, MCP-based tool integrations, and connections to SAP systems and BTP services. Its configuration data will be stored in an application-owned database. English is the initial and default user-interface language, with support for translations.

## 2. Goals

- Provide a central administration experience for custom agents associated with SAP BTP and connected services.
- Allow authorized users to create and configure agents and the tools they can use.
- Connect to multiple AI service providers, initially OpenAI and OpenRouter.
- Manage connections to selected SAP systems and BTP services.
- Run on Cloud Foundry and use services made available to the application in its CF environment.
- Provide role-based access for administrative and operational responsibilities.
- Deliver an SAPUI5-consistent frontend and an English-first, translation-ready user experience.

## 3. Users and roles

The application must support role-based access control. The following roles are requested as initial role concepts; exact permissions and assignment mechanisms remain open:

| Role | Initial responsibility | Status |
|---|---|---|
| Administrator | Manage application-wide configuration and access | Requested; permissions open |
| Tool Creator | Create and configure agent tools, including MCP integrations | Requested; permissions open |
| Agent Creator | Create and configure agents | Requested; permissions open |
| Log Viewer | View operational or audit logs | Requested; log scope and permissions open |

The role model must be extensible enough to refine permissions and add roles as the product evolves. Whether roles are application-defined, mapped from an identity provider, or both is **Open**.

## 4. Functional requirements

### 4.1 Agent management

- **FR-AG-001:** Authorized users must be able to create and configure custom agents in the application.
- **FR-AG-002:** Agents must be configurable to use selected AI provider connections and permitted tools.
- **FR-AG-003:** The application must support operating agents from within the application. The execution model and whether agents can also be exposed through external interfaces are **Open**.
- **FR-AG-004:** Agent lifecycle, versioning, publishing, and runtime controls are **Open** and must be specified before implementation of those capabilities.

### 4.2 AI provider connections

- **FR-AI-001:** The application must support configuring connections to AI service providers.
- **FR-AI-002:** The initial providers are OpenAI and OpenRouter.
- **FR-AI-003:** Provider configuration must be designed so additional providers can be added without redesigning agent management. The provider abstraction and supported configuration fields are **Open**.
- **FR-AI-004:** Provider credentials and other secrets must not be exposed in the UI, logs, or source control. The storage and rotation mechanism is **Open** and must be decided for the target CF environment.
- **FR-AI-005:** Model selection, provider-specific options, connectivity checks, quotas, and error handling are **Open**.

### 4.3 Tools and permissions

- **FR-TL-001:** Authorized users must be able to configure which tools are available to agents.
- **FR-TL-002:** The application must allow defining the scope of an agent's access to each assigned tool.
- **FR-TL-003:** Tool access must be evaluated at execution time, not only presented as configuration. The policy format and enforcement details are **Open**.
- **FR-TL-004:** Tool configuration and permissions must be manageable separately from agent definitions so tools can be reused where allowed. Sharing and ownership rules are **Open**.

### 4.4 MCP tool management

- **FR-MCP-001:** Authorized users must be able to create and configure new agent tools using MCP (Model Context Protocol).
- **FR-MCP-002:** MCP tool configuration must support defining the tool's connection and the access available to agents, subject to a security design still to be agreed.
- **FR-MCP-003:** Supported MCP transports, authentication methods, server lifecycle, trust/approval rules, and failure handling are **Open**.

### 4.5 SAP systems and BTP services

- **FR-SAP-001:** The application must provide a way to manage connections to selected SAP systems and BTP services.
- **FR-SAP-002:** The application must be able to access explicitly selected services available in the Cloud Foundry environment.
- **FR-SAP-003:** The method for discovering, granting, and validating access to CF services is **Open**. Access must be restricted to services explicitly authorized for the application.
- **FR-SAP-004:** Supported SAP system types, connection protocols, service cataloguing, and per-agent access rules are **Open**.

### 4.6 Roles and authorization

- **FR-AUTH-001:** The application must provide role-based access control, initially covering the role concepts listed in Section 3.
- **FR-AUTH-002:** Authorization must be enforced by application services as well as reflected in the frontend; hiding UI actions alone is insufficient.
- **FR-AUTH-003:** Identity provider integration, user provisioning, role assignment, and finer-grained permissions are **Open**.

### 4.7 Administration and logs

- **FR-OPS-001:** The application must provide log access for users granted the relevant role.
- **FR-OPS-002:** The exact log types (application, agent execution, security/audit), retention, filtering, export, and sensitive-data redaction rules are **Open**.
- **FR-OPS-003:** Administrative capabilities beyond the initial role concepts are **Open**.

### 4.8 User interface and localization

- **FR-UI-001:** The frontend must be consistent with SAPUI5 in visual language and interaction patterns.
- **FR-UI-002:** English must be the default application language and initial language available to users.
- **FR-UI-003:** The application must support translations so additional languages can be added without redesigning the UI.
- **FR-UI-004:** Supported additional languages, language selection behavior, and translation ownership are **Open**.

## 5. Data and persistence

- **FR-DATA-001:** The application must persist its configuration data in a database owned/managed for this application.
- **FR-DATA-002:** SAP HANA Cloud is the current candidate database, not a confirmed decision.
- **FR-DATA-003:** Data ownership, tenant boundaries, backup/restore, retention, and schema evolution requirements are **Open**.

## 6. Platform and architecture constraints

- **ARCH-001:** The backend must use SAP Cloud Application Programming Model (CAP) to provide application services.
- **ARCH-002:** The target deployment platform is Cloud Foundry.
- **ARCH-003:** The application must integrate with explicitly selected services available in its CF environment; the binding and authorization model is **Open**.
- **ARCH-004:** SAPUI5 consistency is required for the frontend; the specific UI implementation approach and framework integration are **Open**.
- **ARCH-005:** The design should keep provider, tool, and connected-system integrations extensible. Detailed extension contracts are **Open**.

## 7. Quality and security requirements

These requirements are baseline expectations derived from the requested product scope. Concrete targets and controls remain to be agreed.

- **NFR-SEC-001:** Enforce authorization on backend operations that read or change configuration and execute tools.
- **NFR-SEC-002:** Protect credentials, tokens, and other secrets from disclosure in application responses, logs, and source control.
- **NFR-SEC-003:** Restrict agent and tool capabilities to explicitly configured permissions; avoid granting implicit access to connected systems or services.
- **NFR-SEC-004:** Treat external provider, MCP server, SAP system, and BTP service responses as untrusted input.
- **NFR-SEC-005:** Define auditability for security-relevant configuration and execution actions. The required event set and retention period are **Open**.
- **NFR-REL-001:** Define and handle timeouts, unavailable providers/tools, and recoverable integration failures. Exact behavior and service-level targets are **Open**.
- **NFR-OPS-001:** The application must be deployable and operable in the target Cloud Foundry environment. Required environments, monitoring, scaling, and release process are **Open**.
- **NFR-I18N-001:** User-visible text must be externalized so translations can be maintained independently of application logic.

## 8. Explicitly unresolved decisions

Track answers here and update the relevant requirements when resolved.

| ID | Decision/question | Current status |
|---|---|---|
| Q-001 | What does it mean for agents to “operate directly from the application”: interactive chat, background execution, APIs, or a combination? | Open |
| Q-002 | Which database should be used: SAP HANA Cloud or another option? | Open; HANA Cloud is a candidate |
| Q-003 | Which identity provider and authentication flow should be used in Cloud Foundry? | Open |
| Q-004 | How are application roles assigned and mapped to identity-provider roles/groups? | Open |
| Q-005 | How will CF services be discovered, authorized, and bound to the application? | Open |
| Q-006 | Where will provider, system, and MCP credentials be stored, and how will they be rotated? | Open |
| Q-007 | What MCP transports, authentication methods, and server trust model are required? | Open |
| Q-008 | What agent/tool permission model is required (for example, per agent, user, operation, or resource)? | Open |
| Q-009 | Which SAP systems and BTP services are in the initial supported scope, and how will each be connected? | Open |
| Q-010 | What are the initial log categories, audit requirements, retention, and redaction rules? | Open |
| Q-011 | Is this a single-tenant or multi-tenant application, and what data-isolation requirements apply? | Open |
| Q-012 | Which languages beyond English are planned, and who maintains translations? | Open |
| Q-013 | What are the initial deployment environments and operational targets (availability, performance, scaling, monitoring)? | Open |

## 9. Scope boundaries

### In scope (initial product direction)

- CAP-based application services.
- Agent configuration and operation within the application.
- OpenAI and OpenRouter provider connections.
- Tool configuration and scoped access controls.
- MCP-based tool creation/configuration.
- Management of selected SAP systems and BTP service connections.
- Role-based administration and log viewing.
- Cloud Foundry deployment target, SAPUI5-consistent frontend, application-owned configuration persistence, and English-first localization.

### Not yet specified

No features are explicitly excluded yet. Items such as end-user chat experience, external agent APIs, automatic service discovery, agent marketplace, billing/quotas, and multi-tenancy must not be assumed either in or out of scope until clarified.

## 10. Working rules for future implementation

- Treat this document as the product requirements source of truth; keep requirements and open questions current as decisions are made.
- Do not silently turn an **Open** item into a design decision. Ask for clarification when the choice materially affects architecture, security, or user-visible behavior.
- Keep implementation traceable to requirement IDs where practical. Add or refine IDs when new requirements are agreed.
- Prefer least privilege for tools, connected systems, and CF services; document permission assumptions explicitly.
- Keep the user-facing experience English by default and translation-ready from the start.
