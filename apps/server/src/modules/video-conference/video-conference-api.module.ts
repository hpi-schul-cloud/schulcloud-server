import { ConfigurationModule } from '@infra/configuration';
import { AuthorizationModule } from '@modules/authorization';
import { BoardContextApiHelperModule } from '@modules/board-context';
import { LegacySchoolModule } from '@modules/legacy-school';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { VideoConferenceController } from './controller';
import {
	VideoConferenceCreateUc,
	VideoConferenceEndUc,
	VideoConferenceFeatureService,
	VideoConferenceInfoUc,
	VideoConferenceJoinUc,
} from './uc';
import { VIDEO_CONFERENCE_CONFIG_TOKEN, VideoConferenceConfig } from './video-conference-config';
import { VideoConferenceModule } from './video-conference.module';
import { LoggerModule } from '@infra/logger';

@Module({
	imports: [
		VideoConferenceModule,
		UserModule,
		AuthorizationModule,
		BoardContextApiHelperModule,
		LegacySchoolModule,
		ConfigurationModule.register(VIDEO_CONFERENCE_CONFIG_TOKEN, VideoConferenceConfig),
		LoggerModule,
	],
	controllers: [VideoConferenceController],
	providers: [
		VideoConferenceCreateUc,
		VideoConferenceJoinUc,
		VideoConferenceEndUc,
		VideoConferenceInfoUc,
		VideoConferenceFeatureService,
	],
})
export class VideoConferenceApiModule {}
