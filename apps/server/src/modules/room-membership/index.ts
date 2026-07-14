/** **********************************************************
 * This is a module facade!                                  *
 * Please export only what is allowed to be used externally. *
 * Please do not use wildcard exports.                       *
 *********************************************************** */

export * from './do/room-membership.do';
export { RoomMembershipEntity } from './repo/entity';
export * from './room-membership.module';
export { RoomMembershipService } from './service/room-membership.service';

export { RoomAuthorizable, UserWithRoomRoles } from './do/room-authorizable.do';
