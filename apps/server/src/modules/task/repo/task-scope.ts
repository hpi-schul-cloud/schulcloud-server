import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain';
import { Scope } from '@shared/repo';
import { Task } from '../entity';

export class TaskScope extends Scope<Task> {
	byParents(parentIds: EntityId[]): TaskScope {
		this.addQuery({ parentId: { $in: parentIds.map((id) => new ObjectId(id)) } });
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

	byIds(taskIds: EntityId[]): TaskScope {
		this.addQuery({ id: { $in: taskIds } });
		return this;
	}

	ignoreIds(taskIds: EntityId[]): TaskScope {
		this.addQuery({ id: { $nin: taskIds } });
		return this;
	}

	afterDueDateOrNone(dueDate: Date): TaskScope {
		this.addQuery({ $or: [{ dueDate: { $gte: dueDate } }, { dueDate: null }] });
		return this;
	}
}
