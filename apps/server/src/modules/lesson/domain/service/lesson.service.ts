import { Logger } from '@core/logger';
import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderService,
} from '@modules/authorization';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { Counted, EntityId } from '@shared/domain/types';
import { LessonEntity, LessonRepo } from '../../repo';

@Injectable()
export class LessonService implements AuthorizationLoaderService {
	constructor(
		private readonly lessonRepo: LessonRepo,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService,
		injectionService: AuthorizationInjectionService,
		private readonly logger: Logger
	) {
		this.logger.setContext(LessonService.name);
		injectionService.injectReferenceLoader(AuthorizableReferenceType.Lesson, this);
	}

	public async deleteLesson(lesson: LessonEntity): Promise<void> {
		await this.filesStorageClientAdapterService.deleteFilesOfParent(lesson.id);

		await this.lessonRepo.delete(lesson);
	}

	public async findById(lessonId: EntityId): Promise<LessonEntity> {
		const lesson = await this.lessonRepo.findById(lessonId);

		return lesson;
	}

	public async findByCourseIds(
		courseIds: EntityId[],
		filters?: { hidden?: boolean }
	): Promise<Counted<LessonEntity[]>> {
		const lessons = await this.lessonRepo.findAllByCourseIds(courseIds, filters);

		return lessons;
	}

	public async findAllLessonsByUserId(userId: EntityId): Promise<LessonEntity[]> {
		const lessons = await this.lessonRepo.findByUserId(userId);

		return lessons;
	}
}
