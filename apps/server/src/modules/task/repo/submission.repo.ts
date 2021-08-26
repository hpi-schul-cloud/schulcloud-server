import { FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';

import { Counted, EntityId } from '@shared/domain';

// CourseGroupInfo must use from learnroom
import { CourseGroupInfo, Submission } from '../entity';

// TODO: add scope helper

@Injectable()
export class SubmissionRepo {
	constructor(private readonly em: EntityManager) {}

	async findAllByTaskIds(taskIds: EntityId[]): Promise<Counted<Submission[]>> {
		const [submissions, count] = await this.em.findAndCount(Submission, {
			task: { $in: taskIds },
		});

		return [submissions, count];
	}

	async findAllByUserId(userId: EntityId): Promise<Counted<Submission[]>> {
		const result = await this.em.findAndCount(Submission, await this.byUserIdQuery(userId));
		return result;
	}

	private async byUserIdQuery(userId: EntityId): Promise<FilterQuery<Submission>> {
		const courseGroupsOfUser = await this.em.find(CourseGroupInfo, { students: userId });
		const query = { $or: [{ student: userId }, { teamMembers: userId }, { courseGroup: { $in: courseGroupsOfUser } }] };
		return query;
	}
}
