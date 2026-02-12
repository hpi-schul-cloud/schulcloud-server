import { LegacyLogger, LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { PseudonymModule, PseudonymService } from '@modules/pseudonym';
import { ExternalToolService, ToolModule } from '@modules/tool';
import { UserModule, UserService } from '@modules/user';
import { HttpModule, HttpService } from '@nestjs/axios';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { InternalCollaborativeStorageAdapterConfig } from './collaborative-storage-adapter.config';
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
		configInjectionToken: string,
		configConstructor: new () => InternalCollaborativeStorageAdapterConfig
	): DynamicModule {
		return {
			module: CollaborativeStorageAdapterModule,
			imports: [
				HttpModule,
				LoggerModule,
				ToolModule,
				PseudonymModule,
				UserModule,
				ConfigurationModule.register(configInjectionToken, configConstructor),
			],
			providers: [
				CollaborativeStorageAdapter,
				CollaborativeStorageAdapterMapper,
				{
					provide: NextcloudStrategy,
					useFactory: (
						logger: LegacyLogger,
						client: NextcloudClient,
						pseudonymService: PseudonymService,
						externalToolService: ExternalToolService,
						userService: UserService,
						config: InternalCollaborativeStorageAdapterConfig
					): NextcloudStrategy =>
						new NextcloudStrategy(logger, client, pseudonymService, externalToolService, userService, config),
					inject: [
						LegacyLogger,
						NextcloudClient,
						PseudonymService,
						ExternalToolService,
						UserService,
						configInjectionToken,
					],
				},
				{
					provide: NextcloudClient,
					useFactory: (
						logger: LegacyLogger,
						httpService: HttpService,
						config: InternalCollaborativeStorageAdapterConfig
					): NextcloudClient => new NextcloudClient(logger, httpService, config),
					inject: [LegacyLogger, HttpService, configInjectionToken],
				},
				storageStrategy,
			],
			exports: [CollaborativeStorageAdapter],
		};
	}
}
