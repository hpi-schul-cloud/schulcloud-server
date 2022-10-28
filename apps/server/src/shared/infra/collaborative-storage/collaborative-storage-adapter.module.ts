import { Module, Provider } from '@nestjs/common';
import { NextcloudStrategy } from '@shared/infra/collaborative-storage/strategy/nextcloud/nextcloud.strategy';
import { CollaborativeStorageAdapterMapper } from '@shared/infra/collaborative-storage/mapper/collaborative-storage-adapter.mapper';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '@src/core/logger';
import { NextcloudClient } from '@shared/infra/collaborative-storage/strategy/nextcloud/nextcloud.client';
import { PseudonymsRepo } from '@shared/repo/';
import { LtiToolRepo } from '@shared/repo/ltitool/';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { CollaborativeStorageAdapter } from './collaborative-storage.adapter';

const storageStrategy: Provider = {
	provide: 'ICollaborativeStorageStrategy',
	useExisting: NextcloudStrategy,
};

@Module({
	imports: [HttpModule, LoggerModule],
	providers: [
		CollaborativeStorageAdapter,
		CollaborativeStorageAdapterMapper,
		PseudonymsRepo,
		LtiToolRepo,
		NextcloudStrategy,
		NextcloudClient,
		storageStrategy,
		{
			provide: 'oidcInternalName',
			useValue: Configuration.get('NEXTCLOUD_SOCIALLOGIN_OIDC_INTERNAL_NAME') as string,
		},
	],
	exports: [CollaborativeStorageAdapter],
})
export class CollaborativeStorageAdapterModule {}
