import { RoomGroupNameInvalidError } from '../error/room-group-name-invalid.error';
import { RoomGroupNameInvalidReason } from '../type/room-arrangement';

export const ROOM_GROUP_NAME_MAX_LENGTH = 100;

const INVALID_CHARACTERS = /[\p{Cc}\p{Zl}\p{Zp}]/u;

export const normalizeRoomGroupName = (rawName: string): string => {
	const normalized = rawName.normalize('NFC').trim();

	if (normalized.length === 0) {
		throw new RoomGroupNameInvalidError(RoomGroupNameInvalidReason.REQUIRED);
	}

	if (INVALID_CHARACTERS.test(normalized)) {
		throw new RoomGroupNameInvalidError(RoomGroupNameInvalidReason.INVALID_CHARACTERS);
	}

	if ([...normalized].length > ROOM_GROUP_NAME_MAX_LENGTH) {
		throw new RoomGroupNameInvalidError(RoomGroupNameInvalidReason.TOO_LONG);
	}

	return normalized;
};

export const isSameRoomGroupName = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();
