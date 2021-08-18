import { Injectable } from '@nestjs/common';
import { EntityManager, QueryOrder } from '@mikro-orm/core';

import { EntityId, IPagination } from '@shared/domain';
import { Counted } from '@shared/domain/types';

// lessonTaskInfo must deleted
import { Task, LessonTaskInfo } from '../entity';

// TODO: add scope helper and export to use it in uc
@Injectable()
export class TaskRepo {
	constructor(private readonly em: EntityManager) {}

	// TODO: rename
	async findAllByStudent(
		parentIds: EntityId[],
		{ limit, skip }: IPagination = {},
		ignoredTasks: EntityId[] = []
	): Promise<Counted<Task[]>> {
		const lessonsOfStudent = await this.em.find(LessonTaskInfo, {
			courseId: { $in: parentIds },
			hidden: false,
		});

		// TODO: date sounds like domain logic if this go out, after it student and teacher has only different order logic
		// that also sound like it should manage over scope helper in uc.
		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
		const [usersTasks, total] = await this.em.findAndCount(
			Task,
			{
				$and: [
					{ id: { $nin: ignoredTasks } },
					{ private: { $ne: true } },
					{ courseId: { $in: parentIds } },
					{ $or: [{ lesson: null }, { lesson: { $in: lessonsOfStudent } }] },
					{ $or: [{ dueDate: { $gte: oneWeekAgo } }, { dueDate: null }] },
				],
			},
			// TODO extract pagination, oderby
			{ limit, offset: skip, orderBy: { dueDate: QueryOrder.ASC } }
		);

		return [usersTasks, total];
	}

	// TODO: rename
	async findAllAssignedByTeacher(parentIds: EntityId[], { limit, skip }: IPagination = {}): Promise<Counted<Task[]>> {
		const publishedLessons = await this.em.find(LessonTaskInfo, {
			courseId: { $in: parentIds },
			hidden: false,
		});

		const [usersTasks, count] = await this.em.findAndCount(
			Task,
			{
				$and: [
					{ courseId: { $in: parentIds } },
					{ private: { $ne: true } },
					{ $or: [{ lesson: null }, { lesson: { $in: publishedLessons } }] },
				],
			}, // TODO: { createdAt: QueryOrder.DESC } vs orderBy: { dueDate: QueryOrder.ASC } teacher vs student
			{ limit, offset: skip, orderBy: { createdAt: QueryOrder.DESC } }
		);
		return [usersTasks, count];
	}
}
