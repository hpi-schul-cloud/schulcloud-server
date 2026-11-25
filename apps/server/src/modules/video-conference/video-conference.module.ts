import { ConfigurationModule } from '@infra/configuration';
import { AuthorizationModule } from '@modules/authorization';
import { BoardModule } from '@modules/board';
import { CourseModule } from '@modules/course';
import { RoomModule } from '@modules/room';
import { RoomMembershipModule } from '@modules/room-membership';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { BBBService } from './bbb';
import { VideoConferenceRepo } from './repo';
import { VideoConferenceService } from './service';
import { VIDEO_CONFERENCE_CONFIG_TOKEN, VideoConferenceConfig } from './video-conference-config';

@Module({
	imports: [
		ConfigurationModule.register(VIDEO_CONFERENCE_CONFIG_TOKEN, VideoConferenceConfig),
		AuthorizationModule,
		BoardModule,
		HttpModule,
		RoomMembershipModule,
		RoomModule,
		CourseModule,
		UserModule,
	],
	providers: [BBBService, VideoConferenceRepo, VideoConferenceService],
	exports: [BBBService, VideoConferenceService],
})
export class VideoConferenceModule {}
