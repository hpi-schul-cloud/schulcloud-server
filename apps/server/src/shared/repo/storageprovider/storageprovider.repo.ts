import { Injectable } from '@nestjs/common';
import { StorageProvider } from '@shared/domain';
import { BaseRepo } from '../base.repo';

@Injectable()
export class StorageProviderRepo extends BaseRepo<StorageProvider> {
	get entityName() {
		return StorageProvider;
	}

	// Temporary functionality for migration to new fileservice
	// TODO: Remove when BC-1496 is done!
	public async findAll() {
		const result = await this._em.find(this.entityName, {});
		return result;
	}
}
