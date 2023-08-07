import { Module } from '@nestjs/common';
import { UserModule } from '@src/modules/user';
import { AuthorizationModule } from '@src/modules/authorization';
import { VideoConferenceController } from './controller';
import { VideoConferenceCreateUc, VideoConferenceJoinUc, VideoConferenceEndUc, VideoConferenceInfoUc } from './uc';
import { VideoConferenceModule } from './video-conference.module';

@Module({
	imports: [VideoConferenceModule, UserModule, AuthorizationModule],
	controllers: [VideoConferenceController],
	providers: [VideoConferenceCreateUc, VideoConferenceJoinUc, VideoConferenceEndUc, VideoConferenceInfoUc],
})
export class VideoConferenceApiModule {}
