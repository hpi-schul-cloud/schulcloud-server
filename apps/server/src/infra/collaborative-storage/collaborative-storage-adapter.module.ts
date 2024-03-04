import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { PseudonymModule } from '@modules/pseudonym';
import { ToolModule } from '@modules/tool';
import { UserModule } from '@modules/user/user.module';
import { HttpModule } from '@nestjs/axios';
import { Module, Provider } from '@nestjs/common';
import { LtiToolRepo } from '@shared/repo/ltitool/';
import { LoggerModule } from '@src/core/logger';
import { CollaborativeStorageAdapter } from './collaborative-storage.adapter';
import { CollaborativeStorageAdapterMapper } from './mapper';
import { NextcloudClient } from './strategy/nextcloud/nextcloud.client';
import { NextcloudStrategy } from './strategy/nextcloud/nextcloud.strategy';

const storageStrategy: Provider = {
	provide: 'CollaborativeStorageStrategy',
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
