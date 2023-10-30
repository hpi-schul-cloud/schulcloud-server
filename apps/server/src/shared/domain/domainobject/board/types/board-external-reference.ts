import { EntityId } from '@shared/domain/types/entity-id';

export enum BoardExternalReferenceType {
	'Course' = 'course',
}

export interface BoardExternalReference {
	type: BoardExternalReferenceType;
	id: EntityId;
}
