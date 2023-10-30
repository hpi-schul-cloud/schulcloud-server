import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { UserModule } from '../user/user.module';
import { VideoConferenceController } from './controller/video-conference.controller';
import { VideoConferenceCreateUc } from './uc/video-conference-create.uc';
import { VideoConferenceEndUc } from './uc/video-conference-end.uc';
import { VideoConferenceInfoUc } from './uc/video-conference-info.uc';
import { VideoConferenceJoinUc } from './uc/video-conference-join.uc';
import { VideoConferenceModule } from './video-conference.module';

@Module({
	imports: [VideoConferenceModule, UserModule, AuthorizationModule],
	controllers: [VideoConferenceController],
	providers: [VideoConferenceCreateUc, VideoConferenceJoinUc, VideoConferenceEndUc, VideoConferenceInfoUc],
})
export class VideoConferenceApiModule {}
