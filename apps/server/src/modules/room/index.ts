/** **********************************************************
 * This is a module facade!                                  *
 * Please export only what is allowed to be used externally. *
 * Please do not use wildcard exports.                       *
 *********************************************************** */

export { Room, RoomColor, RoomFeatures, RoomService } from './domain';
export { RoomArrangementEntity, RoomEntity } from './repo/entity';
export { ROOM_PUBLIC_API_CONFIG_TOKEN, RoomPublicApiConfig } from './room.config';
export { RoomModule } from './room.module';
