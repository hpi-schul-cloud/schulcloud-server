import { Injectable } from '@nestjs/common';
import { Counted, EntityId, Lesson, SortOrder } from '@shared/domain';
import { BaseRepo } from '../base.repo';
import { LessonScope } from './lesson-scope';

@Injectable()
export class LessonRepo extends BaseRepo<Lesson> {
	get entityName() {
		return Lesson;
	}

	async findAllByCourseIds(courseIds: EntityId[], filters?: { hidden?: boolean }): Promise<Counted<Lesson[]>> {
		const scope = new LessonScope();

		scope.byCourseIds(courseIds);

		if (filters?.hidden !== undefined) {
			scope.byHidden(filters.hidden);
		}

		const order = { position: SortOrder.asc };

		const [lessons, count] = await this._em.findAndCount(Lesson, scope.query, { orderBy: order });

		await this._em.populate(lessons, ['course']);

		return [lessons, count];
	}
}
