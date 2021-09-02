import { Injectable } from '@nestjs/common';
import { EntityManager, FilterQuery, QueryOrderMap } from '@mikro-orm/core';

import { EntityId, IFindOptions } from '@shared/domain';
import { Counted } from '@shared/domain/types';

// TODO lessonTaskInfo must deleted
import { ObjectId } from '@mikro-orm/mongodb';
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
	 * Find all currently active tasks by their parent ids.
	 *
	 * @param parentIds ids of parent entities
	 * @param options pagination, sorting
	 * @returns
	 */
	async findAllCurrent(parentIds: EntityId[], options?: IFindOptions<Task>): Promise<Counted<Task[]>> {
		const lessons = await this.findLessons(parentIds);
		const dueDate = this.getDefaultMaxDueDate();

		const scope = new TaskScope();
		scope.byParents(parentIds);
		scope.byPublic();
		scope.byLessonsOrNone(lessons.map((o) => o.id));
		scope.afterDueDateOrNone(dueDate);

		const countedTaskList = await this.findTasksAndCount(scope.query, options);
		return countedTaskList;
	}

	// /**
	//  * Find all currently active tasks by their parent ids and a list of task ids.
	//  *
	//  * @param parentIds ids of parent entities
	//  * @param ids task ids to include
	//  * @param options pagination, sorting
	//  * @returns
	//  */
	// async findAllCurrentByIds(
	// 	parentIds: EntityId[],
	// 	ids: EntityId[],
	// 	options?: IFindOptions<Task>
	// ): Promise<Counted<Task[]>> {
	// 	const lessons = await this.findLessons(parentIds);
	// 	const dueDate = this.getDefaultMaxDueDate();

	// 	const scope = new TaskScope();
	// 	scope.byParents(parentIds);
	// 	scope.byPublic();
	// 	scope.byLessonsOrNone(lessons.map((o) => o.id));
	// 	scope.afterDueDateOrNone(dueDate);

	// 	scope.byIds(ids);

	// 	const countedTaskList = await this.findTasksAndCount(scope.query, options);
	// 	return countedTaskList;
	// }

	// /**
	//  * Find all currently active tasks by their parent ids ignoring a list of task ids.
	//  *
	//  * @param parentIds ids of parent entities
	//  * @param ignoreIds task ids to ignore
	//  * @param options pagination, sorting
	//  * @returns
	//  */
	// async findAllCurrentIgnoreIds(
	// 	parentIds: EntityId[],
	// 	ignoreIds: EntityId[] = [],
	// 	options?: IFindOptions<Task>
	// ): Promise<Counted<Task[]>> {
	// 	const lessons = await this.findLessons(parentIds);
	// 	const dueDate = this.getDefaultMaxDueDate();

	// 	const scope = new TaskScope();
	// 	scope.byParents(parentIds);
	// 	scope.byPublic();
	// 	scope.byLessonsOrNone(lessons.map((o) => o.id));
	// 	scope.afterDueDateOrNone(dueDate);

	// 	scope.ignoreIds(ignoreIds);

	// 	const countedTaskList = await this.findTasksAndCount(scope.query, options);
	// 	return countedTaskList;
	// }

	private async findTasksAndCount(query: FilterQuery<Task>, options?: IFindOptions<Task>): Promise<Counted<Task[]>> {
		const { pagination, order } = options || {};
		const [taskEntities, count] = await this.em.findAndCount(Task, query, {
			...pagination,
			orderBy: order as QueryOrderMap,
		});
		return [taskEntities, count];
	}

	private async findLessons(parentIds: EntityId[]): Promise<LessonTaskInfo[]> {
		const lessons = await this.em.find(LessonTaskInfo, {
			courseId: { $in: parentIds.map((id) => new ObjectId(id)) },
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
