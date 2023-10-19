import { Injectable } from '@nestjs/common';
import { Counted, EntityId, LessonEntity, SortOrder } from '@shared/domain';
import { EntityDictionary } from '@mikro-orm/core';
import { BaseRepo } from '../base.repo';
import { LessonScope } from './lesson-scope';

@Injectable()
export class LessonRepo extends BaseRepo<LessonEntity> {
	get entityName() {
		return LessonEntity;
	}

	async createLesson(lesson: LessonEntity): Promise<void> {
		return this.save(this.create(lesson));
	}

	async findById(id: EntityId): Promise<LessonEntity> {
		const lesson = await super.findById(id);
		await this._em.populate(lesson, ['course', 'tasks', 'materials', 'courseGroup.course']);
		return lesson;
	}

	async findAllByCourseIds(courseIds: EntityId[], filters?: { hidden?: boolean }): Promise<Counted<LessonEntity[]>> {
		const scope = new LessonScope();

		scope.byCourseIds(courseIds);

		if (filters?.hidden !== undefined) {
			scope.byHidden(filters.hidden);
		}

		const order = { position: SortOrder.asc };

		const [lessons, count] = await this._em.findAndCount(LessonEntity, scope.query, { orderBy: order });

		await this._em.populate(lessons, ['course', 'tasks', 'materials']);

		return [lessons, count];
	}

	public async findByUserId(userId: EntityId): Promise<LessonEntity[]> {
		const pipeline = [
			{
				$match: {
					contents: {
						$elemMatch: {
							user: userId,
						},
					},
				},
			},
		];

		const rawLessonsDocuments = await this._em.aggregate(LessonEntity, pipeline);

		const lessons = rawLessonsDocuments.map((rawLessonDocument) =>
			this._em.map(LessonEntity, rawLessonDocument as EntityDictionary<LessonEntity>)
		);

		return lessons;
	}
}
