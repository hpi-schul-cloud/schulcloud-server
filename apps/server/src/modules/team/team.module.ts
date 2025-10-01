import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { SagaModule } from '@modules/saga';
import { TeamRepo } from '@modules/team/repo';
import { Module } from '@nestjs/common';
import { TeamAuthorisableService, TeamService } from './domain';
import { DeleteUserTeamDataStep } from './saga';
import { UserChangedSchoolHandlerService } from './service/user-changed-school-handler.service';

@Module({
	imports: [LoggerModule, AuthorizationModule, SagaModule],
	providers: [TeamService, TeamRepo, TeamAuthorisableService, DeleteUserTeamDataStep, UserChangedSchoolHandlerService],
	exports: [TeamService, TeamAuthorisableService],
})
export class TeamModule {}
