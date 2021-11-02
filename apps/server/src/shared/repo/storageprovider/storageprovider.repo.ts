import { Injectable } from '@nestjs/common';
import { StorageProvider, EntityId } from '@shared/domain';
import { BaseRepo } from '../base.repo';

@Injectable()
export class StorageProviderRepo extends BaseRepo<StorageProvider> {
	async findOneById(id: EntityId): Promise<StorageProvider> {
		const storageProvider = await this.em.findOneOrFail(StorageProvider, id);
		return storageProvider;
	}
}
