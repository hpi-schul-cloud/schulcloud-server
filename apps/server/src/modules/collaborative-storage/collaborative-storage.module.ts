import { LoggerModule } from '@core/logger';
import {
	COLLABORATIVE_STORAGE_ADAPTER_CONFIG_TOKEN,
	CollaborativeStorageAdapterConfig,
	CollaborativeStorageAdapterModule,
} from '@infra/collaborative-storage';
import { AuthorizationModule } from '@modules/authorization';
import { RoleModule } from '@modules/role';
import { TeamRepo } from '@modules/team/repo';
import { Module } from '@nestjs/common';
import { CollaborativeStorageController } from './controller';
import { TeamMapper, TeamPermissionsMapper } from './mapper';
import { CollaborativeStorageService } from './services';
import { CollaborativeStorageUc } from './uc';

@Module({
	imports: [
		CollaborativeStorageAdapterModule.register(
			COLLABORATIVE_STORAGE_ADAPTER_CONFIG_TOKEN,
			CollaborativeStorageAdapterConfig
		),
		AuthorizationModule,
		LoggerModule,
		RoleModule,
	],
	providers: [TeamRepo, CollaborativeStorageUc, CollaborativeStorageService, TeamPermissionsMapper, TeamMapper],
	controllers: [CollaborativeStorageController],
	exports: [CollaborativeStorageUc],
})
export class CollaborativeStorageModule {}
