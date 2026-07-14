/** **********************************************************
 * This is a module facade!                                  *
 * Please export only what is allowed to be used externally. *
 * Please do not use wildcard exports.                       *
 *********************************************************** */

export { TeamService } from './domain';
export { TeamModule } from './team.module';
export { TEAM_PUBLIC_API_CONFIG_TOKEN, TeamPublicApiConfig } from './team.config';
