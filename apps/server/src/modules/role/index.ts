/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { RoleName, RoomRole } from './domain';
export { RoleModule } from './role.module';
export { RoleDto, RoleService } from './service';
export { Role } from './repo';
