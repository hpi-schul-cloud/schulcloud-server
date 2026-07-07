import type { Group } from '@modules/group';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import type { Course } from '../course.do';

export class CourseSynchronizationStoppedLoggable implements Loggable {
	constructor(
		private readonly courses: Course[],
		private readonly group: Group
	) {}

	getLogMessage(): LoggableMessage {
		return {
			message: 'Synchronization between course and group was stopped, due to the deletion of the group',
			data: {
				courseIds: this.courses.map((course: Course) => course.id).join(', '),
				groupId: this.group.id,
			},
		};
	}
}
