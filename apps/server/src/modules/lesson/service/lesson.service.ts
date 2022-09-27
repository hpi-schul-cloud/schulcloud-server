import { Injectable } from '@nestjs/common';
import { EntityId, Lesson } from '@shared/domain';
import { LessonRepo } from '@shared/repo';
import { FileParamBuilder, FilesStorageClientAdapterService } from '@src/modules/files-storage-client';

@Injectable()
export class LessonService {
	constructor(
		private readonly lessonRepo: LessonRepo,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService
	) {}

	async deleteLesson(lesson: Lesson, jwt: string): Promise<void> {
		const params = FileParamBuilder.build(jwt, lesson.getSchoolId(), lesson);
		await this.filesStorageClientAdapterService.deleteFilesOfParent(params);

		await this.lessonRepo.delete(lesson);
	}

	async findById(lessonId: EntityId): Promise<Lesson> {
		return this.lessonRepo.findById(lessonId);
	}
}
