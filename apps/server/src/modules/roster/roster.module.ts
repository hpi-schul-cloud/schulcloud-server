import { Module } from '@nestjs/common';
import { ConfigurationModule } from '@infra/configuration';
import { AuthorizationModule } from '@modules/authorization';
import { BoardModule } from '@modules/board';
import { CourseModule } from '@modules/course';
import { PseudonymModule } from '@modules/pseudonym';
import { RoomModule } from '@modules/room';
import { RoomMembershipModule } from '@modules/room-membership';
import { ToolModule } from '@modules/tool';
import { UserModule } from '@modules/user';
import { ROSTER_PUBLIC_API_CONFIG_TOKEN, RosterPublicApiConfig } from './roster.config';
import { FeathersRosterService } from './service';
import { RosterController } from './api/roster.controller';
import { RosterUc } from './api/roster.uc';

@Module({
	imports: [
		AuthorizationModule,
		BoardModule,
		CourseModule,
		ToolModule,
		PseudonymModule,
		RoomModule,
		RoomMembershipModule,
		UserModule,
		ConfigurationModule.register(ROSTER_PUBLIC_API_CONFIG_TOKEN, RosterPublicApiConfig),
	],
	providers: [FeathersRosterService, RosterUc],
	controllers: [RosterController],
	exports: [FeathersRosterService],
})
export class RosterModule {}
