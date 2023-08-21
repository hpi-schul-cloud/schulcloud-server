import { Injectable } from '@nestjs/common';

import { EntityId } from '@shared/domain';

import { FilesRepo } from '../repo';

@Injectable()
export class FilesService {
	constructor(private readonly filesRepo: FilesRepo) {}

	async markFilesOwnedByUserForDeletion(userId: EntityId): Promise<number> {
		const entities = await this.filesRepo.findByOwnerUserId(userId);

		if (entities.length === 0) {
			return 0;
		}

		entities.forEach((entity) => entity.markForDeletion());

		await this.filesRepo.save(entities);

		return entities.length;
	}
}
