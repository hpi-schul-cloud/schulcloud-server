import { LoggerModule } from '@infra/logger';
import { AuthorizationModule } from '@modules/authorization';
import { TeamRepo } from '@modules/team/repo';
import { Module } from '@nestjs/common';
import { TeamAuthorisableService, TeamService } from './domain';

@Module({
	imports: [LoggerModule, AuthorizationModule],
	providers: [TeamService, TeamRepo, TeamAuthorisableService],
	exports: [TeamService, TeamAuthorisableService],
})
export class TeamModule {}
