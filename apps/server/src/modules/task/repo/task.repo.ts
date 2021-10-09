import { Injectable } from '@nestjs/common';
import { EntityManager, FilterQuery, QueryOrderMap } from '@mikro-orm/core';

import { EntityId, IFindOptions, Lesson, Task } from '@shared/domain';
import { Counted } from '@shared/domain/types';

import { TaskScope } from './task-scope';

@Injectable()
export class TaskRepo {
	constructor(private readonly em: EntityManager) {}

	/**
	 * Find all tasks by their parents which can be any of
	 * - a teacher who owns the task
	 * - a list of courses
	 * - a list of lessons
	 *
	 * @param parentIds parentIds for teacher, courses and lesson
	 * @param filters filters
	 * @param options pagination, sorting
	 * @returns
	 */
	async findAllByParentIds(
		parentIds: {
			teacherId?: EntityId;
			courseIds?: EntityId[];
			lessonIds?: EntityId[];
		},
		filters?: { draft?: boolean; afterDueDateOrNone?: Date },
		options?: IFindOptions<Task>
	): Promise<Counted<Task[]>> {
		const scope = new TaskScope();

		const { teacherId, courseIds, lessonIds } = parentIds;
		scope.byParentIds(teacherId, courseIds, lessonIds);

		if (filters?.draft !== undefined) {
			scope.byDraft(filters.draft);
		}

		if (filters?.afterDueDateOrNone !== undefined) {
			scope.afterDueDateOrNone(filters.afterDueDateOrNone);
		}

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
}
