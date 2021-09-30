import { Injectable } from '@nestjs/common';
import { EntityManager, FilterQuery, QueryOrderMap } from '@mikro-orm/core';

import { EntityId, IFindOptions, Lesson, Task } from '@shared/domain';
import { Counted } from '@shared/domain/types';

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
		const visibleLessons = await this.findVisibleLessons(parentIds);

		const scope = new TaskScope();
		scope.byParentIds(parentIds);
		scope.byPublic();
		scope.byLessonsOrNone(visibleLessons.map((o) => o.id));

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
		const visibleLessons = await this.findVisibleLessons(parentIds);
		const dueDate = this.getDefaultMaxDueDate();

		const scope = new TaskScope();
		scope.byParentIds(parentIds);
		scope.byPublic();
		scope.byLessonsOrNone(visibleLessons.map((o) => o.id));
		scope.afterDueDateOrNone(dueDate);

		const countedTaskList = await this.findTasksAndCount(scope.query, options);
		return countedTaskList;
	}

	private async findTasksAndCount(query: FilterQuery<Task>, options?: IFindOptions<Task>): Promise<Counted<Task[]>> {
		const { pagination, order } = options || {};
		const [taskEntities, count] = await this.em.findAndCount(Task, query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order as QueryOrderMap,
		});
		await this.em.populate(taskEntities, ['parent', 'lesson', 'submissions']);
		return [taskEntities, count];
	}

	// TODO move to lesson repo
	private async findVisibleLessons(parentIds: EntityId[]): Promise<Lesson[]> {
		const lessons = await this.em.find(Lesson, {
			course: { $in: parentIds },
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
