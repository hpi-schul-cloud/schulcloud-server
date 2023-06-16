import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CalendarModule } from '@shared/infra/calendar';
import { VideoConferenceRepo } from '@shared/repo/videoconference/video-conference.repo';
import { AuthorizationModule } from '@src/modules/authorization';
import { CourseRepo, TeamsRepo, UserRepo } from '@shared/repo';
import { SchoolModule } from '@src/modules/school/school.module';
import { LoggerModule } from '@src/core/logger';
import { ConverterUtil } from '@shared/common';
import { UserModule } from '@src/modules/user';
import { RoleModule } from '@src/modules/role';
import { BBBService, BbbSettings } from './bbb';
import { VideoConferenceService } from './service';
import { VideoConferenceDeprecatedUc } from './uc';
import { VideoConferenceDeprecatedController } from './controller';
import VideoConferenceConfiguration from './video-conference-config';
import { VideoConferenceSettings } from './interface';

@Module({
	imports: [AuthorizationModule, CalendarModule, HttpModule, SchoolModule, LoggerModule, UserModule, RoleModule],
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
		TeamsRepo,
		CourseRepo,
		UserRepo,
		ConverterUtil,
		VideoConferenceService,
		// TODO: remove VideoConferenceDeprecatedUc from providers
		VideoConferenceDeprecatedUc,
	],
	// TODO: remove VideoConferenceDeprecatedController from exports
	controllers: [VideoConferenceDeprecatedController],
	exports: [BBBService, VideoConferenceService],
})
export class VideoConferenceModule {}
