import { Module } from '@nestjs/common';
import { TeamsRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { CqrsModule } from '@nestjs/cqrs';
import { TeamAuthorisableService, TeamService } from './service';

@Module({
	imports: [CqrsModule, LoggerModule],
	providers: [TeamService, TeamsRepo, TeamAuthorisableService],
	exports: [TeamService, TeamAuthorisableService],
})
export class TeamsModule {}
