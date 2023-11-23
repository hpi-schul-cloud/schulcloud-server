import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { ComponentProperties, LessonEntity } from '@shared/domain';
import { Counted, EntityId } from '@shared/domain/types';
import { AuthorizationLoaderService } from '@src/modules/authorization';
import { LessonRepo } from '../repository';

@Injectable()
export class LessonService implements AuthorizationLoaderService {
	constructor(
		private readonly lessonRepo: LessonRepo,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService
	) {}

	async deleteLesson(lesson: LessonEntity): Promise<void> {
		await this.filesStorageClientAdapterService.deleteFilesOfParent(lesson.id);

		await this.lessonRepo.delete(lesson);
	}

	async findById(lessonId: EntityId): Promise<LessonEntity> {
		return this.lessonRepo.findById(lessonId);
	}

	async findByCourseIds(courseIds: EntityId[], filters?: { hidden?: boolean }): Promise<Counted<LessonEntity[]>> {
		return this.lessonRepo.findAllByCourseIds(courseIds, filters);
	}

	async findAllLessonsByUserId(userId: EntityId): Promise<LessonEntity[]> {
		const lessons = await this.lessonRepo.findByUserId(userId);

		return lessons;
	}

	async deleteUserDataFromLessons(userId: EntityId): Promise<number> {
		const lessons = await this.lessonRepo.findByUserId(userId);

		const updatedLessons = lessons.map((lesson: LessonEntity) => {
			lesson.contents.map((c: ComponentProperties) => {
				if (c.user === userId) {
					c.user = '';
				}
				return c;
			});
			return lesson;
		});

		await this.lessonRepo.save(updatedLessons);

		return updatedLessons.length;
	}
}
