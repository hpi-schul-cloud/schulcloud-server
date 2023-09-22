import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { FilesRepo } from '../repo';
import { FileEntity } from '../entity';

@Injectable()
export class FilesService {
	constructor(private readonly repo: FilesRepo) {}

	async findFilesAccessibleByUser(userId: EntityId): Promise<FileEntity[]> {
		return this.repo.findByPermissionRefId(userId);
	}

	async removeUserPermissionsToAnyFiles(userId: EntityId): Promise<number> {
		const entities = await this.repo.findByPermissionRefId(userId);

		if (entities.length === 0) {
			return 0;
		}

		entities.forEach((entity) => entity.removePermissionsByRefId(userId));

		await this.repo.save(entities);

		return entities.length;
	}

	async findFilesOwnedByUser(userId: EntityId): Promise<FileEntity[]> {
		return this.repo.findByOwnerUserId(userId);
	}

	async markFilesOwnedByUserForDeletion(userId: EntityId): Promise<number> {
		const entities = await this.repo.findByOwnerUserId(userId);

		if (entities.length === 0) {
			return 0;
		}

		entities.forEach((entity) => entity.markForDeletion());

		await this.repo.save(entities);

		return entities.length;
	}
}
