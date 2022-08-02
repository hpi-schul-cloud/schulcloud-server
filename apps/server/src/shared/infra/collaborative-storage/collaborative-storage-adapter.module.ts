import { Module } from '@nestjs/common';
import { NextcloudStrategy } from '@shared/infra/collaborative-storage/strategy/nextcloud/nextcloud.strategy';
import { CollaborativeStorageAdapterMapper } from '@shared/infra/collaborative-storage/mapper/collaborative-storage-adapter.mapper';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '@src/core/logger';
import { NextcloudClient } from '@shared/infra/collaborative-storage/strategy/nextcloud/nextcloud.client';
import { PseudonymsRepo } from '@shared/repo/index';
import { CollaborativeStorageAdapter } from './collaborative-storage.adapter';

const storageStrategy = {
	provide: 'ICollaborativeStorageStrategy',
	useExisting: NextcloudStrategy,
};

@Module({
	imports: [HttpModule, LoggerModule],
	providers: [
		CollaborativeStorageAdapter,
		CollaborativeStorageAdapterMapper,
		PseudonymsRepo,
		NextcloudStrategy,
		NextcloudClient,
		storageStrategy,
	],
	exports: [CollaborativeStorageAdapter],
})
export class CollaborativeStorageAdapterModule {}
