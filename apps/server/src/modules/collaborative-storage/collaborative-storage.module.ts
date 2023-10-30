import { Module } from '@nestjs/common';
import { CollaborativeStorageAdapterModule } from '@shared/infra/collaborative-storage/collaborative-storage-adapter.module';
import { TeamsRepo } from '@shared/repo/teams/teams.repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { RoleModule } from '../role/role.module';
import { CollaborativeStorageController } from './controller/collaborative-storage.controller';
import { TeamPermissionsMapper } from './mapper/team-permissions.mapper';
import { TeamMapper } from './mapper/team.mapper';
import { CollaborativeStorageService } from './services/collaborative-storage.service';
import { CollaborativeStorageUc } from './uc/collaborative-storage.uc';

@Module({
	imports: [CollaborativeStorageAdapterModule, AuthorizationModule, LoggerModule, RoleModule],
	providers: [TeamsRepo, CollaborativeStorageUc, CollaborativeStorageService, TeamPermissionsMapper, TeamMapper],
	controllers: [CollaborativeStorageController],
	exports: [CollaborativeStorageUc],
})
export class CollaborativeStorageModule {}
