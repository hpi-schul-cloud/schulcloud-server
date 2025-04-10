import { Logger } from '@core/logger';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderService,
} from '@modules/authorization';
import {
	DataDeletedEvent,
	DataDeletionDomainOperationLoggable,
	DeletionService,
	DomainDeletionReport,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	StatusModel,
	UserDeletedEvent,
} from '@modules/deletion';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Counted, EntityId } from '@shared/domain/types';
import { LessonEntity, LessonRepo } from '../../repo';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class LessonService implements AuthorizationLoaderService, DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(
		private readonly lessonRepo: LessonRepo,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService,
		injectionService: AuthorizationInjectionService,
		private readonly logger: Logger,
		private readonly eventBus: EventBus,
		private readonly orm: MikroORM
	) {
		this.logger.setContext(LessonService.name);
		injectionService.injectReferenceLoader(AuthorizableReferenceType.Lesson, this);
	}

	@UseRequestContext()
	public async handle({ deletionRequestId, targetRefId }: UserDeletedEvent): Promise<void> {
		const dataDeleted = await this.deleteUserData(targetRefId);
		await this.eventBus.publish(new DataDeletedEvent(deletionRequestId, dataDeleted));
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
