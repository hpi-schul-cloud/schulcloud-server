/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { GroupModule } from './group.module';
export { GroupConfig } from './group.config';
export { Group, GroupDeletedEvent, GroupFilter, GroupPeriod, GroupTypes, GroupUser } from './domain';
export { GroupService } from './service';
