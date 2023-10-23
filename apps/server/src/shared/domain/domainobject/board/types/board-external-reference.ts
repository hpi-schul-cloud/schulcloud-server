import { EntityId } from '@shared/domain/types';

export enum BoardExternalReferenceType {
	'Course' = 'course',
}

export interface BoardExternalReference {
	type: BoardExternalReferenceType;
	id: EntityId;
}
