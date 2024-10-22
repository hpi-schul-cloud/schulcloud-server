import { CalendarModule } from '@infra/calendar';
import { AuthorizationModule } from '@modules/authorization';
import { AuthorizationReferenceModule } from '@modules/authorization-reference/authorization-reference.module';
import { LegacySchoolModule } from '@modules/legacy-school';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TeamsRepo } from '@shared/repo';
import { VideoConferenceRepo } from '@shared/repo/videoconference/video-conference.repo';
import { LoggerModule } from '@src/core/logger';
import { LearnroomModule } from '../learnroom';
import { BBBService } from './bbb';
import { VideoConferenceDeprecatedController } from './controller';
import { VideoConferenceService } from './service';
import { VideoConferenceDeprecatedUc } from './uc';

@Module({
	imports: [
		AuthorizationModule,
		AuthorizationReferenceModule, // can be removed wenn video-conference-deprecated is removed
		CalendarModule,
		HttpModule,
		LegacySchoolModule,
		LoggerModule,
		UserModule,
		LearnroomModule,
		UserModule,
	],
	providers: [
		BBBService,
		VideoConferenceRepo,
		// TODO: N21-1010 clean up video conferences - remove repos
		TeamsRepo,
		VideoConferenceService,
		// TODO: N21-885 remove VideoConferenceDeprecatedUc from providers
		VideoConferenceDeprecatedUc,
	],
	// TODO: N21-885 remove VideoConferenceDeprecatedController from exports
	controllers: [VideoConferenceDeprecatedController],
	exports: [BBBService, VideoConferenceService],
})
export class VideoConferenceModule {}
