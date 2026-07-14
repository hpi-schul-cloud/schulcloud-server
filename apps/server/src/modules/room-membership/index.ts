/** **********************************************************
 * This is a module facade!                                  *
 * Please export only what is allowed to be used externally. *
 * Please do not use wildcard exports.                       *
 *********************************************************** */

export { RoomAuthorizable, UserWithRoomRoles } from './do/room-authorizable.do';
export { RoomMembershipEntity } from './repo/entity';
export { RoomMembershipModule } from './room-membership.module';
export { RoomMembershipService } from './service/room-membership.service';
