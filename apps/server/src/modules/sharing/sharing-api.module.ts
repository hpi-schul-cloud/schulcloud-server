import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { BoardModule } from '@modules/board';
import { CourseModule } from '@modules/course';
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
import { SagaModule } from '@modules/saga';

@Module({
	imports: [
		SharingModule,
		AuthorizationModule,
		CourseModule,
		LearnroomModule,
		LessonModule,
		TaskModule,
		BoardModule,
		RoomMembershipModule,
		RoomModule,
		SchoolModule,
		LoggerModule,
		SagaModule,
	],
	controllers: [ShareTokenController],
	providers: [ShareTokenUC],
})
export class SharingApiModule {}
