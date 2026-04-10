import { TeamModule } from '@modules/team/team.module';
import { Module } from '@nestjs/common';
import { TeamController, TeamExportUc } from './api';

@Module({
	imports: [TeamModule],
	providers: [TeamExportUc],
	controllers: [TeamController],
	exports: [],
})
export class TeamApiModule {}
