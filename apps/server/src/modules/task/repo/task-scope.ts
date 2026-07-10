import { type FilterQuery } from '@mikro-orm/core';
import { type EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo/scope';
import { type Task } from './task.entity';

export class TaskScope extends Scope<Task> {
	public byFinished(userId: EntityId, value: boolean): TaskScope {
		if (value === true) {
			this.addQuery({ finished: userId });
		} else {
			this.addQuery({ finished: { $ne: userId } });
		}

		return this;
	}

	public byOnlyCreatorId(creatorId: EntityId): TaskScope {
		this.addQuery({
			$and: [{ creator: creatorId }, { course: null }, { lesson: null }],
		});

		return this;
	}

	public byCreatorId(creatorId: EntityId): TaskScope {
		this.addQuery({ creator: creatorId });

		return this;
	}

	public byCreatorIdWithCourseAndLesson(creatorId: EntityId): TaskScope {
		this.addQuery({
			$and: [{ creator: creatorId }, { $or: [{ course: { $ne: null } }, { lesson: { $ne: null } }] }],
		});

		return this;
	}

	public byCourseIds(courseIds: EntityId[]): TaskScope {
		this.addQuery({
			$and: [{ course: { $in: courseIds } }, { lesson: null }],
		});

		return this;
	}

	public byLessonIds(lessonIds: EntityId[]): TaskScope {
		this.addQuery({ lesson: { $in: lessonIds } });

		return this;
	}

	public byDraft(isDraft: boolean): TaskScope {
		const query = this.getByDraftQuery(isDraft);
		this.addQuery(query);

		return this;
	}

	public excludeDraftsOfOthers(creatorId: EntityId): TaskScope {
		this.addQuery({
			$or: [this.getByDraftForCreatorQuery(creatorId), this.getByDraftQuery(false)],
		});

		return this;
	}

	public byAvailable(availableDate: Date): TaskScope {
		this.addQuery({ availableDate: { $lte: availableDate } });

		return this;
	}

	public noFutureAvailableDate(): TaskScope {
		const query = { availableDate: { $lte: new Date(Date.now()) } };
		this.addQuery(query);

		return this;
	}

	public excludeUnavailableOfOthers(creatorId: EntityId, availableOn: Date): TaskScope {
		this.addQuery({
			$or: [
				{ creator: creatorId },
				{ $and: [{ creator: { $ne: creatorId } }, { availableDate: { $lte: availableOn } }] },
			],
		});
		return this;
	}

	public afterDueDateOrNone(dueDate: Date): TaskScope {
		this.addQuery({ $or: [{ dueDate: { $gte: dueDate } }, { dueDate: null }] });

		return this;
	}

	private getByDraftQuery(isDraft: boolean): FilterQuery<Task> {
		const query = isDraft ? { private: { $eq: true } } : { private: { $ne: true } };

		return query;
	}

	private getByDraftForCreatorQuery(creatorId: EntityId): FilterQuery<Task> {
		const query = { $and: [{ creator: creatorId }, this.getByDraftQuery(true)] };

		return query;
	}
}
