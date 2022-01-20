import { FilterQuery } from '@mikro-orm/core';
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
		const query = this.getByDraftQuery(isDraft);
		this.addQuery(query);

		return this;
	}

	byDraftExcludeOthers(creatorId?: EntityId, isDraft?: boolean): TaskScope {
		if (creatorId) {
			if (isDraft !== undefined) {
				this.addQuery({
					$or: [
						{ $and: [{ creator: creatorId }, this.getByDraftQuery(isDraft)] },
						{ $and: [{ creator: { $ne: creatorId } }, this.getByDraftQuery(false)] },
					],
				});
			} else {
				this.addQuery({
					$or: [{ $and: [{ creator: creatorId }, this.getByDraftQuery(true)] }, this.getByDraftQuery(false)],
				});
			}
		} else {
			this.addQuery(this.getByDraftQuery(false));
		}

		return this;
	}

	afterDueDateOrNone(dueDate: Date): TaskScope {
		this.addQuery({ $or: [{ dueDate: { $gte: dueDate } }, { dueDate: null }] });

		return this;
	}

	private getByDraftQuery(isDraft: boolean): FilterQuery<Task> {
		const query = isDraft ? { private: { $eq: true } } : { private: { $ne: true } };

		return query;
	}
}
