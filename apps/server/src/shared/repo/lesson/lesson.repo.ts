import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

import { EntityId, Lesson, IFindOptions, Counted } from '@shared/domain';

import { LessonScope } from './lesson-scope';

@Injectable()
export class LessonRepo {
	constructor(private readonly em: EntityManager) {}

	/**
	 * TODO add pagination and sorting
	 */
	async findAllByCourseIds(
		courseIds: EntityId[],
		filters?: { hidden?: boolean },
		options?: IFindOptions<Lesson>
	): Promise<Counted<Lesson[]>> {
		const scope = new LessonScope();

		const { select } = options || {};

		scope.byCourseIds(courseIds);

		if (filters?.hidden !== undefined) {
			scope.byHidden(filters.hidden);
		}

		const lessons = this.em.findAndCount(Lesson, scope.query, {
			fields: select,
		});

		return lessons;
	}
}
