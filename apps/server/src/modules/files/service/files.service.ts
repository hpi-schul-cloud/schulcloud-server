import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { FileEntity } from '../entity';
import { FilesRepo } from '../repo';

@Injectable()
export class FilesService {
	constructor(private readonly repo: FilesRepo, private readonly logger: LegacyLogger) {
		this.logger.setContext(FilesService.name);
	}

	async findFilesAccessibleByUser(userId: EntityId): Promise<FileEntity[]> {
		return this.repo.findByPermissionRefId(userId);
	}

	async removeUserPermissionsToAnyFiles(userId: EntityId): Promise<number> {
		this.logger.log(`Deleting Permissions To Any Files for userId ${userId}`);
		const entities = await this.repo.findByPermissionRefId(userId);

		if (entities.length === 0) {
			return 0;
		}

		entities.forEach((entity) => entity.removePermissionsByRefId(userId));

		await this.repo.save(entities);

		const numberOfUpdatedFiles = entities.length;

		this.logger.log(`Successfully removed permissions for userId ${userId} for ${numberOfUpdatedFiles} files`);

		return numberOfUpdatedFiles;
	}

	async findFilesOwnedByUser(userId: EntityId): Promise<FileEntity[]> {
		return this.repo.findByOwnerUserId(userId);
	}

	async markFilesOwnedByUserForDeletion(userId: EntityId): Promise<number> {
		this.logger.log(`Marking Files For Deletion Owned By userId ${userId}`);
		const entities = await this.repo.findByOwnerUserId(userId);

		if (entities.length === 0) {
			return 0;
		}

		entities.forEach((entity) => entity.markForDeletion());

		await this.repo.save(entities);

		const numberOfMarkedForDeletionFiles = entities.length;

		this.logger.log(
			`Successfully marked for deletion ${numberOfMarkedForDeletionFiles} files owned by userId ${userId}`
		);

		return numberOfMarkedForDeletionFiles;
	}
}
