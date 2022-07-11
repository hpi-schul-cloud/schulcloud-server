import { Logger, Module } from '@nestjs/common';
import { CollaborativeStorageAdapterModule } from '@shared/infra/collaborative-storage/collaborative-storage-adapter.module';
import { RoleRepo, TeamsRepo } from '@shared/repo';
import { AuthorizationModule } from '@src/modules/authorization';
import { CollaborativeStorageService } from '@src/modules/collaborative-storage/services/collaborative-storage.service';
import { RoleMapper } from '@src/modules/collaborative-storage/mapper/role.mapper';
import { TeamMapper } from '@src/modules/collaborative-storage/mapper/team.mapper';
import { TeamPermissionsMapper } from '@src/modules/collaborative-storage/mapper/team-permissions.mapper';
import { LoggerModule } from '@src/core/logger';
import { CollaborativeStorageUc } from './uc/collaborative-storage.uc';
import { CollaborativeStorageController } from './controller/collaborative-storage.controller';

@Module({
	imports: [CollaborativeStorageAdapterModule, AuthorizationModule, LoggerModule, Logger],
	providers: [
		RoleRepo,
		TeamsRepo,
		CollaborativeStorageUc,
		CollaborativeStorageService,
		TeamPermissionsMapper,
		RoleMapper,
		TeamMapper,
	],
	controllers: [CollaborativeStorageController],
	exports: [CollaborativeStorageUc],
})
export class CollaborativeStorageModule {}
