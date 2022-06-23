import { Module } from '@nestjs/common';
import { CollaborativeStorageAdapterModule } from '@shared/infra/collaborative-storage/collaborative-storage-adapter.module';
import { RoleRepo, TeamsRepo } from '@shared/repo';
import { AuthorizationModule } from '@src/modules/authorization';
import { CollaborativeStorageService } from '@src/modules/collaborative-storage/services/collaborative-storage.service';
import { RoleMapper } from '@src/modules/collaborative-storage/mapper/role.mapper';
import { TeamMapper } from '@src/modules/collaborative-storage/mapper/team.mapper';
import { TeamPermissionsMapper } from '@src/modules/collaborative-storage/mapper/team-permissions.mapper';
import { RoleDto } from '@src/modules/collaborative-storage/services/dto/role.dto';
import { CollaborativeStorageUc } from './uc/collaborative-storage.uc';
import { CollaborativeStorageController } from './controller/collaborative-storage.controller';

@Module({
	imports: [CollaborativeStorageAdapterModule, AuthorizationModule],
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
	exports: [CollaborativeStorageUc, RoleDto],
})
export class CollaborativeStorageModule {}
