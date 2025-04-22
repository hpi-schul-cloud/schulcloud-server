import { Logger } from '@core/logger';
import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderService,
} from '@modules/authorization';
import {
	DataDeletionDomainOperationLoggable,
	DeletionService,
	DomainDeletionReport,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	StatusModel,
	UserDeletionInjectionService,
} from '@modules/deletion';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { Counted, EntityId } from '@shared/domain/types';
import { LessonEntity, LessonRepo } from '../../repo';

@Injectable()
export class LessonService implements AuthorizationLoaderService, DeletionService {
	constructor(
		private readonly lessonRepo: LessonRepo,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService,
		injectionService: AuthorizationInjectionService,
		private readonly logger: Logger,
		userDeletionInjectionService: UserDeletionInjectionService
	) {
		this.logger.setContext(LessonService.name);
		injectionService.injectReferenceLoader(AuthorizableReferenceType.Lesson, this);
		userDeletionInjectionService.injectUserDeletionService(this);
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

	public async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from Lessons',
				DomainName.LESSONS,
				userId,
				StatusModel.PENDING
			)
		);
		const lessons = await this.lessonRepo.findByUserId(userId);
		const lessonIds = this.getLessonsId(lessons);

		const numberOfUpdatedLessons = await this.lessonRepo.removeUserReference(userId);

		const result = DomainDeletionReportBuilder.build(DomainName.LESSONS, [
			DomainOperationReportBuilder.build(OperationType.UPDATE, numberOfUpdatedLessons, lessonIds),
		]);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully removed user data from Classes',
				DomainName.LESSONS,
				userId,
				StatusModel.FINISHED,
				numberOfUpdatedLessons,
				0
			)
		);

		return result;
	}

	private getLessonsId(lessons: LessonEntity[]): EntityId[] {
		return lessons.map((lesson) => lesson.id);
	}
}
