import type { Group } from '@modules/group';
import type { Loggable, LogMessage } from '@src/core/logger';
import type { Course } from '../do';

export class CourseSynchronizationStoppedLoggable implements Loggable {
	constructor(private readonly courses: Course[], private readonly group: Group) {}

	getLogMessage(): LogMessage {
		return {
			message: 'Synchronization between course and group was stopped, due to the deletion of the group',
			data: {
				courseIds: this.courses.map((course: Course) => course.id).join(', '),
				groupId: this.group.id,
			},
		};
	}
}
