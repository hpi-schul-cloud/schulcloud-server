import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { TeamsRepo } from '@modules/teams/repo';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TeamAuthorisableService, TeamService } from './domain';

@Module({
	imports: [CqrsModule, LoggerModule, AuthorizationModule],
	providers: [TeamService, TeamsRepo, TeamAuthorisableService],
	exports: [TeamService, TeamAuthorisableService],
})
export class TeamsModule {}
