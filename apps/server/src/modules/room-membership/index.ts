/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { RoomAuthorizable, UserWithRoomRoles } from './do/room-authorizable.do';
export { RoomMembershipEntity } from './repo/entity';
export { RoomMembershipModule } from './room-membership.module';
export { RoomMembershipService } from './service/room-membership.service';
