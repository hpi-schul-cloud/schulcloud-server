import { FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Counted, CourseGroup, EntityId, Submission } from '@shared/domain';
import { BaseRepo } from '../base.repo';

// TODO: add scope helper

@Injectable()
export class SubmissionRepo extends BaseRepo<Submission> {
	protected get entityName() {
		return Submission;
	}

	async findAllByTaskIds(taskIds: EntityId[]): Promise<Counted<Submission[]>> {
		const [submissions, count] = await this._em.findAndCount(Submission, {
			task: { $in: taskIds },
		});

		return [submissions, count];
	}

	async findAllByUserId(userId: EntityId): Promise<Counted<Submission[]>> {
		const result = await this._em.findAndCount(Submission, await this.byUserIdQuery(userId));
		return result;
	}

	private async byUserIdQuery(userId: EntityId): Promise<FilterQuery<Submission>> {
		const courseGroupsOfUser = await this._em.find(CourseGroup, { students: userId });
		const query = { $or: [{ student: userId }, { teamMembers: userId }, { courseGroup: { $in: courseGroupsOfUser } }] };
		return query;
	}
}
