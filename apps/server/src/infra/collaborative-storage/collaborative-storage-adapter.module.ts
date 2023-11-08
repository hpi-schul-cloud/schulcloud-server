import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { HttpModule } from '@nestjs/axios';
import { Module, Provider } from '@nestjs/common';
import { LtiToolRepo } from '@shared/repo/ltitool/';
import { LoggerModule } from '@src/core/logger';
import { ToolModule } from '@modules/tool';
import { PseudonymModule } from '@modules/pseudonym';
import { UserModule } from '@modules/user';
import { NextcloudStrategy } from './strategy/nextcloud/nextcloud.strategy';
import { NextcloudClient } from './strategy/nextcloud/nextcloud.client';
import { CollaborativeStorageAdapterMapper } from './mapper';
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
