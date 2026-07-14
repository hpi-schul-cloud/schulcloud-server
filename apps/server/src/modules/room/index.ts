/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { Room, RoomColor, RoomFeatures, RoomService } from './domain';
export { RoomArrangementEntity, RoomEntity } from './repo/entity';
export { ROOM_PUBLIC_API_CONFIG_TOKEN, RoomPublicApiConfig } from './room.config';
export { RoomModule } from './room.module';
