import { EntityId, Task } from '@shared/domain';
import { Scope } from '@shared/repo';

export class TaskScope extends Scope<Task> {
	byParentIds(parentIds: EntityId[]): TaskScope {
		this.addQuery({ parent: { $in: parentIds } });
		return this;
	}

	byPublic(): TaskScope {
		this.addQuery({ private: { $ne: true } });
		return this;
	}

	byLessonsOrNone(lessonIds: EntityId[]): TaskScope {
		this.addQuery({ $or: [{ lesson: { $in: lessonIds } }, { lesson: null }] });
		return this;
	}

	afterDueDateOrNone(dueDate: Date): TaskScope {
		this.addQuery({ $or: [{ dueDate: { $gte: dueDate } }, { dueDate: null }] });
		return this;
	}
}
