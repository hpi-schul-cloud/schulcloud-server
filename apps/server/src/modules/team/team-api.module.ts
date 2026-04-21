import { TeamModule } from '@modules/team/team.module';
import { Module } from '@nestjs/common';
import { TeamController, TeamExportUc } from './api';
import { AuthorizationModule } from '@modules/authorization';
import { ConfigurationModule } from '@infra/configuration';
import { TEAM_PUBLIC_API_CONFIG_TOKEN, TeamPublicApiConfig } from './team.config';
import { RoomModule } from '@modules/room';
import { RoomMembershipModule } from '@modules/room-membership';

@Module({
	imports: [
		TeamModule,
		RoomModule,
		RoomMembershipModule,
		AuthorizationModule,
		ConfigurationModule.register(TEAM_PUBLIC_API_CONFIG_TOKEN, TeamPublicApiConfig),
	],
	providers: [TeamExportUc],
	controllers: [TeamController],
	exports: [],
})
export class TeamApiModule {}
