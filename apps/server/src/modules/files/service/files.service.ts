import { Injectable } from '@nestjs/common';

import { EntityId } from '@shared/domain';

import { FilesRepo } from '../repo';

@Injectable()
export class FilesService {
	constructor(private readonly filesRepo: FilesRepo) {}

	async markFilesOwnedByUserForDeletion(userId: EntityId): Promise<number> {
		const entities = await this.filesRepo.findByOwnerUserId(userId);

		entities.filter((entity) => entity.markForDeletion());

		await this.filesRepo.save(entities);

		return entities.length;
	}
}
