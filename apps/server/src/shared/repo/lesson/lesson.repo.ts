import { Injectable } from '@nestjs/common';
import { Counted, EntityId, Lesson, SortOrder } from '@shared/domain';
import { BaseRepo } from '../base.repo';
import { LessonScope } from './lesson-scope';
import { EntityDictionary } from '@mikro-orm/core';

@Injectable()
export class LessonRepo extends BaseRepo<Lesson> {
	get entityName() {
		return Lesson;
	}

	async createLesson(lesson: Lesson): Promise<void> {
		return this.save(this.create(lesson));
	}

	async findById(id: EntityId): Promise<Lesson> {
		const lesson = await super.findById(id);
		await this._em.populate(lesson, ['course', 'tasks', 'materials', 'courseGroup.course']);
		return lesson;
	}

	async findAllByCourseIds(courseIds: EntityId[], filters?: { hidden?: boolean }): Promise<Counted<Lesson[]>> {
		const scope = new LessonScope();

		scope.byCourseIds(courseIds);

		if (filters?.hidden !== undefined) {
			scope.byHidden(filters.hidden);
		}

		const order = { position: SortOrder.asc };

		const [lessons, count] = await this._em.findAndCount(Lesson, scope.query, { orderBy: order });

		await this._em.populate(lessons, ['course', 'tasks', 'materials']);

		return [lessons, count];
	}

	public async findByUserId(userId: EntityId): Promise<Lesson[]> {
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

		const rawLessonsDocuments = await this._em.aggregate(Lesson, pipeline);

		const lessons = rawLessonsDocuments.map((rawLessonDocument) =>
			this._em.map(Lesson, rawLessonDocument as EntityDictionary<Lesson>)
		);

		return lessons;
	}
}
