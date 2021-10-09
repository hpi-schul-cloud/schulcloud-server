import { EntityId, Task } from '@shared/domain';
import { Scope } from '@shared/repo';

export class TaskScope extends Scope<Task> {
	byTeacherId(userId: EntityId): TaskScope {
		this.addQuery({
			$and: [{ teacher: userId }, { parent: null }, { lesson: null }],
		});
		return this;
	}

	byCourseIds(courseIds: EntityId[]): TaskScope {
		this.addQuery({
			$and: [{ parent: { $in: courseIds } }, { lesson: null }],
		});
		return this;
	}

	byLessonIds(lessonIds: EntityId[]): TaskScope {
		this.addQuery({ lesson: { $in: lessonIds } });
		return this;
	}

	byParentIds(teacherId?: EntityId, courseIds?: EntityId[], lessonIds?: EntityId[]): TaskScope {
		const parentIdScope = new TaskScope('$or');

		if (teacherId) {
			parentIdScope.byTeacherId(teacherId);
		}

		if (courseIds) {
			parentIdScope.byCourseIds(courseIds);
		}

		if (lessonIds) {
			parentIdScope.byLessonIds(lessonIds);
		}

		this.addQuery(parentIdScope.query);
		return this;
	}

	byDraft(isDraft: boolean): TaskScope {
		this.addQuery({ private: { $eq: isDraft } });
		return this;
	}

	afterDueDateOrNone(dueDate: Date): TaskScope {
		this.addQuery({ $or: [{ dueDate: { $gte: dueDate } }, { dueDate: null }] });
		return this;
	}
}
