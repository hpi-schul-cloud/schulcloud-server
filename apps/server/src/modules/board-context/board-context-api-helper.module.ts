import { ConfigurationModule } from '@infra/configuration';
import { CourseModule } from '@modules/course';
import { UserModule } from '@modules/user';
import { VIDEO_CONFERENCE_PUBLIC_API_CONFIG, VideoConferencePublicApiConfig } from '@modules/video-conference';
import { Module } from '@nestjs/common';
import { BoardModule } from '../board/board.module';
import { LegacySchoolModule } from '../legacy-school';
import { RoomModule } from '../room';
import { BoardContextApiHelperService } from './board-context-api-helper.service';
import { BOARD_CONTEXT_PUBLIC_API_CONFIG, BoardContextPublicApiConfig } from './board-context.config';

@Module({
	imports: [
		BoardModule,
		CourseModule,
		RoomModule,
		LegacySchoolModule,
		UserModule,
		ConfigurationModule.register(VIDEO_CONFERENCE_PUBLIC_API_CONFIG, VideoConferencePublicApiConfig),
		ConfigurationModule.register(BOARD_CONTEXT_PUBLIC_API_CONFIG, BoardContextPublicApiConfig),
	],
	providers: [BoardContextApiHelperService],
	exports: [BoardContextApiHelperService],
})
export class BoardContextModule {}
