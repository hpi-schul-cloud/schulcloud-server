import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { FileEntity } from '../entity';
import { FilesRepo } from '../repo';

@Injectable()
export class FilesService {
	constructor(private readonly repo: FilesRepo) {}

	async findFilesAccessibleOrCreatedByUser(userId: EntityId): Promise<FileEntity[]> {
		return this.repo.findByPermissionRefIdOrCreatorId(userId);
	}

	async removeUserPermissionsOrCreatorReferenceToAnyFiles(userId: EntityId): Promise<number> {
		const entities = await this.repo.findByPermissionRefIdOrCreatorId(userId);

		if (entities.length === 0) {
			return 0;
		}

		entities.forEach((entity) => {
			entity.removePermissionsByRefId(userId);
			entity.removeCreatorId(userId);
		});

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
