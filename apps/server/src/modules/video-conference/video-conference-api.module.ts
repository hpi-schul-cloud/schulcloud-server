import { AuthorizationModule } from '@modules/authorization';
import { BoardContextApiHelperModule } from '@modules/board-context';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { LearnroomModule } from '@modules/learnroom';
import { LegacySchoolModule } from '@modules/legacy-school';
import { VideoConferenceController } from './controller';
import {
	VideoConferenceCreateUc,
	VideoConferenceEndUc,
	VideoConferenceInfoUc,
	VideoConferenceJoinUc,
	VideoConferenceFeatureService,
} from './uc';
import { VideoConferenceModule } from './video-conference.module';

@Module({
	imports: [
		VideoConferenceModule,
		UserModule,
		AuthorizationModule,
		BoardContextApiHelperModule,
		LearnroomModule,
		LegacySchoolModule,
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
