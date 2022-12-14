import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CalendarModule } from '@shared/infra/calendar';
import { BBBService } from '@src/modules/video-conference/service/bbb.service';
import { VideoConferenceRepo } from '@shared/repo/videoconference/video-conference.repo';
import { VideoConferenceController } from '@src/modules/video-conference/controller/video-conference.controller';
import { AuthorizationModule } from '@src/modules/authorization';
import { VideoConferenceUc } from '@src/modules/video-conference/uc/video-conference.uc';
import { CourseRepo, SchoolRepo, TeamsRepo, UserRepo } from '@shared/repo';
import { SchoolModule } from '@src/modules/school/school.module';
import { VideoConferenceResponseMapper } from '@src/modules/video-conference/mapper/vc-response.mapper';
import { LoggerModule } from '@src/core/logger';
import { ConverterUtil } from '@shared/common';
import { SchoolService } from '../school';

@Module({
	imports: [AuthorizationModule, CalendarModule, HttpModule, SchoolModule, LoggerModule],
	controllers: [VideoConferenceController],
	providers: [
		VideoConferenceUc,
		BBBService,
		SchoolRepo,
		VideoConferenceRepo,
		TeamsRepo,
		CourseRepo,
		UserRepo,
		SchoolService,
		VideoConferenceResponseMapper,
		ConverterUtil,
	],
})
export class VideoConferenceModule {}
