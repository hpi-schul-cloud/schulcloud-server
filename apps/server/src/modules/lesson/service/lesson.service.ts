import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { ComponentProperties, LessonEntity } from '@shared/domain/entity';
import { Counted, DomainModel, EntityId, StatusModel } from '@shared/domain/types';
import { AuthorizationLoaderService } from '@src/modules/authorization';
import { Logger } from '@src/core/logger';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { LessonRepo } from '../repository';

@Injectable()
export class LessonService implements AuthorizationLoaderService {
	constructor(
		private readonly lessonRepo: LessonRepo,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService,
		private readonly logger: Logger
	) {
		this.logger.setContext(LessonService.name);
	}

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
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from Lessons',
				DomainModel.LESSONS,
				userId,
				StatusModel.PENDING
			)
		);
		const lessons = await this.lessonRepo.findByUserId(userId);

		const updatedLessons = lessons.map((lesson: LessonEntity) => {
			lesson.contents.map((c: ComponentProperties) => {
				if (c.user === userId) {
					c.user = undefined;
				}
				return c;
			});
			return lesson;
		});

		await this.lessonRepo.save(updatedLessons);

		const numberOfUpdatedLessons = updatedLessons.length;

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully removed user data from Classes',
				DomainModel.LESSONS,
				userId,
				StatusModel.FINISHED,
				numberOfUpdatedLessons,
				0
			)
		);

		return numberOfUpdatedLessons;
	}
}
