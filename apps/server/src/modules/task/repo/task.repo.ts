import { Injectable } from '@nestjs/common';
import { EntityId, IPagination } from '@shared/domain';
import { EntityManager, QueryOrder } from '@mikro-orm/core';
import { Counted } from '@shared/domain/types';
import { Task, LessonTaskInfo } from '../entity';

@Injectable()
export class TaskRepo {
	constructor(private readonly em: EntityManager) {}

	async findAllByStudent(
		courseIds: EntityId[],
		{ limit, skip }: IPagination = {},
		ignoredTasks: EntityId[] = []
	): Promise<Counted<Task[]>> {
		const lessonsOfStudent = await this.em.find(LessonTaskInfo, {
			courseId: { $in: courseIds },
			hidden: false,
		});

		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
		const [usersTasks, total] = await this.em.findAndCount(
			Task,
			{
				// TODO task query builder, see NewsScope
				$and: [
					// TODO move into a logic group / director
					{ id: { $nin: ignoredTasks } },
					{ private: { $ne: true } },
					{ courseId: { $in: courseIds } },
					{ $or: [{ lesson: null }, { lesson: { $in: lessonsOfStudent } }] },
					{ $or: [{ dueDate: { $gte: oneWeekAgo } }, { dueDate: null }] },
				],
			},
			// TODO extract pagination, oderby
			{ limit, offset: skip, orderBy: { dueDate: QueryOrder.ASC } }
		);

		return [usersTasks, total];
	}

	async findAllAssignedByTeacher(courseIds: EntityId[], { limit, skip }: IPagination = {}): Promise<Counted<Task[]>> {
		const publishedLessons = await this.em.find(LessonTaskInfo, {
			courseId: { $in: courseIds },
			hidden: false,
		});

		const [usersTasks, count] = await this.em.findAndCount(
			Task,
			{
				$and: [
					{ courseId: { $in: courseIds } },
					{ private: { $ne: true } },
					{ $or: [{ lesson: null }, { lesson: { $in: publishedLessons } }] },
				],
			},
			{ limit, offset: skip, orderBy: { createdAt: QueryOrder.DESC } }
		);
		return [usersTasks, count];
	}
}
