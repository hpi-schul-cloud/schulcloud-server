import { Module } from '@nestjs/common';
import { TeamsRepo } from '@shared/repo';
import { TeamService } from './service';

@Module({
	providers: [TeamService, TeamsRepo],
	exports: [TeamService],
})
export class TeamsModule {}
