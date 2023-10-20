import { Injectable } from '@nestjs/common';
import { Counted, EntityId, Lesson } from '@shared/domain';
import { LessonRepo } from '@shared/repo';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';

@Injectable()
export class LessonService {
	constructor(
		private readonly lessonRepo: LessonRepo,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService
	) {}

	async deleteLesson(lesson: Lesson): Promise<void> {
		await this.filesStorageClientAdapterService.deleteFilesOfParent(lesson.id);

		await this.lessonRepo.delete(lesson);
	}

	async findById(lessonId: EntityId): Promise<Lesson> {
		return this.lessonRepo.findById(lessonId);
	}

	async findByCourseIds(courseIds: EntityId[]): Promise<Counted<Lesson[]>> {
		return this.lessonRepo.findAllByCourseIds(courseIds);
	}
}
