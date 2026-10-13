sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/Button",
  "sap/m/Column",
  "sap/m/ColumnListItem",
  "sap/m/Dialog",
  "sap/m/FlexBox",
  "sap/m/HBox",
  "sap/m/Input",
  "sap/m/Label",
  "sap/m/MessageStrip",
  "sap/m/MessageToast",
  "sap/m/MultiComboBox",
  "sap/m/ObjectStatus",
  "sap/m/Panel",
  "sap/m/SearchField",
  "sap/m/Select",
  "sap/m/Switch",
  "sap/m/Table",
  "sap/m/Text",
  "sap/m/TextArea",
  "sap/m/Title",
  "sap/m/Toolbar",
  "sap/m/ToolbarSpacer",
  "sap/m/VBox",
  "sap/ui/core/Item"
], function (
  Controller,
  Button,
  Column,
  ColumnListItem,
  Dialog,
  FlexBox,
  HBox,
  Input,
  Label,
  MessageStrip,
  MessageToast,
  MultiComboBox,
  ObjectStatus,
  Panel,
  SearchField,
  Select,
  Switch,
  Table,
  Text,
  TextArea,
  Title,
  Toolbar,
  ToolbarSpacer,
  VBox,
  Item
) {
  "use strict";

  const SERVICE = "/odata/v4/agent-admin";
  const ROLE_OPTIONS = [
    { value: "Administrator", textKey: "administrator" },
    { value: "Tool Creator", textKey: "toolCreator" },
    { value: "Agent Creator", textKey: "agentCreator" },
    { value: "Log Viewer", textKey: "logViewer" }
  ];

  return Controller.extend("com.example.agentadmin.controller.Main", {
    onInit: function () {
      this._page = "overview";
      this._apiCache = {};
      this._navigate("overview");
    },

    _t: function (key, args) {
      return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(key, args);
    },

    _request: async function (path, options) {
      const response = await fetch(`${SERVICE}/${path}`, {
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          ...(this._authHeader ? { Authorization: this._authHeader } : {}),
          ...(options && options.headers)
        },
        ...options
      });
      if (!response.ok) {
        const detail = await response.text();
        const error = new Error(detail || `${response.status} ${response.statusText}`);
        error.status = response.status;
        throw error;
      }
      if (response.status === 204) return null;
      return response.json();
    },

    _list: async function (entity, query) {
      const result = await this._request(`${entity}${query || "?$orderby=createdAt desc"}`);
      return result.value || [];
    },

    _navigate: async function (page) {
      this._page = page;
      const navigationId = (this._navigationId || 0) + 1;
      this._navigationId = navigationId;
      this._syncNavigation();
      const host = this.byId("contentHost");
      host.removeAllContent();
      host.addContent(new VBox({ items: [new Text({ text: this._t("loading") })] }));
      try {
        const data = await this._loadData(page);
        if (navigationId !== this._navigationId) return;
        host.removeAllContent();
        host.addContent(this._renderPage(page, data));
      } catch (error) {
        if (navigationId !== this._navigationId) return;
        host.removeAllContent();
        if (error.status === 401 && ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) {
          host.addContent(this._renderLocalLogin());
          return;
        }
        host.addContent(new VBox({
          items: [
            new Title({ text: this._t("loadFailed"), level: "H3" }),
            new Text({ text: error.message, wrapping: true })
          ]
        }).addStyleClass("contentPage"));
      }
    },

    _renderLocalLogin: function () {
      const user = new Input({ width: "100%", value: this._t("localUserDefault"), placeholder: this._t("localUser") });
      const password = new Input({ width: "100%", type: "Password", placeholder: this._t("localPassword") });
      return new VBox({ items: [
        new Title({ text: this._t("localLoginTitle"), level: "H2" }).addStyleClass("pageTitle"),
        new Text({ text: this._t("localLoginHint"), wrapping: true }).addStyleClass("pageSubtitle"),
        this._field(this._t("localUser"), user),
        this._field(this._t("localPassword"), password),
        new Button({ text: this._t("localLoginAction"), type: "Emphasized", press: () => {
          if (!user.getValue().trim()) {
            MessageToast.show(this._t("required"));
            return;
          }
          this._authHeader = `Basic ${btoa(`${user.getValue().trim()}:${password.getValue()}`)}`;
          this._navigate(this._page);
        } })
      ] }).addStyleClass("contentPage formStack");
    },

    _loadData: async function (page) {
      const keys = page === "overview"
        ? ["agents", "providers", "tools", "systems", "logs", "agentTools"]
        : page === "agents" || page === "playground"
          ? ["agents", "providers", "tools", "agentTools"]
          : page === "providers" ? ["providers"]
            : page === "tools" ? ["tools"]
              : page === "connections" ? ["systems"]
                : page === "access" ? ["assignments"]
                  : page === "logs" ? ["logs"] : [];
      const entities = {
        agents: "Agents", providers: "Providers", tools: "Tools", systems: "ConnectedSystems",
        logs: "ExecutionLogs", assignments: "RoleAssignments", agentTools: "AgentTools"
      };
      const entries = await Promise.all(keys.map(async (key) => [key, await this._list(entities[key])]));
      return Object.fromEntries(entries);
    },

    _renderPage: function (page, data) {
      const renderers = {
        overview: this._renderOverview,
        agents: this._renderAgents,
        playground: this._renderPlayground,
        providers: this._renderProviders,
        tools: this._renderTools,
        connections: this._renderConnections,
        access: this._renderAccess,
        logs: this._renderLogs
      };
      return (renderers[page] || this._renderOverview).call(this, data);
    },

    _syncNavigation: function () {
      this.byId("sideNav").getItems().forEach((item) => {
        if (item.data && item.data("page")) {
          item.toggleStyleClass("navSelected", item.data("page") === this._page);
        }
      });
    },

    onNavigate: function (event) {
      this._navigate(event.getSource().data("page"));
    },

    onToggleNav: function () {
      this.byId("sideNav").toggleStyleClass("navCollapsed");
    },

    _shell: function (title, subtitle, actionText, actionHandler) {
      const headingItems = [new VBox({ items: [
        new Title({ text: title, level: "H1" }).addStyleClass("pageTitle"),
        new Text({ text: subtitle, wrapping: true }).addStyleClass("pageSubtitle")
      ] })];
      if (actionText) {
        headingItems.push(new ToolbarSpacer());
        headingItems.push(new Button({ text: actionText, type: "Emphasized", icon: "sap-icon://add", press: actionHandler }).addStyleClass("headingAction"));
      }
      return new VBox({ items: [
        new HBox({ alignItems: "Start", items: headingItems }).addStyleClass("pageHeading"),
        new MessageStrip({ text: this._t("prototypeNoticeText"), type: "Information", showIcon: true, showCloseButton: false }).addStyleClass("noticeStrip"),
        new VBox({}).addStyleClass("pageBody")
      ] }).addStyleClass("contentPage");
    },

    _replaceBody: function (shell, controls) {
      shell.getItems()[2].destroy();
      shell.insertItem(new VBox({ items: controls }).addStyleClass("pageBody"), 2);
      return shell;
    },

    _metric: function (label, value, note) {
      return new VBox({ items: [
        new Text({ text: label }).addStyleClass("metricLabel"),
        new Text({ text: String(value) }).addStyleClass("metricValue"),
        new Text({ text: note }).addStyleClass("metricFoot")
      ] }).addStyleClass("metricCard");
    },

    _card: function (title, content) {
      return new Panel({ headerText: title, content: Array.isArray(content) ? content : [content] }).addStyleClass("sectionCard");
    },

    _status: function (value) {
      const normalized = String(value || "Unknown").toLowerCase();
      const state = normalized.includes("active") || normalized.includes("ready") || normalized.includes("completed")
        ? "Success" : normalized.includes("draft") || normalized.includes("not tested") || normalized.includes("not connected")
          ? "Information" : normalized.includes("needed") || normalized.includes("failed") ? "Warning" : "None";
      const labels = {
        Active: "statusActive", Draft: "statusDraft", Ready: "ready", "Not tested": "notTested",
        "Not connected": "notConnected", "Configuration needed": "configurationNeeded",
        Completed: "completed", Simulated: "simulated", Enabled: "enabled", Disabled: "disabled"
      };
      return new ObjectStatus({ text: labels[value] ? this._t(labels[value]) : value || "—", state });
    },

    _table: function (headers, rows, className) {
      const table = new Table({
        width: "100%",
        growing: true,
        growingThreshold: 12,
        columns: headers.map((header) => new Column({ header: new Label({ text: header.text }), width: header.width }))
      }).addStyleClass(className || "dataTable");
      rows.forEach((cells) => table.addItem(new ColumnListItem({ cells })));
      if (!rows.length) table.setNoDataText(this._t("noRecords"));
      return table;
    },

    _text: function (value, wrapping) {
      return new Text({ text: value || "—", wrapping: Boolean(wrapping), maxLines: wrapping ? 2 : 1 });
    },

    _notice: function (title, description) {
      return new VBox({ items: [
        new Text({ text: title }).addStyleClass("demoNoticeTitle"),
        new Text({ text: description, wrapping: true }).addStyleClass("demoNoticeText")
      ] }).addStyleClass("demoNotice");
    },

    _renderOverview: function (data) {
      const shell = this._shell(this._t("overviewTitle"), this._t("overviewSubtitle"), this._t("createAgent"), this.onCreateAgent.bind(this));
      const agentRows = data.agents.slice(0, 5).map((agent) => [
        this._text(agent.name), this._text(agent.model), this._status(agent.status),
        new Button({ text: this._t("openPlayground"), type: "Transparent", press: () => this._navigate("playground") })
      ]);
      const logs = data.logs.slice(0, 5).map((log) => [
        this._text(log.agentName), this._status(log.outcome), this._text(log.mode)
      ]);
      return this._replaceBody(shell, [
        new FlexBox({ wrap: "Wrap", items: [
          this._metric(this._t("metricAgents"), data.agents.length, `${data.agents.filter((item) => item.status === "Active").length} ${this._t("metricActive")}`),
          this._metric(this._t("metricProviders"), data.providers.length, this._t("metricConfigured")),
          this._metric(this._t("metricTools"), data.tools.length, this._t("metricConfigured")),
          this._metric(this._t("metricSystems"), data.systems.length, this._t("metricConfigured"))
        ] }).addStyleClass("metricGrid"),
        new FlexBox({ wrap: "Wrap", items: [
          this._card(this._t("recentAgents"), this._table([
            { text: this._t("name") }, { text: this._t("model") }, { text: this._t("status"), width: "8rem" }, { text: "", width: "11rem" }
          ], agentRows, "dataTable")),
          this._card(this._t("recentActivity"), this._table([
            { text: this._t("agent") }, { text: this._t("activityOutcome") }, { text: this._t("activityMode") }
          ], logs, "dataTable"))
        ] }).addStyleClass("sectionGrid"),
        this._notice(this._t("quickStart"), this._t("quickStartText"))
      ]);
    },

    _renderAgents: function (data) {
      const assignmentCounts = data.agentTools.reduce((counts, item) => {
        counts[item.agent_ID] = (counts[item.agent_ID] || 0) + 1;
        return counts;
      }, {});
      const rows = data.agents.map((agent) => [
        new VBox({ items: [this._text(agent.name), this._text(agent.description, true).addStyleClass("agentDescription")] }), this._text(agent.model),
        this._text(this._providerName(agent.provider_ID, data.providers)),
        this._text(String(assignmentCounts[agent.ID] || 0)), this._status(agent.status),
        new HBox({ items: [
          new Button({ icon: "sap-icon://discussion-2", type: "Transparent", tooltip: this._t("openPlayground"), press: () => { this._selectedAgentId = agent.ID; this._navigate("playground"); } }),
          new Button({ icon: "sap-icon://synchronize", type: "Transparent", tooltip: this._t("editStatus"), press: () => this._toggleAgent(agent) })
        ] }).addStyleClass("inlineActions")
      ]);
      const shell = this._shell(this._t("agentsTitle"), this._t("agentsSubtitle"), this._t("createAgent"), this.onCreateAgent.bind(this));
      return this._replaceBody(shell, [this._table([
        { text: this._t("name"), width: "15rem" }, { text: this._t("model"), width: "11rem" },
        { text: this._t("provider"), width: "9rem" }, { text: this._t("assignedTools"), width: "6rem" }, 
        { text: this._t("status"), width: "8rem" }, { text: "", width: "6rem" }
      ], rows)]);
    },

    _renderProviders: function (data) {
      const rows = data.providers.map((provider) => [
        this._text(provider.name), this._text(provider.providerType), this._text(provider.defaultModel),
        this._text(provider.endpoint, true), this._text(provider.credentialRef || this._t("notConfigured")),
        this._status(provider.credentialConfigured ? this._t("secretReady") : this._t("secretNotSet")),
        this._status(provider.enabled ? this._t("enabled") : this._t("disabled"))
      ]);
      const shell = this._shell(this._t("providersTitle"), this._t("providersSubtitle"), this._t("createProvider"), this.onCreateProvider.bind(this));
      return this._replaceBody(shell, [
        this._notice(this._t("secretSafetyTitle"), this._t("secretSafetyText")),
        this._table([
          { text: this._t("name"), width: "9rem" }, { text: this._t("providerKind"), width: "9rem" },
          { text: this._t("defaultModel"), width: "13rem" }, { text: this._t("endpoint") },
          { text: this._t("credentialReference"), width: "10rem" }, { text: this._t("credentialConfigured"), width: "9rem" },
          { text: this._t("status"), width: "7rem" }
        ], rows)
      ]);
    },

    _renderTools: function (data) {
      const rows = data.tools.map((tool) => [
        this._text(tool.name), this._text(tool.description, true), this._text(tool.category),
        this._text(tool.connection, true), this._text(tool.permissionScope, true),
        this._status(tool.status), this._status(tool.requiresApproval ? this._t("approvalRequired") : this._t("approvalOptional"))
      ]);
      const shell = this._shell(this._t("toolsTitle"), this._t("toolsSubtitle"), this._t("createTool"), this.onCreateTool.bind(this));
      return this._replaceBody(shell, [this._table([
        { text: this._t("name"), width: "10rem" }, { text: this._t("description") }, { text: this._t("category"), width: "8rem" },
        { text: this._t("connection"), width: "12rem" }, { text: this._t("scope"), width: "12rem" },
        { text: this._t("status"), width: "9rem" }, { text: this._t("approval"), width: "9rem" }
      ], rows)]);
    },

    _renderConnections: function (data) {
      const rows = data.systems.map((system) => [
        this._text(system.name), this._text(system.systemType), this._text(system.endpoint || this._t("cfBinding"), true),
        this._text(system.bindingName), this._text(system.accessScope, true), this._status(system.status)
      ]);
      const shell = this._shell(this._t("connectionsTitle"), this._t("connectionsSubtitle"), this._t("addConnection"), this.onCreateConnection.bind(this));
      return this._replaceBody(shell, [
        this._notice(this._t("explicitAccessTitle"), this._t("explicitAccessText")),
        this._table([
          { text: this._t("name"), width: "12rem" }, { text: this._t("systemType"), width: "11rem" },
          { text: this._t("endpoint") }, { text: this._t("bindingName"), width: "12rem" },
          { text: this._t("accessScope") }, { text: this._t("status"), width: "9rem" }
        ], rows)
      ]);
    },

    _renderAccess: function (data) {
      const rows = data.assignments.map((assignment) => [
        this._text(assignment.userName), this._status(assignment.role), this._text(assignment.source), this._status(assignment.status)
      ]);
      const roleDescriptions = [
        [this._t("administrator"), this._t("administratorHint")],
        [this._t("toolCreator"), this._t("toolCreatorHint")],
        [this._t("agentCreator"), this._t("agentCreatorHint")],
        [this._t("logViewer"), this._t("logViewerHint")]
      ];
      const roleCards = new FlexBox({ wrap: "Wrap", items: roleDescriptions.map(([role, hint]) =>
        new VBox({ items: [new Text({ text: role }).addStyleClass("demoNoticeTitle"), new Text({ text: hint, wrapping: true }).addStyleClass("demoNoticeText")] }).addStyleClass("metricCard")
      ) }).addStyleClass("metricGrid");
      const shell = this._shell(this._t("accessTitle"), this._t("accessSubtitle"), this._t("addAssignment"), this.onCreateAssignment.bind(this));
      return this._replaceBody(shell, [roleCards, this._table([
        { text: this._t("user"), width: "16rem" }, { text: this._t("role"), width: "14rem" },
        { text: this._t("source"), width: "14rem" }, { text: this._t("status"), width: "9rem" }
      ], rows)]);
    },

    _renderLogs: function (data) {
      const search = new SearchField({ width: "18rem", placeholder: this._t("searchLogs"), liveChange: (event) => {
        const term = event.getParameter("newValue").toLowerCase();
        const filtered = this._logsData.filter((log) => `${log.agentName} ${log.actor} ${log.outcome} ${log.mode}`.toLowerCase().includes(term));
        this._logsTable.destroyItems();
        filtered.forEach((log) => this._logsTable.addItem(this._logRow(log)));
      } });
      this._logsData = data.logs;
      this._logsTable = this._table([
        { text: this._t("activityAgent"), width: "14rem" }, { text: this._t("activityActor"), width: "13rem" },
        { text: this._t("activityOutcome"), width: "9rem" }, { text: this._t("activityDuration"), width: "8rem" },
        { text: this._t("activityMode"), width: "8rem" }, { text: this._t("promptChars"), width: "8rem" },
        { text: this._t("responseSummary") }
      ], data.logs.map((log) => this._logCells(log)));
      const toolbar = new Toolbar({ content: [search, new ToolbarSpacer(), new Button({ text: this._t("refresh"), icon: "sap-icon://refresh", type: "Transparent", press: () => this._navigate("logs") })] }).addStyleClass("tableActions");
      const shell = this._shell(this._t("logsTitle"), this._t("logsSubtitle"));
      return this._replaceBody(shell, [toolbar, this._logsTable]);
    },

    _logCells: function (log) {
      return [this._text(log.agentName), this._text(log.actor), this._status(log.outcome), this._text(log.durationMs == null ? "—" : `${log.durationMs} ms`), this._text(log.mode), this._text(log.promptCharCount == null ? "—" : String(log.promptCharCount)), this._text(log.responsePreview, true)];
    },

    _logRow: function (log) {
      return new ColumnListItem({ cells: this._logCells(log) });
    },

    _renderPlayground: function (data) {
      const agentSelect = new Select({ width: "100%", selectedKey: this._selectedAgentId || (data.agents[0] && data.agents[0].ID), items: data.agents.map((agent) => new Item({ key: agent.ID, text: `${agent.name} (${agent.status})` })) });
      const prompt = new TextArea({ width: "100%", rows: 6, growing: true, growingMaxLines: 12, placeholder: this._t("enterPrompt") });
      const response = new Text({ text: this._t("playgroundAwaiting"), wrapping: true }).addStyleClass("responseBox");
      const runButton = new Button({ text: this._t("runSimulation"), type: "Emphasized", icon: "sap-icon://media-play", enabled: data.agents.length > 0, press: async () => {
        const text = prompt.getValue().trim();
        if (!text) {
          MessageToast.show(this._t("promptTooShort"));
          return;
        }
        runButton.setEnabled(false);
        try {
          const agent = data.agents.find((item) => item.ID === agentSelect.getSelectedKey());
          const simulatedResponse = this._t("playgroundResponse", [agent ? agent.name : this._t("agent")]);
          const duration = Math.floor(180 + Math.random() * 370);
          await this._request("ExecutionLogs", { method: "POST", body: JSON.stringify({
            agentName: agent ? agent.name : this._t("agent"),
            actor: "Local prototype",
            outcome: "Simulated",
            durationMs: duration,
            promptCharCount: text.length,
            responsePreview: this._t("simulationLogPreview"),
            mode: "Local simulation"
          }) });
          response.setText(simulatedResponse);
          MessageToast.show(this._t("runRecorded"));
        } catch (error) {
          MessageToast.show(`${this._t("saveFailed")} ${error.message}`);
        } finally {
          runButton.setEnabled(true);
        }
      } });
      const shell = this._shell(this._t("playgroundTitle"), this._t("playgroundSubtitle"));
      const left = this._card(this._t("simulationInput"), new VBox({ items: [
        this._field(this._t("agent"), agentSelect),
        this._field(this._t("prompt"), prompt),
        new Text({ text: this._t("promptPrivacy"), wrapping: true }).addStyleClass("formNote"),
        runButton
      ] }).addStyleClass("formStack"));
      const right = this._card(this._t("simulationResult"), new VBox({ items: [
        this._notice(this._t("simulationOnlyTitle"), this._t("playgroundDisclosure")),
        response
      ] }).addStyleClass("formStack"));
      return this._replaceBody(shell, [new FlexBox({ wrap: "Wrap", items: [left, right] }).addStyleClass("sectionGrid")]);
    },

    _providerName: function (id, providers) {
      const provider = providers.find((item) => item.ID === id);
      return provider ? provider.name : this._t("notConfigured");
    },

    _field: function (labelText, control) {
      return new VBox({ items: [new Label({ text: labelText }).addStyleClass("formFieldLabel"), control] });
    },

    _input: function (placeholder, value) {
      return new Input({ width: "100%", placeholder: placeholder || "", value: value || "" });
    },

    _area: function (placeholder, rows) {
      return new TextArea({ width: "100%", rows: rows || 3, growing: true, placeholder: placeholder || "" });
    },

    _showDialog: function (title, fields, onSave) {
      const dialog = new Dialog({
        title,
        contentWidth: "34rem",
        resizable: true,
        draggable: true,
        content: [new VBox({ items: fields }).addStyleClass("formStack")],
        beginButton: new Button({ text: this._t("save"), type: "Emphasized", press: async () => {
          try {
            await onSave();
            dialog.close();
            MessageToast.show(this._t("created"));
            this._navigate(this._page);
          } catch (error) {
            MessageToast.show(`${this._t("saveFailed")} ${error.message}`);
          }
        } }),
        endButton: new Button({ text: this._t("cancel"), press: () => dialog.close() }),
        afterClose: () => dialog.destroy()
      });
      dialog.open();
    },

    _createAgentDialog: function () {
      const name = this._input(this._t("agentName"));
      const description = this._area(this._t("agentDescription"), 2);
      const provider = new Select({ width: "100%", selectedKey: this._providers[0] && this._providers[0].ID, items: this._providers.map((item) => new Item({ key: item.ID, text: item.name })) });
      const model = this._input(this._t("agentModel"), (this._providers[0] && this._providers[0].defaultModel) || "");
      const tools = new MultiComboBox({ width: "100%", items: this._tools.map((item) => new Item({ key: item.ID, text: `${item.name} · ${item.category}` })) });
      const systemPrompt = this._area(this._t("systemPrompt"), 4);
      this._showDialog(this._t("newAgent"), [
        this._field(this._t("agentName"), name), this._field(this._t("agentDescription"), description),
        this._field(this._t("provider"), provider), this._field(this._t("model"), model),
        this._field(this._t("tools"), tools), this._field(this._t("systemPrompt"), systemPrompt),
        new Text({ text: this._t("assignmentHint"), wrapping: true }).addStyleClass("formNote")
      ], async () => {
        if (!name.getValue().trim() || !provider.getSelectedKey()) throw new Error(this._t("required"));
        const created = await this._request("Agents", { method: "POST", body: JSON.stringify({
          name: name.getValue().trim(), description: description.getValue().trim(),
          provider_ID: provider.getSelectedKey(), model: model.getValue().trim(),
          systemPrompt: systemPrompt.getValue().trim(), status: "Draft"
        }) });
        for (const toolId of tools.getSelectedKeys()) {
          const tool = this._tools.find((item) => item.ID === toolId);
          await this._request("AgentTools", { method: "POST", body: JSON.stringify({
            agent_ID: created.ID, tool_ID: toolId, scope: (tool && tool.permissionScope) || "Explicitly approved operations only", enabled: true
          }) });
        }
      });
    },

    onCreateAgent: async function () {
      try {
        this._providers = await this._list("Providers");
        this._tools = await this._list("Tools");
        this._createAgentDialog();
      } catch (error) { MessageToast.show(`${this._t("loadFailed")} ${error.message}`); }
    },

    _toggleAgent: async function (agent) {
      const status = agent.status === "Active" ? "Draft" : "Active";
      try {
        await this._request(`Agents(${agent.ID})`, { method: "PATCH", body: JSON.stringify({ status }) });
        MessageToast.show(this._t("saved"));
        this._navigate("agents");
      } catch (error) { MessageToast.show(`${this._t("saveFailed")} ${error.message}`); }
    },

    onCreateProvider: function () {
      const name = this._input(this._t("name"));
      const kind = new Select({ width: "100%", selectedKey: "OpenAI", items: ["OpenAI", "OpenRouter", "Custom"].map((value) => new Item({ key: value, text: value })) });
      const endpoint = this._input(this._t("endpointHint"));
      const model = this._input(this._t("defaultModel"));
      const credentialRef = this._input(this._t("credentialReference"));
      const credentialConfigured = new Switch({ state: false, customTextOn: this._t("yes"), customTextOff: this._t("no") });
      this._showDialog(this._t("newProvider"), [
        this._field(this._t("name"), name), this._field(this._t("providerKind"), kind),
        this._field(this._t("endpoint"), endpoint), this._field(this._t("defaultModel"), model),
        this._field(this._t("credentialReference"), credentialRef),
        this._field(this._t("credentialConfigured"), credentialConfigured),
        new Text({ text: this._t("credentialHint"), wrapping: true }).addStyleClass("formNote")
      ], async () => {
        if (!name.getValue().trim() || !kind.getSelectedKey()) throw new Error(this._t("required"));
        await this._request("Providers", { method: "POST", body: JSON.stringify({
          name: name.getValue().trim(), providerType: kind.getSelectedKey(), endpoint: endpoint.getValue().trim(),
          defaultModel: model.getValue().trim(), credentialRef: credentialRef.getValue().trim(),
          credentialConfigured: credentialConfigured.getState(), status: this._t("notTested"), enabled: true
        }) });
      });
    },

    onCreateTool: function () {
      const name = this._input(this._t("toolName"));
      const description = this._area(this._t("toolDescription"), 2);
      const category = new Select({ width: "100%", selectedKey: "MCP", items: ["MCP", "SAP OData", "CF Service", "HTTP API"].map((value) => new Item({ key: value, text: value })) });
      const connection = this._input(this._t("toolConnection"));
      const scope = this._area(this._t("scopeHint"), 3);
      const approval = new Switch({ state: true });
      this._showDialog(this._t("newTool"), [
        this._field(this._t("name"), name), this._field(this._t("description"), description),
        this._field(this._t("category"), category), this._field(this._t("connection"), connection),
        this._field(this._t("scope"), scope), this._field(this._t("requiresApproval"), approval)
      ], async () => {
        if (!name.getValue().trim() || !scope.getValue().trim()) throw new Error(this._t("required"));
        await this._request("Tools", { method: "POST", body: JSON.stringify({
          name: name.getValue().trim(), description: description.getValue().trim(), category: category.getSelectedKey(),
          connection: connection.getValue().trim(), permissionScope: scope.getValue().trim(),
          status: "Configuration needed", requiresApproval: approval.getState()
        }) });
      });
    },

    onCreateConnection: function () {
      const name = this._input(this._t("connectionName"));
      const type = new Select({ width: "100%", selectedKey: "SAP S/4HANA", items: ["SAP S/4HANA", "SAP BTP Service", "SAP SuccessFactors", "Other SAP system"].map((value) => new Item({ key: value, text: value })) });
      const endpoint = this._input(this._t("endpoint"));
      const bindingName = this._input(this._t("bindingName"));
      const scope = this._area(this._t("accessScope"), 3);
      this._showDialog(this._t("newConnection"), [
        this._field(this._t("name"), name), this._field(this._t("systemType"), type),
        this._field(this._t("endpoint"), endpoint), this._field(this._t("bindingName"), bindingName),
        this._field(this._t("accessScope"), scope),
        new Text({ text: this._t("connectionHint"), wrapping: true }).addStyleClass("formNote")
      ], async () => {
        if (!name.getValue().trim() || !scope.getValue().trim()) throw new Error(this._t("required"));
        await this._request("ConnectedSystems", { method: "POST", body: JSON.stringify({
          name: name.getValue().trim(), systemType: type.getSelectedKey(), endpoint: endpoint.getValue().trim(),
          bindingName: bindingName.getValue().trim(), accessScope: scope.getValue().trim(), status: "Not connected"
        }) });
      });
    },

    onCreateAssignment: function () {
      const user = this._input(this._t("roleUser"));
      const role = new Select({ width: "100%", selectedKey: ROLE_OPTIONS[0].value, items: ROLE_OPTIONS.map((item) => new Item({ key: item.value, text: this._t(item.textKey) })) });
      const source = this._input(this._t("roleSource"), "Local prototype");
      this._showDialog(this._t("newAssignment"), [
        this._field(this._t("user"), user), this._field(this._t("role"), role), this._field(this._t("source"), source),
        new Text({ text: this._t("roleHint"), wrapping: true }).addStyleClass("formNote")
      ], async () => {
        if (!user.getValue().trim()) throw new Error(this._t("required"));
        await this._request("RoleAssignments", { method: "POST", body: JSON.stringify({
          userName: user.getValue().trim(), role: role.getSelectedKey(), source: source.getValue().trim(), status: "Active"
        }) });
      });
    }
  });
});
