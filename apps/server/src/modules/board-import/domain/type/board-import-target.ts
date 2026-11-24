import { type EntityId } from '@shared/domain/types';

export enum BoardImportTargetType {
	COURSE = 'course',
	ROOM = 'room',
}

export interface BoardImportTarget {
	type: BoardImportTargetType;
	id: EntityId;
}
