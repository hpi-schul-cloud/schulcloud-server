import { EntityDictionary, EntityName } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { SortOrder } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { LessonScope } from './lesson-scope';
import { LessonEntity } from './lesson.entity';

@Injectable()
export class LessonRepo extends BaseRepo<LessonEntity> {
	get entityName(): EntityName<LessonEntity> {
		return LessonEntity;
	}

	public async createLesson(lesson: LessonEntity): Promise<void> {
		await this.save(this.create(lesson));
	}

	public async findById(id: EntityId): Promise<LessonEntity> {
		const lesson = await super.findById(id);
		await this._em.populate(lesson, ['course', 'tasks', 'materials', 'courseGroup.course']);
		return lesson;
	}

	public async findAllByCourseIds(
		courseIds: EntityId[],
		filters?: { hidden?: boolean }
	): Promise<Counted<LessonEntity[]>> {
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
							user: new ObjectId(userId),
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
