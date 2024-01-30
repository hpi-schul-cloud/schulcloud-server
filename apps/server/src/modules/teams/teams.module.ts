import { Module } from '@nestjs/common';
import { TeamsRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { TeamService } from './service';

@Module({
	imports: [LoggerModule],
	providers: [TeamService, TeamsRepo],
	exports: [TeamService],
})
export class TeamsModule {}
