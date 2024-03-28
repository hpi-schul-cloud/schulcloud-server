import { AuthorizationModule } from '@modules/authorization';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { VideoConferenceController } from './controller';
import { VideoConferenceCreateUc, VideoConferenceEndUc, VideoConferenceInfoUc, VideoConferenceJoinUc } from './uc';
import { VideoConferenceModule } from './video-conference.module';

@Module({
	imports: [VideoConferenceModule, UserModule, AuthorizationModule],
	controllers: [VideoConferenceController],
	providers: [VideoConferenceCreateUc, VideoConferenceJoinUc, VideoConferenceEndUc, VideoConferenceInfoUc],
})
export class VideoConferenceApiModule {}
