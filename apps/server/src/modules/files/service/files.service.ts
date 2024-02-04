import { Injectable } from '@nestjs/common';
import { DomainName, EntityId, OperationType, StatusModel } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { DomainOperation } from '@shared/domain/interface';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { FileEntity } from '../entity';
import { FilesRepo } from '../repo';

@Injectable()
export class FilesService {
	constructor(private readonly repo: FilesRepo, private readonly logger: Logger) {
		this.logger.setContext(FilesService.name);
	}

	async findFilesAccessibleOrCreatedByUser(userId: EntityId): Promise<FileEntity[]> {
		return this.repo.findByPermissionRefIdOrCreatorId(userId);
	}

	async removeUserPermissionsOrCreatorReferenceToAnyFiles(userId: EntityId): Promise<DomainOperation> {
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

		const result = DomainOperationBuilder.build(
			DomainName.FILE,
			OperationType.UPDATE,
			numberOfUpdatedFiles,
			this.getFilesId(entities)
		);

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

	async markFilesOwnedByUserForDeletion(userId: EntityId): Promise<DomainOperation> {
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

		const result = DomainOperationBuilder.build(
			DomainName.FILE,
			OperationType.UPDATE,
			numberOfMarkedForDeletionFiles,
			this.getFilesId(entities)
		);

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

	private getFilesId(files: FileEntity[]): EntityId[] {
		return files.map((file) => file.id);
	}
}
