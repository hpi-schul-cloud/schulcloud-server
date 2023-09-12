import { Injectable } from '@nestjs/common';
import { Counted, Course, EntityId, Lesson, SortOrder } from '@shared/domain';
import { LessonCreateDto } from '@src/modules/lesson/types';
import { BaseRepo } from '../base.repo';
import { LessonScope } from './lesson-scope';

@Injectable()
export class LessonRepo extends BaseRepo<Lesson> {
	get entityName() {
		return Lesson;
	}

	async createLesson(lesson: Lesson): Promise<Lesson> {
		const createdLesson = this.create(lesson);
		await this.save(createdLesson);
		return createdLesson;
	}

	async createLessonByDto(lessonCreateDto: LessonCreateDto): Promise<Lesson> {
		const { name, courseId, hidden, contents, position } = lessonCreateDto;
		const courseRef = this._em.getReference(Course, courseId);
		const lesson = new Lesson({
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
}
