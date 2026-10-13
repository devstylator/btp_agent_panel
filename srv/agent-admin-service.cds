using { btp.agentadmin as db } from '../db/schema';

@path: 'agent-admin'
@requires: 'authenticated-user'
service AgentAdminService {
  entity Providers        as projection on db.Providers;
  entity Agents           as projection on db.Agents;
  entity Tools            as projection on db.Tools;
  entity AgentTools       as projection on db.AgentTools;
  entity ConnectedSystems as projection on db.ConnectedSystems;
  entity RoleAssignments  as projection on db.RoleAssignments;
  entity ExecutionLogs    as projection on db.ExecutionLogs;
}
