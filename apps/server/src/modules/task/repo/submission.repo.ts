import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Counted, EntityId } from '../../../shared/domain';
import { CourseGroupInfo, Submission, Task } from '../entity';
import { ITaskSubmission } from './task.repo';

@Injectable()
export class SubmissionRepo implements ITaskSubmission {
	constructor(private readonly em: EntityManager) {}

	async getSubmissionsByTask(task: Task): Promise<Counted<Submission[]>> {
		const [submissions, count] = await this.em.findAndCount(Submission, {
			task,
		});
		return [submissions, count];
	}

	async getSubmissionsByTasksList(tasks: Task[]): Promise<Counted<Submission[]>> {
		const [submissions, count] = await this.em.findAndCount(Submission, {
			task: { $in: tasks },
		});

		return [submissions, count];
	}

	async getAllSubmissionsByUser(userId: EntityId): Promise<Counted<Submission[]>> {
		const courseGroupsOfUser = await this.em.find(CourseGroupInfo, { students: userId });
		const result = await this.em.findAndCount(Submission, {
			$or: [{ student: userId }, { teamMembers: userId }, { courseGroup: { $in: courseGroupsOfUser } }],
		});
		return result;
	}
}
