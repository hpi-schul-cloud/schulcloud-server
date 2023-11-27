import { FilterQuery } from '@mikro-orm/core';
import { Task } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { Scope } from '../scope';

export class TaskScope extends Scope<Task> {
	byFinished(userId: EntityId, value: boolean): TaskScope {
		if (value === true) {
			this.addQuery({ finished: userId });
		} else {
			this.addQuery({ finished: { $ne: userId } });
		}

		return this;
	}

	byOnlyCreatorId(creatorId: EntityId): TaskScope {
		this.addQuery({
			$and: [{ creator: creatorId }, { course: null }, { lesson: null }],
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

	excludeDraftsOfOthers(creatorId: EntityId): TaskScope {
		this.addQuery({
			$or: [this.getByDraftForCreatorQuery(creatorId), this.getByDraftQuery(false)],
		});

		return this;
	}

	byAvailable(availableDate: Date): TaskScope {
		this.addQuery({ availableDate: { $lte: availableDate } });

		return this;
	}

	noFutureAvailableDate(): TaskScope {
		const query = { availableDate: { $lte: new Date(Date.now()) } };
		this.addQuery(query);

		return this;
	}

	excludeUnavailableOfOthers(creatorId: EntityId, availableOn: Date): TaskScope {
		this.addQuery({
			$or: [
				{ creator: creatorId },
				{ $and: [{ creator: { $ne: creatorId } }, { availableDate: { $lte: availableOn } }] },
			],
		});
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

	private getByDraftForCreatorQuery(creatorId: EntityId): FilterQuery<Task> {
		const query = { $and: [{ creator: creatorId }, this.getByDraftQuery(true)] };

		return query;
	}
}
