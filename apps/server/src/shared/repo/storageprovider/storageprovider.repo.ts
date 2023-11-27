import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { StorageProviderEntity } from '@shared/domain';
import { BaseRepo } from '../base.repo';

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
