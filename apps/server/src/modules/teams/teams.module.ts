import { Module } from '@nestjs/common';
import { TeamsRepo } from '@shared/repo/teams/teams.repo';
import { TeamService } from './service/team.service';

@Module({
	providers: [TeamService, TeamsRepo],
	exports: [TeamService],
})
export class TeamsModule {}
