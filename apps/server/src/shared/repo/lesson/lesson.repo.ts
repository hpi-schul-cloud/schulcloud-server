import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

import { EntityId, Lesson } from '@shared/domain';

import { LessonScope } from './lesson-scope';

@Injectable()
export class LessonRepo {
	constructor(private readonly em: EntityManager) {}

	/**
	 * TODO add pagination and sorting
	 */
	async findAllByCourseIds(courseIds: EntityId[], filters?: { hidden?: boolean }): Promise<Lesson[]> {
		const scope = new LessonScope();

		scope.byCourseIds(courseIds);

		if (filters?.hidden !== undefined) {
			scope.byHidden(filters.hidden);
		}

		const lessons = this.em.find(Lesson, scope.query);
		return lessons;
	}
}
