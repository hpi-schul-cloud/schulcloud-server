/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { TeamService } from './domain';
export { TeamModule } from './team.module';
export { TEAM_PUBLIC_API_CONFIG_TOKEN, TeamPublicApiConfig } from './team.config';
