namespace btp.agentadmin;

using { cuid, managed } from '@sap/cds/common';

entity Providers : cuid, managed {
  name                 : String(100) not null;
  providerType         : String(40) not null;
  endpoint             : String(500);
  defaultModel         : String(120);
  credentialRef        : String(120);
  credentialConfigured : Boolean default false;
  status               : String(30) default 'Not tested';
  enabled              : Boolean default true;
}

entity Agents : cuid, managed {
  name         : String(100) not null;
  description  : String(500);
  systemPrompt : LargeString;
  provider     : Association to Providers;
  model        : String(120);
  status       : String(30) default 'Draft';
}

entity Tools : cuid, managed {
  name             : String(100) not null;
  description      : String(500);
  category         : String(40) not null;
  connection       : String(500);
  permissionScope  : String(500);
  status           : String(30) default 'Draft';
  requiresApproval : Boolean default true;
}

entity AgentTools : cuid, managed {
  agent : Association to Agents not null;
  tool  : Association to Tools not null;
  scope : String(500) not null;
  enabled : Boolean default true;
}

entity ConnectedSystems : cuid, managed {
  name        : String(100) not null;
  systemType  : String(60) not null;
  endpoint    : String(500);
  bindingName : String(120);
  accessScope : String(500);
  status      : String(30) default 'Not connected';
}

entity RoleAssignments : cuid, managed {
  userName : String(160) not null;
  role     : String(60) not null;
  source   : String(60) default 'Local prototype';
  status   : String(30) default 'Active';
}

entity ExecutionLogs : cuid, managed {
  agentName       : String(100) not null;
  actor           : String(160);
  outcome         : String(40) not null;
  durationMs      : Integer;
  promptCharCount : Integer;
  responsePreview : String(500);
  mode            : String(40) default 'Simulation';
}
