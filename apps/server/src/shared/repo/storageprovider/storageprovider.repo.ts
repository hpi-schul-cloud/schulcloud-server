import { Injectable } from '@nestjs/common';
import { StorageProvider } from '@shared/domain';
import { BaseRepo } from '../base.repo';

@Injectable()
export class StorageProviderRepo extends BaseRepo<StorageProvider> {
	protected get entityName() {
		return StorageProvider;
	}
}
