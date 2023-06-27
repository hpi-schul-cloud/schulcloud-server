import { EntityId } from '@shared/domain';

export enum BoardContextType {
	'COURSE' = 'course',
}

export interface BoardContextInfo {
	type: BoardContextType;

	id: EntityId;

	name: string;
}
