import { Injectable } from '@nestjs/common';
import { EntityManager, FilterQuery, QueryOrderMap } from '@mikro-orm/core';

import { EntityId, IFindOptions, Task, Counted } from '@shared/domain';

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
		filters?: { draft?: boolean; afterDueDateOrNone?: Date; closed?: EntityId },
		options?: IFindOptions<Task>
	): Promise<Counted<Task[]>> {
		const scope = new TaskScope();

		const parentIdScope = new TaskScope('$or');

		if (parentIds.teacherId) {
			parentIdScope.byTeacherId(parentIds.teacherId);
		}

		if (parentIds.courseIds) {
			parentIdScope.byCourseIds(parentIds.courseIds);
		}

		if (parentIds.lessonIds) {
			parentIdScope.byLessonIds(parentIds.lessonIds);
		}

		scope.addQuery(parentIdScope.query);

		if (filters?.closed) {
			scope.byClosed(filters.closed);
		}

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

		await this.em.populate(taskEntities, ['course', 'lesson', 'submissions']);
		return [taskEntities, count];
	}
}
