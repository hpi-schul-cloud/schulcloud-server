import { EntityId, Task } from '@shared/domain';
import { Scope } from '../scope';

export class TaskScope extends Scope<Task> {
	byFinished(userId: EntityId, value: boolean): TaskScope {
		if (value === true) {
			this.addQuery({ finished: userId });
		} else if (value === false) {
			this.addQuery({ finished: { $ne: userId } });
		}

		return this;
	}

	byOnlyCreatorId(teacherId: EntityId): TaskScope {
		this.addQuery({
			$and: [{ creator: teacherId }, { course: null }, { lesson: null }],
		});

		return this;
	}

	byCreatorId(creatorId: EntityId): TaskScope {
		this.addQuery({ creator: creatorId });

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

	noFutureAvailableDate(): TaskScope {
		const query = { availableDate: { $lte: new Date(Date.now()) } };
		this.addQuery(query);

		return this;
	}
}
