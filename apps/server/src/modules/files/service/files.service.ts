import { Injectable } from '@nestjs/common';
import { DomainModel, EntityId, StatusModel } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
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

	async removeUserPermissionsOrCreatorReferenceToAnyFiles(userId: EntityId): Promise<number> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from Files',
				DomainModel.FILE,
				userId,
				StatusModel.PENDING
			)
		);
		const entities = await this.repo.findByPermissionRefIdOrCreatorId(userId);

		if (entities.length === 0) {
			return 0;
		}

		entities.forEach((entity) => {
			entity.removePermissionsByRefId(userId);
			entity.removeCreatorId(userId);
		});

		await this.repo.save(entities);

		const numberOfUpdatedFiles = entities.length;

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully removed user data from Files',
				DomainModel.FILE,
				userId,
				StatusModel.FINISHED,
				numberOfUpdatedFiles,
				0
			)
		);

		return numberOfUpdatedFiles;
	}

	async findFilesOwnedByUser(userId: EntityId): Promise<FileEntity[]> {
		return this.repo.findByOwnerUserId(userId);
	}

	async markFilesOwnedByUserForDeletion(userId: EntityId): Promise<number> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Marking user files to deletion',
				DomainModel.FILE,
				userId,
				StatusModel.PENDING
			)
		);
		const entities = await this.repo.findByOwnerUserId(userId);

		if (entities.length === 0) {
			return 0;
		}

		entities.forEach((entity) => entity.markForDeletion());

		await this.repo.save(entities);

		const numberOfMarkedForDeletionFiles = entities.length;

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully marked user files for deletion',
				DomainModel.FILE,
				userId,
				StatusModel.FINISHED,
				numberOfMarkedForDeletionFiles,
				0
			)
		);

		return numberOfMarkedForDeletionFiles;
	}
}
