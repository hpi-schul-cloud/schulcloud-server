import { Module } from '@nestjs/common';
import { TeamStorageAdapterModule } from '@shared/infra/team-storage/team-storage-adapter.module';
import { RoleRepo, TeamsRepo } from '@shared/repo';
import { TeamStorageAdapter } from '@shared/infra/team-storage';
import { TeamStorageUc } from './uc/team-storage.uc';
import { TeamStorageController } from './controller/team-storage.controller';

@Module({
	imports: [TeamStorageAdapterModule],
	providers: [RoleRepo, TeamsRepo, TeamStorageAdapter, TeamStorageUc],
	controllers: [TeamStorageController],
	exports: [TeamStorageUc],
})
export class TeamStorageModule {}
