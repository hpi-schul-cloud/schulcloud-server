import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { TeamRepo } from '@modules/team/repo';
import { Module } from '@nestjs/common';
import { TeamAuthorisableService, TeamService } from './domain';
import { DeletionModule } from '@modules/deletion';

@Module({
	imports: [LoggerModule, AuthorizationModule, DeletionModule],
	providers: [TeamService, TeamRepo, TeamAuthorisableService],
	exports: [TeamService, TeamAuthorisableService],
})
export class TeamModule {}
