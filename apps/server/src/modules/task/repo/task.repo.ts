import { Injectable } from '@nestjs/common';
import { EntityManager, FilterQuery, QueryOrderMap } from '@mikro-orm/core';

import { EntityId, IFindOptions } from '@shared/domain';
import { Counted } from '@shared/domain/types';

// TODO lessonTaskInfo must deleted
import { Task, LessonTaskInfo } from '../entity';
import { TaskScope } from './task-scope';

@Injectable()
export class TaskRepo {
	constructor(private readonly em: EntityManager) {}

	/**
	 * Find all tasks by their parents.
	 *
	 * @param parentIds ids of parent entities
	 * @param options pagination, sorting
	 * @returns
	 */
	async findAll(parentIds: EntityId[], options?: IFindOptions<Task>): Promise<Counted<Task[]>> {
		const lessons = await this.findLessons(parentIds);

		const scope = new TaskScope();
		scope.byParents(parentIds);
		scope.byPublic();
		scope.byLessonsOrNone(lessons.map((o) => o.id));

		const countedTaskList = await this.findTasksAndCount(scope.query, options);
		return countedTaskList;
	}

	/**
	 * Find all currently active tasks by their parents.
	 *
	 * @param parentIds ids of parent entities
	 * @param ignoreTaskIds task ids to exclude from the query
	 * @param options pagination, sorting
	 * @returns
	 */
	async findAllCurrent(
		parentIds: EntityId[],
		ignoreTaskIds: EntityId[] = [],
		options?: IFindOptions<Task>
	): Promise<Counted<Task[]>> {
		const lessons = await this.findLessons(parentIds);
		const dueDate = this.getDefaultMaxDueDate();

		const scope = new TaskScope();
		scope.byParents(parentIds);
		scope.byPublic();
		scope.byLessonsOrNone(lessons.map((o) => o.id));
		scope.ignoreTasks(ignoreTaskIds);
		scope.afterDueDateOrNone(dueDate);

		const countedTaskList = await this.findTasksAndCount(scope.query, options);
		return countedTaskList;
	}

	// // TODO: rename
	// async findAllByStudent(
	// 	parentIds: EntityId[],
	// 	{ limit, skip }: IPagination = {},
	// 	ignoredTasks: EntityId[] = []
	// ): Promise<Counted<Task[]>> {
	// 	const lessonsOfStudent = await this.em.find(LessonTaskInfo, {
	// 		courseId: { $in: parentIds },
	// 		hidden: false,
	// 	});

	// 	// TODO: date sounds like domain logic if this go out, after it student and teacher has only different order logic
	// 	// that also sound like it should manage over scope helper in uc.
	// 	const oneWeekAgo = new Date();
	// 	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
	// 	const [usersTasks, total] = await this.em.findAndCount(
	// 		Task,
	// 		{
	// 			$and: [
	// 				{ id: { $nin: ignoredTasks } },
	// 				{ private: { $ne: true } },
	// 				{ courseId: { $in: parentIds } },
	// 				{ $or: [{ lesson: null }, { lesson: { $in: lessonsOfStudent } }] },
	// 				{ $or: [{ dueDate: { $gte: oneWeekAgo } }, { dueDate: null }] },
	// 			],
	// 		},
	// 		// TODO extract pagination, oderby
	// 		{ limit, offset: skip, orderBy: { dueDate: QueryOrder.ASC } }
	// 	);

	// 	return [usersTasks, total];
	// }

	// // TODO: rename
	// async findAllAssignedByTeacher(parentIds: EntityId[], { limit, skip }: IPagination = {}): Promise<Counted<Task[]>> {
	// 	const publishedLessons = await this.em.find(LessonTaskInfo, {
	// 		courseId: { $in: parentIds },
	// 		hidden: false,
	// 	});

	// 	const [usersTasks, count] = await this.em.findAndCount(
	// 		Task,
	// 		{
	// 			$and: [
	// 				{ courseId: { $in: parentIds } },
	// 				{ private: { $ne: true } },
	// 				{ $or: [{ lesson: null }, { lesson: { $in: publishedLessons } }] },
	// 			],
	// 		}, // TODO: { createdAt: QueryOrder.DESC } vs orderBy: { dueDate: QueryOrder.ASC } teacher vs student
	// 		{ limit, offset: skip, orderBy: { createdAt: QueryOrder.DESC } }
	// 	);
	// 	return [usersTasks, count];
	// }

	private async findTasksAndCount(query: FilterQuery<Task>, options?: IFindOptions<Task>): Promise<Counted<Task[]>> {
		const { pagination, order } = options || {};
		const [taskEntities, count] = await this.em.findAndCount(Task, query, {
			...pagination,
			orderBy: order as QueryOrderMap,
		});
		return [taskEntities, count];
	}

	private async findLessons(parentIds: EntityId[]) {
		const lessons = await this.em.find(LessonTaskInfo, {
			courseId: { $in: parentIds },
			hidden: false,
		});
		return lessons;
	}

	private getDefaultMaxDueDate(): Date {
		// TODO: date sounds like domain logic if this go out, after it student and teacher has only different order logic
		// that also sound like it should manage over scope helper in uc.
		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
		return oneWeekAgo;
	}
}
