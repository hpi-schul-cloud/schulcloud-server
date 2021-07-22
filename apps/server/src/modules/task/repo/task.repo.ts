import { Inject, Injectable } from '@nestjs/common';
import { EntityId, IPagination } from '@shared/domain';
import { EntityManager, QueryOrder } from '@mikro-orm/core';
import { Counted } from '@shared/domain/types';
import { Task, Submission, CourseTaskInfo, LessonTaskInfo } from '../entity';

export interface ITaskSubmission {
	getAllSubmissionsByUser(userId: EntityId): Promise<Counted<Submission[]>>;
}

@Injectable()
export class TaskRepo {
	constructor(private readonly em: EntityManager, @Inject('ITaskSubmission') private taskSubmission: ITaskSubmission) {}

	// TODO: move to seperate repo
	async getCourseOfUser(userId: EntityId): Promise<CourseTaskInfo[]> {
		const coursesOfUser = await this.em.find(CourseTaskInfo, {
			$or: [
				{
					students: userId,
				},
				{
					teachers: userId,
				},
				{
					substitutionTeachers: userId,
				},
			],
		});
		return coursesOfUser;
	}

	// WARNING: this is used to deal with the current datamodel, and needs to be changed.
	// DO NOT DO THIS AT HOME!!
	async findAllOpenByStudent(userId: EntityId, { limit, skip }: IPagination = {}): Promise<Counted<Task[]>> {
		// todo: handle coursegroups

		// TODO move BL to UC
		// we have following logical groups:
		// filter for all news a user might read
		// filter by tasks not yet done
		// order by duedate
		// pagination

		const [coursesOfUser, [submissionsOfStudent, submissionCount]] = await Promise.all([
			this.getCourseOfUser(userId),
			this.taskSubmission.getAllSubmissionsByUser(userId),
		]);

		const lessonsOfStudent = await this.em.find(LessonTaskInfo, {
			course: { $in: coursesOfUser },
			hidden: false,
		});

		// TODO: filter via query ..exist not exist, orm return null ? Add test for it!
		const homeworksWithSubmissions = submissionsOfStudent.map((submission) => submission.task.id);

		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
		const [usersTasks, total] = await this.em.findAndCount(
			Task,
			{
				// TODO task query builder, see NewsScope
				$and: [
					// TODO move into a logic group / director
					{ id: { $nin: homeworksWithSubmissions } },
					{ private: { $ne: true } },
					{ course: { $in: coursesOfUser } },
					{ $or: [{ lesson: null }, { lesson: { $in: lessonsOfStudent } }] },
					{ $or: [{ dueDate: { $gte: oneWeekAgo } }, { dueDate: null }] },
				],
			},
			// TODO Populate in separate step
			// TODO extract pagination, oderby
			{ populate: ['course'], limit, offset: skip, orderBy: { dueDate: QueryOrder.ASC } }
		);

		return [usersTasks, total];
	}

	async findAllAssignedByTeacher(userId: EntityId, { limit, skip }: IPagination = {}): Promise<Counted<Task[]>> {
		// TODO: merge overlaps with findAllOpenByStudent
		// TODO: use Query Builder
		const coursesOfUser = await this.getCourseOfUser(userId);

		const publishedLessons = await this.em.find(LessonTaskInfo, {
			course: { $in: coursesOfUser },
			hidden: false,
		});

		const [usersTasks, count] = await this.em.findAndCount(
			Task,
			{
				$and: [
					{ course: { $in: coursesOfUser } },
					{ private: { $ne: true } },
					{ $or: [{ lesson: null }, { lesson: { $in: publishedLessons } }] },
				],
			},
			{ populate: ['course'], limit, offset: skip, orderBy: { createdAt: QueryOrder.DESC } }
		);
		return [usersTasks, count];
	}
}
