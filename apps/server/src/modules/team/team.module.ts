import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { SagaModule } from '@modules/saga';
import { TeamRepo } from '@modules/team/repo';
import { Module } from '@nestjs/common';
import { TeamAuthorisableService, TeamService } from './domain';
import { DeleteUserTeamDataStep } from './saga';

@Module({
	imports: [LoggerModule, AuthorizationModule, SagaModule],
	providers: [TeamService, TeamRepo, TeamAuthorisableService, DeleteUserTeamDataStep],
	exports: [TeamService, TeamAuthorisableService],
})
export class TeamModule {}
