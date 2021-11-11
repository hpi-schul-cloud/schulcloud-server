import { EntityId, Task } from '@shared/domain';
import { Scope } from '../scope';

export class TaskScope extends Scope<Task> {
	byExcludeClosed(userId?: EntityId): TaskScope {
		this.addQuery({ closed: { $ne: userId } });

		return this;
	}

	byClosed(userId?: EntityId): TaskScope {
		this.addQuery({ closed: userId });

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
