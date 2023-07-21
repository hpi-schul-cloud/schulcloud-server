import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { HttpModule } from '@nestjs/axios';
import { Module, Provider } from '@nestjs/common';
import { CollaborativeStorageAdapterMapper } from '@shared/infra/collaborative-storage/mapper/collaborative-storage-adapter.mapper';
import { NextcloudClient } from '@shared/infra/collaborative-storage/strategy/nextcloud/nextcloud.client';
import { NextcloudStrategy } from '@shared/infra/collaborative-storage/strategy/nextcloud/nextcloud.strategy';
import { LtiToolRepo } from '@shared/repo/ltitool/';
import { LoggerModule } from '@src/core/logger';
import { ToolModule } from '@src/modules/tool';
import { PseudonymModule } from '@src/modules/pseudonym';
import { UserModule } from '@src/modules/user';
import { CollaborativeStorageAdapter } from './collaborative-storage.adapter';

const storageStrategy: Provider = {
	provide: 'ICollaborativeStorageStrategy',
	useExisting: NextcloudStrategy,
};

@Module({
	imports: [HttpModule, LoggerModule, ToolModule, PseudonymModule, UserModule],
	providers: [
		CollaborativeStorageAdapter,
		CollaborativeStorageAdapterMapper,
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
