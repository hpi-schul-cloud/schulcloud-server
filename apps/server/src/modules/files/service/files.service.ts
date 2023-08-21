import { Injectable } from '@nestjs/common';

import { EntityId } from '@shared/domain';

import { FilesRepo } from '../repo';

@Injectable()
export class FilesService {
	constructor(private readonly repo: FilesRepo) {}

	async removeUserPermissionsToAnyFiles(userId: EntityId): Promise<number> {
		const entities = await this.repo.findByPermissionRefId(userId);

		if (entities.length === 0) {
			return 0;
		}

		entities.forEach((entity) => entity.removePermissionsByRefId(userId));

		await this.repo.save(entities);

		return entities.length;
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
