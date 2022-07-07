import { Module } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { VideoConferenceController } from '@src/modules/video-conference/controller/video-conference.controller';
import { VideoConferenceUc } from '@src/modules/video-conference/uc/video-conference.uc';
import { VideoConferenceService } from '@src/modules/video-conference/service/video-conference.service';
import { AuthorizationModule } from '@src/modules';
import { CalendarModule } from '@shared/infra/calendar';

@Module({
	imports: [AuthorizationModule, CalendarModule],
	controllers: [VideoConferenceController],
	providers: [VideoConferenceUc, VideoConferenceService, HttpService],
})
export class VideoConferenceModule {}
