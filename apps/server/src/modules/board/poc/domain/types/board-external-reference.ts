import type { EntityId } from '@shared/domain/types';

export enum BoardExternalReferenceType {
	'Course' = 'course',
	'User' = 'user',
	// TODO
	// 'ExternalTool' = 'external-tool',
}

export interface BoardExternalReference {
	type: BoardExternalReferenceType;
	id: EntityId;
}
