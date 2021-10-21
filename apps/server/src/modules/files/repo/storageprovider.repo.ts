import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { StorageProvider, EntityId } from '@shared/domain';

@Injectable()
export class StorageProviderRepo extends BaseRepo<StorageProvider> {
	async findOneById(id: EntityId): Promise<StorageProvider> {
		const storageProvider = await this.em.findOneOrFail(StorageProvider, id);
		return storageProvider;
	}
}
