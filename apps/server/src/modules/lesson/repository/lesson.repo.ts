import { EntityDictionary } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Course, LessonEntity } from '@shared/domain/entity';
import { SortOrder } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo';
import { LessonCreateDto } from '@src/modules/lesson/types';
import { LessonScope } from './lesson-scope';

@Injectable()
export class LessonRepo extends BaseRepo<LessonEntity> {
	get entityName() {
		return LessonEntity;
	}

	async createLesson(lesson: LessonEntity): Promise<LessonEntity> {
		const createdLesson = this.create(lesson);
		await this.save(createdLesson);
		return createdLesson;
	}

	async createLessonByDto(lessonCreateDto: LessonCreateDto): Promise<LessonEntity> {
		const { name, courseId, hidden, contents, position } = lessonCreateDto;
		const courseRef = this._em.getReference(Course, courseId);
		const lesson = new LessonEntity({
			name,
			hidden: hidden ?? false,
			course: courseRef,
			position: position ?? 0,
			contents: contents ?? [],
		});
		if (lessonCreateDto.id) lesson.id = lessonCreateDto.id;
		await this.save(this.create(lesson));
		return lesson;
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
