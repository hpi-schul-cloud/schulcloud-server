import { Logger, Module } from '@nestjs/common';
import { CollaborativeStorageAdapterModule } from '@shared/infra/collaborative-storage/collaborative-storage-adapter.module';
import { TeamRepo } from '@shared/repo';
import { AuthorizationModule } from '@src/modules/authorization';
import { CollaborativeStorageService } from '@src/modules/collaborative-storage/services/collaborative-storage.service';
import { TeamMapper } from '@src/modules/collaborative-storage/mapper/team.mapper';
import { TeamPermissionsMapper } from '@src/modules/collaborative-storage/mapper/team-permissions.mapper';
import { LoggerModule } from '@src/core/logger';
import { RoleModule } from '@src/modules/role/role.module';
import { CollaborativeStorageUc } from './uc/collaborative-storage.uc';
import { CollaborativeStorageController } from './controller/collaborative-storage.controller';

@Module({
	imports: [CollaborativeStorageAdapterModule, AuthorizationModule, LoggerModule, Logger, RoleModule],
	providers: [TeamRepo, CollaborativeStorageUc, CollaborativeStorageService, TeamPermissionsMapper, TeamMapper],
	controllers: [CollaborativeStorageController],
	exports: [CollaborativeStorageUc],
})
export class CollaborativeStorageModule {}
