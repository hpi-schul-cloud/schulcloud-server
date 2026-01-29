import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { PseudonymModule } from '@modules/pseudonym';
import { ToolModule } from '@modules/tool';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { CollaborativeStorageAdapterConfig } from './collaborative-storage-adapter.config';
import { CollaborativeStorageAdapter } from './collaborative-storage.adapter';
import { CollaborativeStorageAdapterMapper } from './mapper';
import { NextcloudClient } from './strategy/nextcloud/nextcloud.client';
import { NextcloudStrategy } from './strategy/nextcloud/nextcloud.strategy';

const storageStrategy: Provider = {
	provide: 'CollaborativeStorageStrategy',
	useExisting: NextcloudStrategy,
};

@Module({})
export class CollaborativeStorageAdapterModule {
	public static register(
		injectionToken: string,
		Constructor: new () => CollaborativeStorageAdapterConfig
	): DynamicModule {
		return {
			module: CollaborativeStorageAdapterModule,
			imports: [
				HttpModule,
				LoggerModule,
				ToolModule,
				PseudonymModule,
				UserModule,
				ConfigurationModule.register(injectionToken, Constructor),
			],
			providers: [
				CollaborativeStorageAdapter,
				CollaborativeStorageAdapterMapper,
				NextcloudStrategy,
				NextcloudClient,
				storageStrategy,
			],
			exports: [CollaborativeStorageAdapter],
		};
	}
}
