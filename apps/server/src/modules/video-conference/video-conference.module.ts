import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CalendarModule } from '@shared/infra/calendar';
import { VideoConferenceRepo } from '@shared/repo/videoconference/video-conference.repo';
import { AuthorizationModule } from '@src/modules/authorization';
import { TeamsRepo } from '@shared/repo';
import { LegacySchoolModule } from '@src/modules/legacy-school';
import { LoggerModule } from '@src/core/logger';
import { ConverterUtil } from '@shared/common';
import { UserModule } from '@src/modules/user';
import { BBBService, BbbSettings } from './bbb';
import { VideoConferenceService } from './service';
import { VideoConferenceDeprecatedUc } from './uc';
import { VideoConferenceDeprecatedController } from './controller';
import VideoConferenceConfiguration from './video-conference-config';
import { VideoConferenceSettings } from './interface';
import { LearnroomModule } from '../learnroom';

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
