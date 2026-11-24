import { type EntityId } from '@shared/domain/types';

export interface RoomArrangementItem {
	id: EntityId;
}

export interface RoomGroupProps {
	id: EntityId;
	name: string;
	collapsed: boolean;
	roomIds: EntityId[];
}

/**
 * A room the user is a member of and that still exists.
 * Hidden rooms (e.g. archived while the archive feature is enabled) keep their place in the arrangement.
 */
export interface RoomArrangementRoomInfo {
	id: EntityId;
	createdAt: Date;
	isVisible: boolean;
}

export interface RoomGroupUpdate {
	name?: string;
	collapsed?: boolean;
}

export interface RoomPositionCommand {
	roomId: EntityId;
	sourceGroupId: EntityId | null;
	targetGroupId: EntityId | null;
	beforeRoomId: EntityId | null;
}

export enum RoomArrangementConflictReason {
	REVISION = 'REVISION',
	STATE = 'STATE',
	LEGACY_MOVE_WITH_GROUPS = 'LEGACY_MOVE_WITH_GROUPS',
}

export enum RoomGroupNameInvalidReason {
	REQUIRED = 'REQUIRED',
	TOO_LONG = 'TOO_LONG',
	INVALID_CHARACTERS = 'INVALID_CHARACTERS',
}
