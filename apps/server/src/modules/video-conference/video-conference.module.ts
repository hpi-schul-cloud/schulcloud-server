import { Module } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { VideoConferenceController } from '@src/modules/video-conference/controller/video-conference.controller';
import { VideoConferenceUc } from '@src/modules/video-conference/uc/video-conference.uc';
import { AuthorizationModule } from '@src/modules';
import { CalendarModule } from '@shared/infra/calendar';
import { BBBService } from '@src/modules/video-conference/service/bbb.service';
import { VideoConferenceRepo } from '@shared/repo/videoconference/video-conference.repo';

@Module({
	imports: [AuthorizationModule, CalendarModule],
	controllers: [VideoConferenceController],
	providers: [VideoConferenceUc, BBBService, VideoConferenceRepo, HttpService],
})
export class VideoConferenceModule {}
