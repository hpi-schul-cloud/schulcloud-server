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
		this.logger.log({ action: 'Deleting Permissions To Any Files for user ', userId });
		const entities = await this.repo.findByPermissionRefId(userId);

		if (entities.length === 0) {
			return 0;
		}

		entities.forEach((entity) => entity.removePermissionsByRefId(userId));

		await this.repo.save(entities);

		this.logger.log({ action: 'Deleted Permissions To Any Files for user ', userId });

		return entities.length;
	}

	async findFilesOwnedByUser(userId: EntityId): Promise<FileEntity[]> {
		return this.repo.findByOwnerUserId(userId);
	}

	async markFilesOwnedByUserForDeletion(userId: EntityId): Promise<number> {
		this.logger.log({ action: 'Marking Files For Deletion Owned By user ', userId });
		const entities = await this.repo.findByOwnerUserId(userId);

		if (entities.length === 0) {
			return 0;
		}

		entities.forEach((entity) => entity.markForDeletion());

		await this.repo.save(entities);

		this.logger.log({ action: 'Marked Files For Deletion Owned By user ', userId });

		return entities.length;
	}
}
