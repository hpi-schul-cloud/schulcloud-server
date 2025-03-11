import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { TeamRepo } from '@modules/team/repo';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TeamAuthorisableService, TeamService } from './domain';

@Module({
	imports: [CqrsModule, LoggerModule, AuthorizationModule],
	providers: [TeamService, TeamRepo, TeamAuthorisableService],
	exports: [TeamService, TeamAuthorisableService],
})
export class TeamModule {}
