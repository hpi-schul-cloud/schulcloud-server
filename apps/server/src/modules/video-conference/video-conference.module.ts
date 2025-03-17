import { LoggerModule } from '@core/logger';
import { CalendarModule } from '@infra/calendar';
import { AuthorizationModule } from '@modules/authorization';
import { AuthorizationReferenceModule } from '@modules/authorization-reference/authorization-reference.module';
import { BoardModule } from '@modules/board';
import { CourseModule } from '@modules/course';
import { LegacySchoolModule } from '@modules/legacy-school';
import { RoleModule } from '@modules/role';
import { RoomModule } from '@modules/room';
import { RoomMembershipModule } from '@modules/room-membership';
import { TeamRepo } from '@modules/team/repo';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { BBBService } from './bbb';
import { VideoConferenceDeprecatedController } from './controller';
import { VideoConferenceRepo } from './repo';
import { VideoConferenceService } from './service';
import { VideoConferenceDeprecatedUc } from './uc';

@Module({
	imports: [
		AuthorizationModule,
		AuthorizationReferenceModule, // can be removed wenn video-conference-deprecated is removed
		BoardModule,
		CalendarModule,
		HttpModule,
		LegacySchoolModule,
		LoggerModule,
		RoleModule,
		RoomMembershipModule,
		RoomModule,
		UserModule,
		CourseModule,
		UserModule,
	],
	providers: [
		BBBService,
		VideoConferenceRepo,
		// TODO: N21-1010 clean up video conferences - remove repos
		TeamRepo,
		VideoConferenceService,
		// TODO: N21-885 remove VideoConferenceDeprecatedUc from providers
		VideoConferenceDeprecatedUc,
	],
	// TODO: N21-885 remove VideoConferenceDeprecatedController from exports
	controllers: [VideoConferenceDeprecatedController],
	exports: [BBBService, VideoConferenceService],
})
export class VideoConferenceModule {}
