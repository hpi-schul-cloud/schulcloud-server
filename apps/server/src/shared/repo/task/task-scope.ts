import { EntityId, Task } from '@shared/domain';
import { Scope } from '../scope';

export class TaskScope extends Scope<Task> {
	// TODO: parameter > isClosed: boolean
	byClosed(userId?: EntityId): TaskScope {
		// TODO: is not up to date anymore we must merge it with course.untilDate information
		// but this information is only hold in the entity
		this.addQuery({ closed: { $ne: userId } });

		return this;
	}

	byTeacherId(teacherId: EntityId): TaskScope {
		this.addQuery({
			$and: [{ teacher: teacherId }, { course: null }, { lesson: null }],
		});

		return this;
	}

	byCourseIds(courseIds: EntityId[]): TaskScope {
		this.addQuery({
			$and: [{ course: { $in: courseIds } }, { lesson: null }],
		});

		return this;
	}

	byLessonIds(lessonIds: EntityId[]): TaskScope {
		this.addQuery({ lesson: { $in: lessonIds } });

		return this;
	}

	byDraft(isDraft: boolean): TaskScope {
		// FIXME - WE DON'T WANT THIS!!! NON-OPTIONAL BOOLEAN PROPERTIES HAVE TO BE DEFINED.
		// additionally handle undefined and null as false
		const query = isDraft ? { private: { $eq: true } } : { private: { $ne: true } };
		this.addQuery(query);

		return this;
	}

	afterDueDateOrNone(dueDate: Date): TaskScope {
		this.addQuery({ $or: [{ dueDate: { $gte: dueDate } }, { dueDate: null }] });

		return this;
	}
}
