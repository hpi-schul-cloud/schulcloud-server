import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConverterUtil } from '@shared/common/utils/converter.util';
import { CalendarModule } from '@shared/infra/calendar/calendar.module';
import { TeamsRepo } from '@shared/repo/teams/teams.repo';
import { VideoConferenceRepo } from '@shared/repo/videoconference/video-conference.repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { LearnroomModule } from '../learnroom/learnroom.module';
import { LegacySchoolModule } from '../legacy-school/legacy-school.module';
import { UserModule } from '../user/user.module';
import { BbbSettings } from './bbb/bbb-settings.interface';
import { BBBService } from './bbb/bbb.service';
import { VideoConferenceDeprecatedController } from './controller/video-conference-deprecated.controller';
import { VideoConferenceSettings } from './interface/video-conference-settings.interface';
import { VideoConferenceService } from './service/video-conference.service';
import { VideoConferenceDeprecatedUc } from './uc/video-conference-deprecated.uc';

import VideoConferenceConfiguration from './video-conference-config';

@Module({
	imports: [
		AuthorizationModule,
		CalendarModule,
		HttpModule,
		LegacySchoolModule,
		LoggerModule,
		UserModule,
		LearnroomModule,
		UserModule,
	],
	providers: [
		{
			provide: VideoConferenceSettings,
			useValue: VideoConferenceConfiguration.videoConference,
		},
		{
			provide: BbbSettings,
			useValue: VideoConferenceConfiguration.bbb,
		},
		BBBService,
		VideoConferenceRepo,
		// TODO: N21-1010 clean up video conferences - remove repos
		TeamsRepo,
		ConverterUtil,
		VideoConferenceService,
		// TODO: N21-885 remove VideoConferenceDeprecatedUc from providers
		VideoConferenceDeprecatedUc,
	],
	// TODO: N21-885 remove VideoConferenceDeprecatedController from exports
	controllers: [VideoConferenceDeprecatedController],
	exports: [BBBService, VideoConferenceService],
})
export class VideoConferenceModule {}
