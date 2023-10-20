import { Module } from '@nestjs/common';
import { CollaborativeStorageAdapterModule } from '@shared/infra/collaborative-storage/collaborative-storage-adapter.module';
import { TeamsRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { TeamPermissionsMapper } from '@modules/collaborative-storage/mapper/team-permissions.mapper';
import { TeamMapper } from '@modules/collaborative-storage/mapper/team.mapper';
import { CollaborativeStorageService } from '@modules/collaborative-storage/services/collaborative-storage.service';
import { RoleModule } from '@modules/role/role.module';
import { CollaborativeStorageController } from './controller/collaborative-storage.controller';
import { CollaborativeStorageUc } from './uc/collaborative-storage.uc';

@Module({
	imports: [CollaborativeStorageAdapterModule, AuthorizationModule, LoggerModule, RoleModule],
	providers: [TeamsRepo, CollaborativeStorageUc, CollaborativeStorageService, TeamPermissionsMapper, TeamMapper],
	controllers: [CollaborativeStorageController],
	exports: [CollaborativeStorageUc],
})
export class CollaborativeStorageModule {}
