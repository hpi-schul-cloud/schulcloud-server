import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, IPagination } from '@shared/domain';
import { QueryOrder } from '@mikro-orm/core';
import { Counted } from '@shared/domain/types';
import { Task, Submission, CourseTaskInfo, LessonTaskInfo } from '../entity';

@Injectable()
export class TaskRepo {
	constructor(private readonly em: EntityManager) {}

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

		const [coursesOfStudent, submissionsOfStudent] = await Promise.all([
			this.em.find(CourseTaskInfo, { students: userId }),
			this.em.find(Submission, { student: userId }),
		]);

		const lessonsOfStudent = await this.em.find(LessonTaskInfo, {
			course: { $in: coursesOfStudent },
			hidden: false,
		});

		// TODO: filter via query ..exist not exist, orm return null ? Add test for it!
		const homeworksWithSubmissions = submissionsOfStudent.map((submission) => submission.homework.id);

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
					{ course: { $in: coursesOfStudent } },
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

	async findAllAssignedByTeacher(userId: EntityId): Promise<Counted<Task[]>> {
		// TODO: merge overlaps with findAllOpenByStudent
		// TODO: use Query Builder
		const coursesOfTeacher = await this.em.find(CourseTaskInfo, {
			teachers: userId,
		});
		const publishedLessons = await this.em.find(LessonTaskInfo, {
			course: { $in: coursesOfTeacher },
			hidden: false,
		});

		const [usersTasks, count] = await this.em.findAndCount(Task, {
			$and: [
				{ course: { $in: coursesOfTeacher } },
				{ private: { $ne: true } },
				{ $or: [{ lesson: null }, { lesson: { $in: publishedLessons } }] },
			],
		});
		return [usersTasks, count];
	}
}
