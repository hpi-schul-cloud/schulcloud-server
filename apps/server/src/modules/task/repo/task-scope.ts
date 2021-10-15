import { EntityId, Task } from '@shared/domain';
import { Scope } from '@shared/repo';

export class TaskScope extends Scope<Task> {
	byTeacherId(userId: EntityId): TaskScope {
		this.addQuery({
			$and: [{ teacher: userId }, { course: null }, { lesson: null }],
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
