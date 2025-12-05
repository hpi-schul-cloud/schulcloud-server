import type { Room } from '@modules/room';
import { Permission } from '@shared/domain/interface';

export type RoomWithPermissionsAndLockedStatus = { room: Room; permissions: Permission[]; isLocked: boolean };
