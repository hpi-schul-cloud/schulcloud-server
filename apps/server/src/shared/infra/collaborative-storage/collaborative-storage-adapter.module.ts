import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { HttpModule } from '@nestjs/axios';
import { Module, Provider } from '@nestjs/common';
import { LtiToolRepo } from '@shared/repo/ltitool/ltitool.repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { PseudonymModule } from '@src/modules/pseudonym/pseudonym.module';
import { ToolModule } from '@src/modules/tool/tool.module';
import { UserModule } from '@src/modules/user/user.module';
import { CollaborativeStorageAdapter } from './collaborative-storage.adapter';
import { CollaborativeStorageAdapterMapper } from './mapper/collaborative-storage-adapter.mapper';
import { NextcloudClient } from './strategy/nextcloud/nextcloud.client';
import { NextcloudStrategy } from './strategy/nextcloud/nextcloud.strategy';

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
