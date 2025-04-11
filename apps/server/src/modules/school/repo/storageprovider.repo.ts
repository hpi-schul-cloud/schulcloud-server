import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { StorageProviderEntity } from './storageprovider.entity';

@Injectable()
export class StorageProviderRepo extends BaseRepo<StorageProviderEntity> {
	constructor(protected readonly _em: EntityManager) {
		super(_em);
	}

	get entityName() {
		return StorageProviderEntity;
	}

	async findAll(): Promise<StorageProviderEntity[]> {
		const providers = this._em.find(StorageProviderEntity, {});

		return providers;
	}
}
