import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { StorageProvider } from '@shared/domain';
import { BaseRepo } from '../base.repo';

@Injectable()
export class StorageProviderRepo extends BaseRepo<StorageProvider> {
	constructor(protected readonly _em: EntityManager) {
		super(_em);
	}

	get entityName() {
		return StorageProvider;
	}

	async findAll(): Promise<StorageProvider[]> {
		const providers = this._em.find(StorageProvider, {});

		return providers;
	}
}
