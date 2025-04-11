import { ObjectId } from '@mikro-orm/mongodb';
import { FilterQuery } from '@mikro-orm/core';
import { CourseGroupEntity } from '@modules/course/repo';
import { Injectable } from '@nestjs/common';
import { Counted, EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { Submission } from './submission.entity';
import { getFieldName } from '@shared/repo/utils/repo-helper';

// TODO: add scope helper

@Injectable()
export class SubmissionRepo extends BaseRepo<Submission> {
	get entityName() {
		return Submission;
	}

	async findById(id: string): Promise<Submission> {
		const submission = await super.findById(id);
		await this.populateReferences([submission]);

		return submission;
	}

	async findAllByTaskIds(taskIds: EntityId[]): Promise<Counted<Submission[]>> {
		const [submissions, count] = await this._em.findAndCount(this.entityName, {
			task: { $in: taskIds },
		});

		await this.populateReferences(submissions);

		return [submissions, count];
	}

	async findAllByUserId(userId: EntityId): Promise<Counted<Submission[]>> {
		const result = await this._em.findAndCount(this.entityName, await this.byUserIdQuery(userId));
		return result;
	}

	public async deleteUserFromGroupSubmissions(userId: EntityId): Promise<number> {
		const id = new ObjectId(userId);
		const count = await this._em.nativeUpdate(this.entityName, { teamMembers: id }, {
			$pull: { teamMembers: id },
		} as Partial<Submission>);

		return count;
	}

	public async removeUserReference(submissionIds: EntityId[]): Promise<number> {
		const submissionFieldName = getFieldName(this._em, 'student', Submission.name);
		const count = await this._em.nativeUpdate(this.entityName, { id: { $in: submissionIds } }, {
			$unset: { [submissionFieldName]: '' },
		} as Partial<Submission>);

		return count;
	}
	private async byUserIdQuery(userId: EntityId): Promise<FilterQuery<Submission>> {
		const courseGroupsOfUser = await this._em.find(CourseGroupEntity, { students: userId });
		const query = { $or: [{ student: userId }, { teamMembers: userId }, { courseGroup: { $in: courseGroupsOfUser } }] };
		return query;
	}

	private async populateReferences(submissions: Submission[]): Promise<void> {
		await this._em.populate(submissions, [
			'courseGroup',
			'task.course',
			'task.lesson.course',
			'task.lesson.courseGroup.course',
		]);
	}
}
