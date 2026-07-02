import { CollaborativeStorageAdapterModule } from '@infra/collaborative-storage';
import { LoggerModule } from '@infra/logger';
import { AuthorizationModule } from '@modules/authorization';
import { RoleModule } from '@modules/role';
import { TeamRepo } from '@modules/team/repo';
import { Module } from '@nestjs/common';
import { COLLABORATIVE_STORAGE_CONFIG_TOKEN, CollaborativeStorageConfig } from './collaborative-storage.config';
import { CollaborativeStorageController } from './controller';
import { TeamMapper, TeamPermissionsMapper } from './mapper';
import { CollaborativeStorageService } from './services';
import { CollaborativeStorageUc } from './uc';

@Module({
	imports: [
		CollaborativeStorageAdapterModule.register(COLLABORATIVE_STORAGE_CONFIG_TOKEN, CollaborativeStorageConfig),
		AuthorizationModule,
		LoggerModule,
		RoleModule,
	],
	providers: [TeamRepo, CollaborativeStorageUc, CollaborativeStorageService, TeamPermissionsMapper, TeamMapper],
	controllers: [CollaborativeStorageController],
	exports: [CollaborativeStorageUc],
})
export class CollaborativeStorageModule {}
