import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { BoardModule } from '@modules/board';
import { LearnroomModule } from '@modules/learnroom';
import { LessonModule } from '@modules/lesson';
import { RoomModule } from '@modules/room';
import { RoomMembershipModule } from '@modules/room-membership';
import { SchoolModule } from '@modules/school';
import { TaskModule } from '@modules/task';
import { Module } from '@nestjs/common';
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
		RoomMembershipModule,
		RoomModule,
		SchoolModule,
		LoggerModule,
	],
	controllers: [ShareTokenController],
	providers: [ShareTokenUC],
})
export class SharingApiModule {}
