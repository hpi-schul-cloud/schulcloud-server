import { ConfigurationModule } from '@infra/configuration';
import { BoardModule } from '@modules/board';
import { CourseModule } from '@modules/course';
import { PseudonymModule } from '@modules/pseudonym';
import { RoomModule } from '@modules/room';
import { RoomMembershipModule } from '@modules/room-membership';
import { ToolModule } from '@modules/tool';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { ROSTER_PUBLIC_API_CONFIG_TOKEN, RosterPublicApiConfig } from './roster.config';
import { FeathersRosterService } from './service';

@Module({
	imports: [
		PseudonymModule,
		UserModule,
		CourseModule,
		ToolModule,
		BoardModule,
		RoomModule,
		RoomMembershipModule,
		ConfigurationModule.register(ROSTER_PUBLIC_API_CONFIG_TOKEN, RosterPublicApiConfig),
	],
	providers: [FeathersRosterService],
	exports: [FeathersRosterService],
})
export class RosterModule {}
