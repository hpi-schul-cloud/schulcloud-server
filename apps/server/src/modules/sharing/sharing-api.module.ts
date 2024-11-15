import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '../authorization';
import { BoardModule } from '../board';
import { LearnroomModule } from '../learnroom';
import { LessonModule } from '../lesson';
import { RoomModule } from '../room';
import { RoomMemberModule } from '../room-member';
import { SchoolModule } from '../school';
import { TaskModule } from '../task';
import { ShareTokenController } from './controller/share-token.controller';
import { SharingModule } from './sharing.module';
import { ShareTokenUC } from './uc';

@Module({
	imports: [
		SharingModule,
		AuthorizationModule,
		LearnroomModule,
		LessonModule,
		TaskModule,
		BoardModule,
		RoomMemberModule,
		RoomModule,
		SchoolModule,
		LoggerModule,
	],
	controllers: [ShareTokenController],
	providers: [ShareTokenUC],
})
export class SharingApiModule {}
