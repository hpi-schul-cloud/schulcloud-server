import { MikroORM, UseRequestContext } from '@mikro-orm/core';
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
import { Injectable } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { FileEntity } from '../entity';
import { FilesRepo } from '../repo';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class FilesService implements DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(
		private readonly repo: FilesRepo,
		private readonly logger: Logger,
		private readonly eventBus: EventBus,
		private readonly orm: MikroORM
	) {
		this.logger.setContext(FilesService.name);
	}

	@UseRequestContext()
	public async handle({ deletionRequestId, targetRefId }: UserDeletedEvent): Promise<void> {
		const dataDeleted = await this.deleteUserData(targetRefId);
		await this.eventBus.publish(new DataDeletedEvent(deletionRequestId, dataDeleted));
	}

	async findFilesAccessibleOrCreatedByUser(userId: EntityId): Promise<FileEntity[]> {
		return this.repo.findByPermissionRefIdOrCreatorId(userId);
	}

	async removeUserPermissionsOrCreatorReferenceToAnyFiles(userId: EntityId): Promise<DomainDeletionReport> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from Files',
				DomainName.FILE,
				userId,
				StatusModel.PENDING
			)
		);
		const entities = await this.repo.findByPermissionRefIdOrCreatorId(userId);

		entities.forEach((entity) => {
			entity.removePermissionsByRefId(userId);
			entity.removeCreatorId(userId);
		});

		await this.repo.save(entities);

		const numberOfUpdatedFiles = entities.length;

		const result = DomainDeletionReportBuilder.build(DomainName.FILE, [
			DomainOperationReportBuilder.build(OperationType.UPDATE, numberOfUpdatedFiles, this.getFilesId(entities)),
		]);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully removed user data from Files',
				DomainName.FILE,
				userId,
				StatusModel.FINISHED,
				numberOfUpdatedFiles,
				0
			)
		);

		return result;
	}

	async findFilesOwnedByUser(userId: EntityId): Promise<FileEntity[]> {
		return this.repo.findByOwnerUserId(userId);
	}

	async markFilesOwnedByUserForDeletion(userId: EntityId): Promise<DomainDeletionReport> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Marking user files to deletion',
				DomainName.FILE,
				userId,
				StatusModel.PENDING
			)
		);
		const entities = await this.repo.findByOwnerUserId(userId);

		entities.forEach((entity) => entity.markForDeletion());

		await this.repo.save(entities);

		const numberOfMarkedForDeletionFiles = entities.length;

		const result = DomainDeletionReportBuilder.build(DomainName.FILE, [
			DomainOperationReportBuilder.build(
				OperationType.UPDATE,
				numberOfMarkedForDeletionFiles,
				this.getFilesId(entities)
			),
		]);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully marked user files for deletion',
				DomainName.FILE,
				userId,
				StatusModel.FINISHED,
				numberOfMarkedForDeletionFiles,
				0
			)
		);

		return result;
	}

	public async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
		const [markedFilesForDeletion, removedUserPermissionsToFiles] = await Promise.all([
			this.markFilesOwnedByUserForDeletion(userId),
			this.removeUserPermissionsOrCreatorReferenceToAnyFiles(userId),
		]);

		const modifiedFilesCount =
			markedFilesForDeletion.operations[0].count + removedUserPermissionsToFiles.operations[0].count;
		const modifiedFilesRef = [
			...markedFilesForDeletion.operations[0].refs,
			...removedUserPermissionsToFiles.operations[0].refs,
		];

		const result = DomainDeletionReportBuilder.build(DomainName.FILE, [
			DomainOperationReportBuilder.build(OperationType.UPDATE, modifiedFilesCount, modifiedFilesRef),
		]);

		return result;
	}

	private getFilesId(files: FileEntity[]): EntityId[] {
		return files.map((file) => file.id);
	}
}
