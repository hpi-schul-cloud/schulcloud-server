import { Module } from '@nestjs/common';
import { CollaborativeStorageAdapterModule } from '@infra/collaborative-storage';
import { TeamsRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { RoleModule } from '@modules/role';
import { CollaborativeStorageService } from './services';
import { TeamPermissionsMapper, TeamMapper } from './mapper';
import { CollaborativeStorageController } from './controller';
import { CollaborativeStorageUc } from './uc';

@Module({
	imports: [CollaborativeStorageAdapterModule, AuthorizationModule, LoggerModule, RoleModule],
	providers: [TeamsRepo, CollaborativeStorageUc, CollaborativeStorageService, TeamPermissionsMapper, TeamMapper],
	controllers: [CollaborativeStorageController],
	exports: [CollaborativeStorageUc],
})
export class CollaborativeStorageModule {}
