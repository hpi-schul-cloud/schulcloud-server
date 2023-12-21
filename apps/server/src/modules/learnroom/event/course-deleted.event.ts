import { EntityId } from '@shared/domain/types';

export class CourseDeletedEvent {
	constructor(public readonly courseId: EntityId) {}
}
