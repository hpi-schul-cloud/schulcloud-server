import { TeamModule } from '@modules/team/team.module';
import { Module } from '@nestjs/common';
import { TeamController, TeamExportUc } from './api';
import { AuthorizationModule } from '@modules/authorization';

@Module({
	imports: [TeamModule, AuthorizationModule],
	providers: [TeamExportUc],
	controllers: [TeamController],
	exports: [],
})
export class TeamApiModule {}
