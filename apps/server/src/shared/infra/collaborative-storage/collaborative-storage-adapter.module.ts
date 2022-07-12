import { Logger, Module } from '@nestjs/common';
import { NextcloudStrategy } from '@shared/infra/collaborative-storage/strategy/nextcloud.strategy';
import { CollaborativeStorageAdapterMapper } from '@shared/infra/collaborative-storage/mapper/collaborative-storage-adapter.mapper';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '@src/core/logger';
import { CollaborativeStorageAdapter } from './collaborative-storage.adapter';

@Module({
	imports: [HttpModule, LoggerModule, Logger],
	providers: [
		CollaborativeStorageAdapter,
		CollaborativeStorageAdapterMapper,
		{
			provide: 'ICollaborativeStorageStrategy',
			useClass: NextcloudStrategy,
		},
	],
	exports: [CollaborativeStorageAdapter],
})
export class CollaborativeStorageAdapterModule {}
