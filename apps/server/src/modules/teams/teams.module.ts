import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TeamsRepo } from '@shared/repo/teams';
import { LoggerModule } from '@src/core/logger';
import { TeamAuthorisableService, TeamService } from './service';

@Module({
	imports: [CqrsModule, LoggerModule, AuthorizationModule],
	providers: [TeamService, TeamsRepo, TeamAuthorisableService],
	exports: [TeamService, TeamAuthorisableService],
})
export class TeamsModule {}
