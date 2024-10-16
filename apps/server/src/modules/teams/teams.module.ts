import { Module } from '@nestjs/common';
import { TeamsRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { CqrsModule } from '@nestjs/cqrs';
import { TeamAuthorisableService, TeamService } from './service';
import { AuthorizationModule } from '../authorization';

@Module({
	imports: [CqrsModule, LoggerModule, AuthorizationModule],
	providers: [TeamService, TeamsRepo, TeamAuthorisableService],
	exports: [TeamService, TeamAuthorisableService],
})
export class TeamsModule {}
